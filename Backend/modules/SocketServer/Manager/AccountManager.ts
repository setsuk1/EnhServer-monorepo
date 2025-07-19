import { Socket } from "socket.io";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { Logger } from "../../Console/Logger.js";
import { SocketEventList } from "../EventList/SocketEventList.js";
import { SystemEventTypeList } from "../EventList/SystemEventTypeList.js";

interface IAccountMapping {
    userId?: number;
}

const IAccountMappingKeys = ["userId"];
const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.ACCOUNT_MANAGER)

/**
 * This class is to record the relationship between account and socket.
 */
export class AccountManager {
    protected map = new Map<Socket, IAccountMapping>();

    protected preCheck(socket: Socket, key: string, value: any) {
        if (key != "userId")
            return;
        for (const [_sock, _data] of this.map.entries()) {
            if (_sock.request.headers.host == socket.request.headers.host && _data.userId == value) {
                logger.println(`Account ${_data.userId} has been in game [${socket.request.headers.host}], disconnect old one`);
                _sock.emit(SocketEventList.SYSTEM, { type: SystemEventTypeList.REPLACED });
                _sock.disconnect(true);
                this.map.delete(_sock);
                break;
            }
        }

    }

    async setValue(socket: Socket, key: string, value: any) {
        this.preCheck(socket, key, value);
        let obj = this.map.get(socket);
        if (!obj)
            this.map.set(socket, obj = {});
        if (!IAccountMappingKeys.includes(key)) {
            logger.println(`Key [${key}] cannot be write to accountManager`, LOG_LEVEL.VERBOSE);
            return;
        }
        obj[key] = value;
    }

    getValue(socket: Socket): IAccountMapping {
        return this.map.get(socket);
    }

    remove(socket: Socket) {
        if (!this.map.has(socket)) {
            logger.println(`Remove socket ${socket.id} failed, not found.`, LOG_LEVEL.MORE_VERBOSE);
            return false;
        }
        const delStat = this.map.delete(socket);
        if (delStat)
            logger.println(`Remove socket ${socket.id} success.`, LOG_LEVEL.MORE_VERBOSE);
        else
            logger.println(`Remove socket ${socket.id} failed, returning false.`, LOG_LEVEL.MORE_VERBOSE);
        return delStat;
    }
}