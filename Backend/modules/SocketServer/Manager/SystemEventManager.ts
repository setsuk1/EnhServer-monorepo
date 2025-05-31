import type { Socket } from "socket.io";
import { Message } from "../../../other/Message.js";
import { verifyJWT } from "../../../routes/user/jwt.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SystemEventTypeList } from "../EventList/SystemEventTypeList.js";
import type { SocketMessage } from "../Helper/SocketMessage.js";
import type { SocketServer } from "../SocketServer.js";

export class SystemEventManager {

	protected _server: SocketServer;

	constructor(server: SocketServer) {
		this._server = server;
        this.setupListenerForEvt()
	}

    setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.MANAGER.SYSTEM_EVT_MANAGER, this.parse, this);
    }

	parse(socket: Socket, data: SocketMessage<any>, callback: Function) {
		console.log("System event");
		switch (data.type) {
			case SystemEventTypeList.LOGIN:
				this.login(socket, data.data, callback);
				break;
		}
	}

	protected _tokenMapping = new Map<Socket, string>();

	async login(socket: Socket, token: string, callback: Function) {
		let data = await verifyJWT(token);
		if(data[0] == Message.TYPE.SUCCESS) {
			console.log("Token verify success");
			this._tokenMapping.set(socket, data[1].id);
			return callback({success: data[1].id});
		}
		callback(data);
	}
}
