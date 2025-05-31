import { DisconnectReason, Server, ServerOptions, Socket } from "socket.io";
import { Emitter } from "../Emitter/Emitter.js";
import { ServerEventList } from "./EventList/ServerEventList.js";
import { SocketEventList } from "./EventList/SocketEventList.js";
import type { SocketMessage } from "./Helper/SocketMessage.js";
import { MessageManager } from "./Manager/MessageManager.js";
import { RoomManager } from "./Manager/RoomManager.js";
import { SystemEventManager } from "./Manager/SystemEventManager.js";
import { UserEventManager } from "./Manager/UserEventManager.js";

let map: Map<any, SocketServer> = new Map();

export class SocketServer {
    static getInstance(server: any, opts?: Partial<ServerOptions>) {
        let target = map.get(server);
        if (target)
            return target;
        let _server = new SocketServer();
        _server.init(server, opts);
        map.set(server, _server);
        return _server;
    }

    protected _socketServer: Server;
    protected _usrEvtMgr: UserEventManager;
    protected _sysEvtMgr: SystemEventManager;

    public roomManager: RoomManager;
    public msgManager: MessageManager;
    public emitter: Emitter;

    attach(server: any, opts?: Partial<ServerOptions>) {
        this._socketServer.attach(server, opts);
    }

    init(server: any, opts?: Partial<ServerOptions>) {
        console.log("Initializing socket server");
        this.emitter = new Emitter();
        this._socketServer = new Server();

        if (server)
            this.attach(server, opts);

        this._socketServer.on("connection", this._connectionHandler.bind(this));
        this.roomManager = new RoomManager(this);
        this._usrEvtMgr = new UserEventManager(this);
        this.msgManager = new MessageManager(this);
        this._sysEvtMgr = new SystemEventManager(this);
    }

    protected _connectionHandler(socket: Socket) {
        console.log(`socket ${socket.id} connected`);

        socket.on(SocketEventList.SYSTEM, (data: SocketMessage<any>, func) => {
            this.emitter.emit(ServerEventList.MANAGER.SYSTEM_EVT_MANAGER, socket, data, func)
        });

        socket.on(SocketEventList.USER, (data: SocketMessage<any>, func) => {
            this.emitter.emit(ServerEventList.MANAGER.USER_EVT_MANAGER, socket, data, func)
        });

        // upon disconnection
        socket.on("disconnect", (r) => this._disconnectHandler(socket, r));
    }

    protected async _disconnectHandler(socket: Socket, reason: DisconnectReason) {
        console.log(`socket ${socket.id} disconnected due to ${reason}`);
        this.emitter.emit("socket_disconnect", socket);
    }
}