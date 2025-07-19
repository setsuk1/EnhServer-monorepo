import { UpsertResult } from "mariadb";
import { statements } from "../../database/statements.js";
import { IVarTablePermissionData } from "../../interfaces/Permission/IVarTablePermissionData.js";
import { IPermissionResult } from "../../interfaces/Permission/manager/IPermissionResult.js";
import { db } from "../../main.js";
import { Message } from "../../other/Message.js";
import { checkPosInt } from "../../routes/helper/common.js";
import { permMgr } from "../Permission/PermissionManager.js";

export enum VarTableResp {
    SUCCESS = 1,

    NO_READ_PERMISSION,
    NO_WRITE_PERMISSION,
    NO_DELETE_PERMISSION,
    NO_UPDATE_PERMISSION,
    KEY_NOT_FOUND,
    VALUE_NOT_CHANGE,
    NO_ENTRY,
    DUPLICATED,
}

export const varTblMgr = {
    async getPermission(data: IVarTablePermissionData): Promise<IPermissionResult> {
        if (!data)
            return { pRead: false, pWrite: false, pDelete: false, pUpdate: false };

        let inputData: [domain: string, tokenId: number, userId?: number] = [data.domain, data.tokenId];
        if (!inputData[1])
            inputData.push(data.userId);
        
        const result = await permMgr.queryVarTablePermission(data.tableId, inputData[0], inputData[1], inputData[2]);
        return result;
    },

    // shared
    async listValueByTableId(id: number) {
        const conn = await db.getConn();
        const values = await statements.variableTable.QUERY_ENTRY_BY_TABLE_ID.exec(conn, id);
        await conn.release();

        if (!values.length)
            return new Message(VarTableResp.NO_ENTRY);

        return new Message(VarTableResp.SUCCESS, values);
    },

    async setNewValueByTableId(id: number, key: string, value: any) {
        const conn = await db.getConn();
        const [frow] = await statements.variableTable.CREATE_ENTRY.exec(conn, id, key, value);
        await conn.release();

        if (!frow)
            return new Message(VarTableResp.DUPLICATED);

        return new Message(VarTableResp.SUCCESS, frow.id);
    },

    async setValueByTableId(id: number, key: string, value: any) {
        const conn = await db.getConn();
        const [frow] = await statements.variableTable.CREATE_OR_UPDATE_ENTRY.exec(conn, id, key, value);
        await conn.release();
        if (!frow)
            return new Message(VarTableResp.NO_ENTRY);

        return new Message(VarTableResp.SUCCESS, frow.id);
    },

    async deleteValueByTableId(id: number, key: string) {
        const conn = await db.getConn();
        const values = await statements.variableTable.DELETE_ENTRY_BY_TABLE_ID_KEY.exec(conn, id, key);
        await conn.release();

        if (!values.affectedRows)
            return new Message(VarTableResp.VALUE_NOT_CHANGE);

        return new Message(VarTableResp.SUCCESS, values);
    },

    // SocketServer related
    async deleteValueWithPerm(key: string, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pDelete)
            return new Message(VarTableResp.NO_DELETE_PERMISSION);
        return this.deleteValueByTableId(permissionData.tableId, key);
    },

    async setValueWithPerm(key: string, value: any, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pWrite)
            return new Message(VarTableResp.NO_WRITE_PERMISSION);
        return this.setValueByTableId(permissionData.tableId, key, value);
    },

    async getValueWithPerm(key: string, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pRead)
            return new Message(VarTableResp.NO_READ_PERMISSION);

        const conn = await db.getConn();
        const values = await statements.variableTable.QUERY_ENTRY_VALUE_BY_TABLE_ID_KEY.exec(conn, permissionData.tableId, key);
        await conn.release();

        if (!values.length)
            return new Message(VarTableResp.KEY_NOT_FOUND);

        return new Message(VarTableResp.SUCCESS, values);
    },

    async listValueWithPerm(permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pRead)
            return new Message(VarTableResp.NO_READ_PERMISSION);

        return this.listValueByTableId(permissionData.tableId);
    },

    async listAllTable() {
        const conn = await db.getConn();
        const values = await statements.variableTable.QUERY_TABLE_INFO.exec(conn);
        await conn.release();

        return values;
    },

    // frontend related
    async listUserTableByUserId(userId: number) {
        const conn = await db.getConn();
        const infos = await statements.variableTable.QUERY_TABLE_INFO_BY_USER_ID.exec(conn, userId);
        await conn.release();
        return infos;
    },

    async deleteValueById(id: number) {
        const conn = await db.getConn();
        const values = await statements.variableTable.DELETE_ENTRY_BY_ID.exec(conn, id);
        await conn.release();

        if (!values.affectedRows)
            return new Message(VarTableResp.VALUE_NOT_CHANGE);

        return new Message(VarTableResp.SUCCESS, values);
    },

    async deleteValueByIdWithPerm(id: number, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pDelete)
            return new Message(VarTableResp.NO_DELETE_PERMISSION);

        return this.deleteValueById(id);
    },

    async setNewValueWithPerm(key: string, value: any, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pWrite)
            return new Message(VarTableResp.NO_WRITE_PERMISSION);
        return this.setNewValueByTableId(permissionData.tableId, key, value);
    },

    async getVarTableDataById(id: number) {
        const conn = await db.getConn();
        const [info] = await statements.variableTable.QUERY_TABLE_INFO_BY_ID.exec(conn, id);
        await conn.release();
        if (!info) {
            return new Message(VarTableResp.NO_ENTRY);
        }

        return new Message(VarTableResp.SUCCESS, info);
    },

    async checkVarTableByUserId(id: number, userId: number): Promise<boolean> {
        const msg = await this.getVarTableDataById(id);
        return msg.type == VarTableResp.SUCCESS && msg.data.belong_acc == userId;
    },

    async getValueById(id: number) {
        const conn = await db.getConn();
        const [entry] = await statements.variableTable.QUERY_ENTRY_BY_ID.exec(conn, id);
        await conn.release();

        if (!entry)
            return new Message(VarTableResp.KEY_NOT_FOUND);

        return new Message(VarTableResp.SUCCESS, entry);
    },

    async getValueByIdWithPerm(id: number, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pRead)
            return new Message(VarTableResp.NO_READ_PERMISSION);
        return this.getValueById(id);
    },

    async updateValueById(id: number, value: any) {
        const conn = await db.getConn();
        const result = await statements.variableTable.UPDATE_ENTRY_VALUE_BY_ID.exec(conn, id, value);
        await conn.release();
        if (!result.affectedRows) {
            return new Message(VarTableResp.KEY_NOT_FOUND);
        }
        return new Message(VarTableResp.SUCCESS, result);
    },

    async updateValueByIdWithPerm(id: number, value: any, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pUpdate)
            return new Message(VarTableResp.NO_UPDATE_PERMISSION);
        return this.updateValueById(id, value);
    },

    async createTableByUserId(name: string, userId: number) {
        const conn = await db.getConn();
        const result = await statements.variableTable.CREATE_TABLE.exec(conn, userId, name);
        const id = result[0]?.id;
        await conn.release();
        if (!checkPosInt(id)) {
            return new Message(VarTableResp.NO_ENTRY);
        }

        const entryId = await permMgr.getEntryIdByVarTableId(id);
        await permMgr.insertOrUpdatePermission({
            tUserId: userId,
            tDomain: null,
            tGroupId: null,
            tTokenId: null,
            rEntryId: entryId,
            pRead: true,
            pWrite: true,
            pUpdate: true,
            pDelete: true,
        }, userId)
        return new Message(VarTableResp.SUCCESS, id);
    },

    async deleteTableById(id: number) {
        const conn = await db.getConn();
        const result = await statements.variableTable.DELETE_TABLE_BY_ID.exec(conn, id);
        await conn.release();
        if (!result.affectedRows) {
            return new Message(VarTableResp.VALUE_NOT_CHANGE);
        }
        return new Message(VarTableResp.SUCCESS);
    },

    async deleteTableWithPerm(permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pWrite) {
            return new Message(VarTableResp.NO_WRITE_PERMISSION);
        }
        return this.deleteTableById(permissionData.tableId);
    },

    async renameTableById(name: string, id: number) {
        const conn = await db.getConn();
        const result: UpsertResult = await statements.variableTable.UPDATE_TABLE_NICKNAME_BY_ID.exec(conn, id, name);
        await conn.release();
        if (!result.affectedRows)
            return new Message(VarTableResp.NO_ENTRY);
        return new Message(VarTableResp.SUCCESS);
    },

    async renameTableWithPerm(name: string, permissionData: IVarTablePermissionData) {
        const permission = await this.getPermission(permissionData);
        if (!permission.pUpdate) {
            return new Message(VarTableResp.NO_UPDATE_PERMISSION);
        }
        return this.renameTableById(name, permissionData.tableId);
    }
};