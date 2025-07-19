import { RedisClientType, RedisFunctions, RedisModules, RedisScripts, RespVersions, TypeMapping } from "@redis/client";
import { createAdapter } from "@socket.io/redis-adapter";
import { DisconnectReason, Server, ServerOptions, Socket } from "socket.io";
import { loggerPool } from "../../instanceExport.js";
import { redisClient } from "../../main.js";
import { Logger } from "../Console/Logger.js";
import { Emitter } from "../Emitter/Emitter.js";
import { ServerEventList } from "./EventList/ServerEventList.js";
import { SocketEventList } from "./EventList/SocketEventList.js";
import { SocketMessage } from "./Helper/SocketMessage.js";
import { AccountManager } from "./Manager/AccountManager.js";
import { DisconnectManager } from "./Manager/DisconnectManager.js";
import { MessageManager } from "./Manager/MessageManager.js";
import { RoomManager } from "./Manager/RoomManager.js";
import { SystemEventManager } from "./Manager/SystemEventManager.js";
import { UserEventManager } from "./Manager/UserEventManager.js";
import { VariableTableManager } from "./Manager/VariableTableManager.js";

let map: Map<any, SocketServer> = new Map();
const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.SOCKET_SERVER);

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
    protected _varTblMgr: VariableTableManager;
    protected _disconnectMgr: DisconnectManager;

    public roomManager: RoomManager;
    public msgManager: MessageManager;
    public emitter: Emitter;

    public accountManager: AccountManager;

    protected _redisSubClient: RedisClientType<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>;

    async attach(server: any, opts?: Partial<ServerOptions>) {
        this._socketServer.attach(server, opts);

        this._redisSubClient = redisClient.pubClient.duplicate();
        logger.println("Wait for redis adapter for socket server.");

        await Promise.all([redisClient.redisConnectProm, this._redisSubClient.connect()]);
        this._socketServer.adapter(createAdapter(redisClient.pubClient, this._redisSubClient));

        logger.println("Redis adapter OK!");
    }

    async init(server: any, opts?: Partial<ServerOptions>) {
        logger.println("Initializing socket server");

        this.emitter = new Emitter();
        this._socketServer = new Server();

        if (server)
            this.attach(server, opts);

        this._socketServer.on("connection", this._connectionHandler.bind(this));
        this.roomManager = new RoomManager(this);
        this._usrEvtMgr = new UserEventManager(this);
        this.msgManager = new MessageManager(this);
        this._sysEvtMgr = new SystemEventManager(this);
        this._varTblMgr = new VariableTableManager(this)
        this.accountManager = new AccountManager();
        this._disconnectMgr = new DisconnectManager(this);
    }

    protected _connectionHandler(socket: Socket) {
        logger.println(`socket ${socket.id} connected`);

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
        logger.println(`socket ${socket.id} disconnected due to ${reason}`);

        this.emitter.emit(ServerEventList.SOCKET.DISCONNECT, socket);
    }
}