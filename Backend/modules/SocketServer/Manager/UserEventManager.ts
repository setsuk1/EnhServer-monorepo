import { Socket } from "socket.io";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { UserEventTypeList } from "../EventList/UserEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { SocketServer } from "../SocketServer.js";

export class UserEventManager {

	protected _server: SocketServer;

	constructor(server: SocketServer) {
		this._server = server;
		this.setupListenerForEvt()
	}

	setupListenerForEvt() {
		this._server.emitter.on(ServerEventList.MANAGER.USER_EVT_MANAGER, this.parse, this);
	}

	parse(socket: Socket, data: SocketMessage<any>, callback: Function) {
		switch (data.type) {
			case UserEventTypeList.ROOM.CREATE:
			case UserEventTypeList.ROOM.JOIN:
			case UserEventTypeList.ROOM.LEAVE:
			case UserEventTypeList.ROOM.LIST:
			case UserEventTypeList.ROOM.QUERY:
				this._server.emitter.emit(ServerEventList.MANAGER.ROOM_MANAGER, socket, data, callback);
				break;
			case UserEventTypeList.MSG.UNICAST:
			case UserEventTypeList.MSG.BROADCAST_IN_ROOM:
			case UserEventTypeList.MSG.BROADCAST_TO_ALL:
				this._server.emitter.emit(ServerEventList.MANAGER.MSG_MANAGER, socket, data, callback);
				break;
			case UserEventTypeList.VAR.DELETE_VALUE:
			case UserEventTypeList.VAR.GET_VALUE:
			case UserEventTypeList.VAR.SET_VALUE:
			case UserEventTypeList.VAR.LIST_TABLE:
			case UserEventTypeList.VAR.LIST_VALUE:
				this._server.emitter.emit(ServerEventList.MANAGER.VARTABLE_MANAGER, socket, data, callback);
				break;
		}
	}
}