import { Socket } from "socket.io";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { IVarTablePermissionData } from "../../../interfaces/Permission/IVarTablePermissionData.js";
import { findUserAndTokenIdByToken } from "../../../routes/handler/tokenHandler.js";
import { transVarTblInfo } from "../../../routes/helper/variableTable.js";
import { Logger } from "../../Console/Logger.js";
import { VarTableResp, varTblMgr } from "../../VariableTable/VariableTableManager.js";
import { RespTypeList } from "../EventList/RespTypeList.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { ISocketResponse } from "../interface/ISocketResponse.js";
import { IVarTableDeleteValue } from "../interface/var/IVarTableDeleteValue.js";
import { IVarTableGetValue } from "../interface/var/IVarTableGetValue.js";
import { IVarTableListValue } from "../interface/var/IVarTableListValue.js";
import { IVarTablePermission } from "../interface/var/IVarTablePermission.js";
import { IVarTableSetValue } from "../interface/var/IVarTableSetValue.js";
import { SocketServer } from "../SocketServer.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.VARIABLE_TABLE_MANAGER);

export class VariableTableManager {
    protected _server: SocketServer;

    constructor(server: SocketServer) {
        this._server = server;
        this.setupListenerForEvt();
    }

    protected setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.MANAGER.VARTABLE_MANAGER, this.onVarRelated, this);
    }

    protected onVarRelated(socket: Socket, data: SocketMessage<any>, callback: (resp: ISocketResponse) => void) {
        switch (data.type) {
            case UserEventTypeList.VAR.DELETE_VALUE:
                this.onDeleteValue(socket, data, callback);
                break;
            case UserEventTypeList.VAR.GET_VALUE:
                this.onGetValue(socket, data, callback);
                break;
            case UserEventTypeList.VAR.SET_VALUE:
                this.onSetValue(socket, data, callback);
                break;
            case UserEventTypeList.VAR.LIST_VALUE:
                this.onListValue(socket, data, callback);
                break;
            case UserEventTypeList.VAR.LIST_TABLE:
                this.onListTable(socket, data, callback);
                break;
        }
    }

    protected async getPermissionObject(socket: Socket, msg: SocketMessage<IVarTablePermission>): Promise<IVarTablePermissionData> {
        const tokenData = await findUserAndTokenIdByToken(msg.data.token);
        const permObj: IVarTablePermissionData = {
            tableId: msg.data.tableId,
            domain: socket.request.headers.host,
            tokenId: tokenData?.id,
            userId: this._server.accountManager.getValue(socket)?.userId
        }
        return permObj;
    }

    async onDeleteValue(socket: Socket, msg: SocketMessage<IVarTableDeleteValue>, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] delete value in table [${msg.data.tableId}]`);
        const permission = await this.getPermissionObject(socket, msg);
        const resp = await varTblMgr.deleteValueWithPerm(msg.data.key, permission);
        switch(resp.type) {
            case VarTableResp.NO_DELETE_PERMISSION:
                logger.println(`Socket [${socket.id}] failed to delete value in table [${msg.data.tableId}], reason: No delete permission.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_NO_DELETE_PERMISSION) })
            case VarTableResp.VALUE_NOT_CHANGE:
                logger.println(`Socket [${socket.id}] failed to list value in table [${msg.data.tableId}], reason: Value not change.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_VALUE_NOT_CHANGE) })
        }
        const data = resp.data;
        callback({ success: new SocketMessage(RespTypeList.SUCCESS, data.affectedRows) })
    }

    async onSetValue(socket: Socket, msg: SocketMessage<IVarTableSetValue>, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] set value in table [${msg.data.tableId}]`);
        const permission = await this.getPermissionObject(socket, msg);
        const resp = await varTblMgr.setValueWithPerm(msg.data.key, msg.data.value, permission);
        switch(resp.type) {
            case VarTableResp.NO_WRITE_PERMISSION:
                logger.println(`Socket [${socket.id}] failed to set value in table [${msg.data.tableId}], reason: No write permission.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_NO_WRITE_PERMISSION) })
            case VarTableResp.NO_ENTRY:
                logger.println(`Socket [${socket.id}] failed to set value in table [${msg.data.tableId}], reason: No entry.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_VALUE_NOT_CHANGE) })
        }
        callback({ success: new SocketMessage(RespTypeList.SUCCESS) })
    }

    async onGetValue(socket: Socket, msg: SocketMessage<IVarTableGetValue>, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] get value in table [${msg.data.tableId}]`);
        const permission = await this.getPermissionObject(socket, msg);
        const resp = await varTblMgr.getValueWithPerm(msg.data.key, permission);
        switch(resp.type) {
            case VarTableResp.NO_READ_PERMISSION:
                logger.println(`Socket [${socket.id}] failed to get value in table [${msg.data.tableId}], reason: No read permission.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_NO_READ_PERMISSION) })
            case VarTableResp.KEY_NOT_FOUND:
                logger.println(`Socket [${socket.id}] failed to get value in table [${msg.data.tableId}], reason: Key not found.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_KEY_NOT_FOUND) })
        }
        const data = resp.data;
        callback({ success: new SocketMessage(RespTypeList.SUCCESS, data[0]) })
    }

    async onListValue(socket: Socket, msg: SocketMessage<IVarTableListValue>, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] list value in table [${msg.data.tableId}]`);
        const permission = await this.getPermissionObject(socket, msg);
        const resp = await varTblMgr.listValueWithPerm(permission);
        switch(resp.type) {
            case VarTableResp.NO_READ_PERMISSION:
                logger.println(`Socket [${socket.id}] failed to list value in table [${msg.data.tableId}], reason: No read permission.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_NO_READ_PERMISSION) })
            case VarTableResp.NO_ENTRY:
                logger.println(`Socket [${socket.id}] failed to list value in table [${msg.data.tableId}], reason: No entry.`, LOG_LEVEL.VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.VAR_NO_ENTRY) })
        }
        const data = resp.data;
        callback({ success: new SocketMessage(RespTypeList.SUCCESS, data) })
    }

    async onListTable(socket: Socket, data: SocketMessage<any>, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] list all tables`);
        const userId = this._server.accountManager.getValue(socket)?.userId
        const rawData = await varTblMgr.listAllTable();

        const transformedData = rawData.map(v => transVarTblInfo(userId, v));

        callback({ success: new SocketMessage(RespTypeList.SUCCESS, transformedData) })
    }
}