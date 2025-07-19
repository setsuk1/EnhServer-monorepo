import { Socket } from "socket.io";
import { loggerPool } from "../../../instanceExport.js";
import { Logger } from "../../Console/Logger.js";
import { ServerEventList } from "../EventList/ServerEventList.js";
import { SystemEventTypeList } from "../EventList/SystemEventTypeList.js";
import { SocketMessage } from "../Helper/SocketMessage.js";
import { SocketServer } from "../SocketServer.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.DISCONNECT_MANAGER)

export class DisconnectManager {
    protected _server: SocketServer;

    constructor(server: SocketServer) {
        this._server = server;
        this.setupListenerForEvt()
    }

    protected async onDisconnect(socket: Socket) {
		logger.println(`Socket [${socket.id}] disconnect.`);
        const allSockets = await socket.nsp.fetchSockets();
        const rooms: string[] = this._server.roomManager.list().map(([rc, c]) => rc);
        const filteredSockets = allSockets.filter(s => rooms.findIndex(r => s.rooms.has(r)) !== -1);

        this._server.emitter.emit(ServerEventList.MANAGER.SYSTEM_EVT_MANAGER, socket, new SocketMessage(SystemEventTypeList.DISCONNECT, filteredSockets));
        this._server.roomManager.disconnect(socket);
        this._server.accountManager.remove(socket);
    }

    setupListenerForEvt() {
        this._server.emitter.on(ServerEventList.SOCKET.DISCONNECT, this.onDisconnect, this);
    }
}