import { Socket } from "socket.io";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { Logger } from "../../Console/Logger.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SocketEventList } from "../EventList/SocketEventList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { ISocketResponse } from "../interface/ISocketResponse.js";
import { IBroadcastInRoomData } from "../interface/msg/IBroadcastInRoomData.js";
import { IBroadcastToAllData } from "../interface/msg/IBroadcastToAllData.js";
import { IUnicastData } from "../interface/msg/IUnicastData.js";
import { SocketServer } from "../SocketServer.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.MESSAGE_MANAGER);

export class MessageManager {
    protected _server: SocketServer;

    constructor(server: SocketServer) {
        this._server = server;
        this.setupListenerForEvt();
    }

    setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.MANAGER.MSG_MANAGER, this.onMsgRelated, this);
    }

    onMsgRelated(socket: Socket, data: SocketMessage<any>, callback: (resp: ISocketResponse) => void) {
        switch (data.type) {
            case UserEventTypeList.MSG.UNICAST:
                this.onUnicast(socket, data.data, callback);
                break;
            case UserEventTypeList.MSG.BROADCAST_IN_ROOM:
                this.onBroadcastInRoom(socket, data.data, callback);
                break;
            case UserEventTypeList.MSG.BROADCAST_TO_ALL:
                this.onBroadcastToAll(socket, data, callback);
                break;
        }
    }

    onUnicast(socket: Socket, data: IUnicastData, callback?: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] send data to socket [${data.target}]`);
        logger.println(`Data: ${data.data}`, LOG_LEVEL.MOST_VERBOSE);
        socket.to(data.target).emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.UNICAST, data.data), socket.id);
        callback?.({ success: "ok" });
    }

    onBroadcastInRoom(socket: Socket, data: IBroadcastInRoomData, callback?: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] broadcast data in room [${Array.isArray(data.room) ? data.room.join(",") : data.room}]`);
        logger.println(`Data: ${data.data}`, LOG_LEVEL.MOST_VERBOSE);
        socket.in(data.room).emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.BROADCAST_IN_ROOM, data.data), socket.id);
        callback?.({ success: "ok" });
    }

    onBroadcastToAll(socket: Socket, data: IBroadcastToAllData, callback?: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] broadcast data to all sockets`);
        logger.println(`Data: ${data.data}`, LOG_LEVEL.MOST_VERBOSE);
        socket.broadcast.emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.BROADCAST_TO_ALL, data.data), socket.id);
        callback?.({ success: "ok" });
    }
}