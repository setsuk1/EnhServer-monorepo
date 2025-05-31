import type { Socket } from "socket.io";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SocketEventList } from "../EventList/SocketEventList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import type { ISocketResponse } from "../interface/ISocketResponse.js";
import type { IBroadcastInRoomData } from "../interface/msg/IBroadcastInRoomData.js";
import type { IBroadcastToAllData } from "../interface/msg/IBroadcastToAllData.js";
import type { IUnicastData } from "../interface/msg/IUnicastData.js";
import type { SocketServer } from "../SocketServer.js";

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
        console.log(`${socket.id} send to ${data.target}`);
        socket.to(data.target).emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.UNICAST, data.data), socket.id);
        callback?.({ success: "ok" });
    }

    onBroadcastInRoom(socket: Socket, data: IBroadcastInRoomData, callback?: (resp: ISocketResponse) => void) {
        console.log(`${socket.id} broadcast in room ${data.room}`);
        socket.in(data.room).emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.BROADCAST_IN_ROOM, data.data), socket.id);
        callback?.({ success: "ok" });
    }

    onBroadcastToAll(socket: Socket, data: IBroadcastToAllData, callback?: (resp: ISocketResponse) => void) {
        socket.broadcast.emit(SocketEventList.USER, new SocketMessage(UserEventTypeList.MSG.BROADCAST_TO_ALL, data.data), socket.id);
        callback?.({ success: "ok" });
    }
}