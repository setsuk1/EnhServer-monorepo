import { Socket } from "socket.io";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { Logger } from "../../Console/Logger.js";
import { verifyJWT } from "../../jwtHelper.js";
import { RespTypeList } from "../EventList/RespTypeList.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SocketEventList } from "../EventList/SocketEventList.js";
import { SystemEventTypeList } from "../EventList/SystemEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { SocketServer } from "../SocketServer.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.SYSTEM_EVENT_MANAGER)

export class SystemEventManager {

	protected _server: SocketServer;

	constructor(server: SocketServer) {
		this._server = server;
		this.setupListenerForEvt()
	}

	setupListenerForEvt() {
		this._server.emitter.on(ServerEventList.MANAGER.SYSTEM_EVT_MANAGER, this.parse, this);
	}

    protected async onDisconnect(socket: Socket, filteredSockets: Socket[]) {
        filteredSockets.forEach(v =>
            v.emit(SocketEventList.SYSTEM, new SocketMessage(SystemEventTypeList.DISCONNECT, socket.id))
        )
	}

	parse(socket: Socket, data: SocketMessage<any>, callback: Function) {
		switch (data.type) {
			case SystemEventTypeList.LOGIN:
				this.login(socket, data.data, callback);
				break;
			case SystemEventTypeList.DISCONNECT:
				this.onDisconnect(socket, data.data);
				break;
		}
	}

	async login(socket: Socket, token: string, callback: Function) {
		logger.println(`Socket [${socket.id}] login.`);
		logger.println(`Token: ${token}`, LOG_LEVEL.DEBUG);
		if (token == "guest") {
			logger.println("Guest login", LOG_LEVEL.VERBOSE);
			return callback({ success: new SocketMessage(RespTypeList.SUCCESS, `Guest ${new Array(6).fill(0).map(v => Math.floor(Math.random() * 16).toString(16))}`) });
		}

		let data = await verifyJWT(token);
		logger.println(`Payload: ${JSON.stringify(data)}`, LOG_LEVEL.DEBUG);

		if (data != undefined) {
			this._server.accountManager.setValue(socket, "userId", data.userId);
			logger.println(`User [${data.userId}] login using socket [${socket.id}]`, LOG_LEVEL.VERBOSE);
			return callback({ success: new SocketMessage(RespTypeList.SUCCESS, data.userId) });
		}
		logger.println(`Token is invalid from socket [${socket.id}]`, LOG_LEVEL.VERBOSE);
		callback({ success: new SocketMessage(RespTypeList.GENERIC_ERROR) });
	}
}