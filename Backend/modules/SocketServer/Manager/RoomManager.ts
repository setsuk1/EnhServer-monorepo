import type { Socket } from "socket.io";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { UidTable } from "../Helper/UidTable.js";
import type { ISocketResponse } from "../interface/ISocketResponse.js";
import type { ICreateRoomData } from "../interface/room/ICreateRoomData.js";
import type { IJoinRoomData } from "../interface/room/IJoinRoomData.js";
import type { SocketServer } from "../SocketServer.js";

interface IRoomData {
    title: string
    password?: string;
    createTime: number;
}


interface IListRoomData {
    type: "Global" | "Project" | "Room" | "custom"
}

export class RoomManager {
    // protected _roomData = new Map<string, IRoomData>();
    protected _uidManager = new UidTable();
    protected _server: SocketServer;

    constructor(server: SocketServer) {
        this._server = server;
        this.setupListenerForEvt()
    }

    list() {
        return this._uidManager.list();
    }

    destroy(roomCode: string) {
        if (!this._uidManager.has(roomCode))
            return;

        this._uidManager.delete(roomCode);
    }

    joinCheck(data: IJoinRoomData) {
        if (!data?.id)
            return false;

        let room = this._uidManager.get(data.id);
        if (!room)
            return false;

        if (room.password && room.password != data.password)
            return false;

        return true;
    }

    create(data: ICreateRoomData) {
        let roomData = Object.assign(JSON.parse(JSON.stringify(data)), { createTime: Date.now() })
        let uid = this._uidManager.generateUid(`${data.area ?? "room"}_`, 10, roomData);
        return uid;
    }

    setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.MANAGER.ROOM_MANAGER, this.onRoomRelated, this);
        this._server.emitter.on("socket_disconnect", async (socket: Socket) => {
            console.log("Room manager handling disconnect");
            for (let [room, data] of this.list()) {
                let sockList = await socket.nsp.in(room).fetchSockets();
                if (sockList.length <= 1) {
                    this.destroy(room);
                }
            }
        });
    }

    async leaveRoom(socket: Socket, room: string) {
        console.log("Leave room");
        let socketCounts = await socket.nsp.in(room).fetchSockets();
        if (socketCounts.length <= 1) {
            this.destroy(room);
        }
        socket.leave(room);
    }

    onRoomRelated(socket: Socket, data: SocketMessage<any>, callback: (resp: ISocketResponse) => void) {
        switch (data.type) {
            case UserEventTypeList.ROOM.CREATE:
                this.onCreateRoom(socket, data.data, callback);
                break;
            case UserEventTypeList.ROOM.JOIN:
                this.onJoinRoom(socket, data.data, callback);
                break;
            case UserEventTypeList.ROOM.LEAVE:
                this.onLeaveRoom(socket, data.data, callback);
                break;
            case UserEventTypeList.ROOM.LIST:
                this.onListRoom(socket, undefined, callback);
                break;
            case UserEventTypeList.ROOM.QUERY:
                this.onQueryRoom(socket, data.data, callback);
                break;
        }
    }

    onCreateRoom(socket: Socket, data: ICreateRoomData, callback: (resp: ISocketResponse) => void) {
        const roomCode = this.create(data);
        socket.join(roomCode);
        callback({ success: new SocketMessage(UserEventTypeList.ROOM.CREATE, roomCode) });
    }

    onJoinRoom(socket: Socket, data: IJoinRoomData, callback: (resp: ISocketResponse) => void) {
        const joinCheck = this.joinCheck(data);
        if (!joinCheck) {
            return callback({ reject: 'faild' });
        }
        socket.join(data.id);
        callback({ success: new SocketMessage(UserEventTypeList.ROOM.JOIN) });
    }

    onLeaveRoom(socket: Socket, roomCode: string, callback: (resp: ISocketResponse) => void) {
        this.leaveRoom(socket, roomCode).then(() => {
            callback({ success: new SocketMessage(UserEventTypeList.ROOM.LEAVE) });
        });
    }

    onListRoom(socket: Socket, data: any, callback: (resp: ISocketResponse) => void) {
        callback({ success: new SocketMessage(UserEventTypeList.ROOM.LIST, this.list()) });
    }

    onQueryRoom(socket: Socket, data: string, callback: (resp: ISocketResponse) => void) {
        const roomList = this.list();
        if (!roomList.find(v => v[0] == data)) {
            return callback({ reject: "Not found" });
        }

        socket.nsp.in(data).fetchSockets()
            .then(v => {
                const socketIdList = v.map(n => n.id);
                callback({ success: new SocketMessage(UserEventTypeList.ROOM.QUERY, socketIdList) });
            });
    }
}
