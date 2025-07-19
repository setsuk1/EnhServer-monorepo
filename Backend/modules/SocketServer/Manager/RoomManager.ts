import { Socket } from "socket.io";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { Logger } from "../../Console/Logger.js";
import { JoinRoomCheckList } from "../EventList/JoinRoomCheckList.js";
import { LeaveRoomStateList } from "../EventList/LeaveRoomStateList.js";
import { RespTypeList } from "../EventList/RespTypeList.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SocketEventList } from "../EventList/SocketEventList.js";
import { SystemEventTypeList } from "../EventList/SystemEventTypeList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { UidTable } from "../Helper/UidTable.js";
import { ISocketResponse } from "../interface/ISocketResponse.js";
import { ICreateRoomData } from "../interface/room/ICreateRoomData.js";
import { IJoinRoomData } from "../interface/room/IJoinRoomData.js";
import { ICreateRoomResp } from "../interface/room/response/ICreateRoomResp.js";
import { IJoinRoomResp } from "../interface/room/response/IJoinRoomResp.js";
import { IListRoomResp } from "../interface/room/response/IListRoomResp.js";
import { SocketServer } from "../SocketServer.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.ROOM_MANAGER)

interface IRoomData {
    title: string
    password?: string;
    createTime: number;
    decisionMaker: {
        list: string[],
        current: string
    };
}


interface IListRoomData {
    type: "Global" | "Project" | "Room" | "custom"
}

export class RoomManager {
    protected _uidManager = new UidTable();
    protected _server: SocketServer;

    constructor(server: SocketServer) {
        this._server = server;
        this.setupListenerForEvt()
    }

    list(): [roomCode: string, data: IRoomData][] {
        return this._uidManager.list();
    }

    destroy(roomCode: string) {
        if (!this._uidManager.has(roomCode))
            return;

        logger.println(`Destroy room [${roomCode}] since no socket is in it.`, LOG_LEVEL.MOST_VERBOSE);
        this._uidManager.delete(roomCode);
    }

    joinCheck(data: IJoinRoomData, socket: Socket) {
        if (!data?.id)
            return JoinRoomCheckList.EMPTY_ID;

        let room: IRoomData = this._uidManager.get(data.id);
        if (!room)
            return JoinRoomCheckList.NOT_EXIST;

        if (socket.rooms.has(data.id))
            return JoinRoomCheckList.HAS_BEEN_BEFORE;

        if (room.password && room.password != data.password)
            return JoinRoomCheckList.PASSWORD_WRONG;


        return JoinRoomCheckList.SUCCESS;
    }

    create(data: ICreateRoomData, socketId: string) {
        let roomData: IRoomData = Object.assign(JSON.parse(JSON.stringify(data)), {
            createTime: Date.now(),
            decisionMaker: {
                list: [socketId],
                current: socketId,
            }
        })
        let uid = this._uidManager.generateUid(`${data.area ?? "room"}_`, 10, roomData);
        return uid;
    }

    async disconnect(socket: Socket) {
        logger.println(`Socket [${socket.id}] disconnect handling`);
        for (const [roomId, data] of this.list()) {
            logger.println(`[${socket.id}] leave room [${roomId}]`, LOG_LEVEL.MOST_VERBOSE);
            await this.leaveRoom(socket, roomId, true);
        }
    }

    protected selectDecisionMaker(socket: Socket, roomId: string) {
        logger.println(`Room [${roomId}] decision maker change.`, LOG_LEVEL.MORE_VERBOSE);
        let roomData: IRoomData = this._uidManager.get(roomId);
        roomData.decisionMaker.current = roomData.decisionMaker.list[0];

        logger.println(`New decision maker: ${roomData.decisionMaker.current}.`, LOG_LEVEL.MOST_VERBOSE);

        socket.nsp.in(roomId).emit(SocketEventList.SYSTEM, new SocketMessage(SystemEventTypeList.ROOM.CHANGE_DM, { roomId, DMid: roomData.decisionMaker.current }));
    }

    setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.MANAGER.ROOM_MANAGER, this.onRoomRelated, this);
    }

    async leaveRoom(socket: Socket, roomId: string, disconnect: boolean = false) {
        let status = LeaveRoomStateList.SUCCESS;
        const roomData: IRoomData = this._uidManager.get(roomId);
        if (roomData) {
            const index = roomData.decisionMaker.list.indexOf(socket.id)
            if (index != -1) {
                roomData.decisionMaker.list.splice(index, 1);
            }
            if (!socket.rooms.has(roomId))
                status = LeaveRoomStateList.NOT_IN_ROOM
        } else {
            status = LeaveRoomStateList.NOT_EXIST;
        }

        socket.leave(roomId);

        const socketCounts = await socket.nsp.in(roomId).fetchSockets();
        if (socketCounts.length < 1) {
            this.destroy(roomId);
        } else {
            this.selectDecisionMaker(socket, roomId);
        }
        return status;
    }

    protected onRoomRelated(socket: Socket, data: SocketMessage<any>, callback: (resp: ISocketResponse) => void) {
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

    protected onCreateRoom(socket: Socket, data: ICreateRoomData, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] create new room`);
        const roomCode = this.create(data, socket.id);
        socket.join(roomCode);
        const resp: ICreateRoomResp = {
            roomCode,
            decisionMaker: socket.id
        }

        logger.println(`Room id: ${roomCode}`, LOG_LEVEL.VERBOSE);
        callback({ success: new SocketMessage(RespTypeList.SUCCESS, resp) });
    }

    protected onJoinRoom(socket: Socket, data: IJoinRoomData, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] join room [${data.id}]`);
        const joinCheck = this.joinCheck(data, socket);
        switch (joinCheck) {
            case JoinRoomCheckList.EMPTY_ID:
                logger.println(`Join room failed, reason: Room id is empty.`, LOG_LEVEL.MORE_VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.ROOM_ID_EMPTY) });
            case JoinRoomCheckList.NOT_EXIST:
                logger.println(`Join room failed, reason: Room not exist.`, LOG_LEVEL.MORE_VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.ROOM_NOT_EXIST) });
            case JoinRoomCheckList.PASSWORD_WRONG:
                logger.println(`Join room failed, reason: Wrong password.`, LOG_LEVEL.MORE_VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.ROOM_PASSWORD_WRONG) });
            case JoinRoomCheckList.HAS_BEEN_BEFORE:
                logger.println(`Join room failed, reason: Has been in room.`, LOG_LEVEL.MORE_VERBOSE);
                return callback({ reject: new SocketMessage(RespTypeList.ROOM_HAS_BEEN_BEFORE) })
        }

        logger.println(`Join room success.`, LOG_LEVEL.VERBOSE);
        socket.join(data.id);
        const roomData: IRoomData = this._uidManager.get(data.id);
        roomData.decisionMaker.list.push(socket.id);
        const resp: IJoinRoomResp = {
            decisionMaker: roomData.decisionMaker.current
        }
        callback({ success: new SocketMessage(UserEventTypeList.ROOM.JOIN, resp) });
    }

    protected onLeaveRoom(socket: Socket, roomCode: string, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] leave room [${roomCode}]`);
        this.leaveRoom(socket, roomCode).then(status => {
            switch (status) {
                case LeaveRoomStateList.SUCCESS:
                    logger.println(`Leave room success.`, LOG_LEVEL.VERBOSE);
                    return callback({ success: new SocketMessage(RespTypeList.SUCCESS) });
                case LeaveRoomStateList.NOT_EXIST:
                    logger.println(`Leave room failed, reason: Room not exist.`, LOG_LEVEL.MORE_VERBOSE);
                    return callback({ reject: new SocketMessage(RespTypeList.ROOM_NOT_EXIST) });
                case LeaveRoomStateList.NOT_IN_ROOM:
                    logger.println(`Leave room failed, reason: Not in room.`, LOG_LEVEL.MORE_VERBOSE);
                    return callback({ reject: new SocketMessage(RespTypeList.ROOM_NOT_BEEN_IN) });
            }
        });
    }

    protected onListRoom(socket: Socket, data: any, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] list all rooms`);
        const transformedData: IListRoomResp[] = this.list().flatMap(v => ({
            roomCode: v[0],
            title: v[1].title
        }))
        callback({ success: new SocketMessage(RespTypeList.SUCCESS, transformedData) });
    }

    protected onQueryRoom(socket: Socket, data: string, callback: (resp: ISocketResponse) => void) {
        logger.println(`Socket [${socket.id}] query room [${data}]`);

        if (!this._uidManager.has(data)) {
            logger.println(`Query room failed, reason: Room not exist.`, LOG_LEVEL.MORE_VERBOSE);
            return callback({ reject: new SocketMessage(RespTypeList.ROOM_NOT_EXIST) });
        }
        logger.println(`Query room success.`, LOG_LEVEL.VERBOSE);

        socket.nsp.in(data).fetchSockets()
            .then(v => {
                const socketIdList = v.map(n => n.id);
                callback({ success: new SocketMessage(RespTypeList.SUCCESS, socketIdList) });
            });
    }
}