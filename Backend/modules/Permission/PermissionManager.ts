import { statements } from "../../database/statements.js";
import { IPermissionFullResult } from "../../interfaces/Permission/manager/IFullPermission.js";
import { IPermissionResult } from "../../interfaces/Permission/manager/IPermissionResult.js";
import { IPermissionUpdateResult } from "../../interfaces/Permission/manager/IPermissionUpdateResult.js";
import { db } from "../../main.js";
import { VarTableResp, varTblMgr } from "../VariableTable/VariableTableManager.js";


export class PermissionManager {
    async getUserIdByEntryId(entryId: number) {
        const conn = await db.getConn();
        const contentResult = await statements.permission.GET_ENTRY_CONTENT_BY_ID.exec(conn, entryId);
        await conn.release();

        const [targetKey, targetId] = Object.entries(contentResult || {}).find(([key, value]) => {
            if (value != null)
                return true;
            return false;
        }) || [];

        switch (targetKey) {
            case "tTableId": {
                const result = await varTblMgr.getVarTableDataById(targetId);
                if(result.type == VarTableResp.SUCCESS) {
                    return result.data.belong_acc;
                }
            }
        }
        return undefined;
    }

    async checkEntryWithUserId(entryId: number, userId: number) {
        const targetUserId = await this.getUserIdByEntryId(entryId);

        return targetUserId == userId;
    }

    async insertOrUpdatePermission(data: IPermissionFullResult, userId: number) {
        let status = false;
        if (data.id > 0) {
            status = await this.updatePermission(data as IPermissionUpdateResult);
        } else {
            const check = this.checkEntryWithUserId(data.rEntryId, userId);
            if (check) {
                const conn = await db.getConn();
                const result = await statements.permission.ADD_PERMISSION.exec(conn, data.rEntryId, data.tDomain, data.tTokenId, data.tUserId, data.tGroupId, data.pRead, data.pWrite, data.pUpdate, data.pDelete);
                status = !!result.affectedRows
                await conn.release();
            }
        }
        return status;
    }

    async updatePermission(data: IPermissionUpdateResult) {
        if (data?.id <= 0)
            return false;
        const conn = await db.getConn();
        const result = await statements.permission.UPSERT_PERMISSION_BY_ID.exec(conn, data.id, data.tDomain, data.tTokenId, data.tUserId, data.tGroupId, data.pRead, data.pWrite, data.pUpdate, data.pDelete);
        const status = !!result.affectedRows;
        await conn.release();
        return status;
    }

    async getPermissionById(permId: number) {
        const conn = await db.getConn();
        const result = await statements.permission.GET_PERMISSION_BY_ID.exec(conn, permId);
        await conn.release();
        return result;
    }

    async getEntryIdByPermissionId(permId: number) {
        const conn = await db.getConn();
        const result = await statements.permission.GET_ENTRY_ID_BY_PERMISSION_ID.exec(conn, permId);
        await conn.release();
        return result;
    }

    async getPermissionsByEntryId(rEntryId: number) {
        const conn = await db.getConn();
        const result = await statements.permission.GET_PERMISSIONS_BY_ENTRY_ID.exec(conn, rEntryId);
        await conn.release();
        return result;
    }
    async queryPermission(
        rEntryId: number, domain?: string, tokenId?: number, userId?: number
    ): Promise<IPermissionResult> {
        if (!rEntryId)
            return { pRead: false, pWrite: false, pDelete: false, pUpdate: false };

        const conn = await db.getConn();
        const [rows] = await statements.permission.GET_PERMISSION.exec(
            conn,
            rEntryId, domain ?? null,
            tokenId ?? null,
            userId ?? null, null
        );
        await conn.release();

        const { pRead = 0, pWrite = 0, pDelete = 0, pUpdate = 0 } = rows || {};
        return { pRead: !!pRead, pWrite: !!pWrite, pDelete: !!pDelete, pUpdate: !!pUpdate };
    }

    async queryVarTablePermission(
        tableId: number, domain?: string, tokenId?: number, userId?: number
    ) {
        const rEntryId = await this.getEntryIdByVarTableId(tableId);
        return this.queryPermission(rEntryId, domain ?? null, tokenId ?? null, userId ?? null);
    }

    async getEntryIdByVarTableId(tableId: number) {
        const conn = await db.getConn();
        const rEntryId = await statements.permission.GET_ENTRY_ID_BY_VAR_TABLE_ID.exec(conn, tableId)
        await conn.release();
        return rEntryId;
    }
}
export const permMgr = new PermissionManager();