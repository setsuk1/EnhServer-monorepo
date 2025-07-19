import bodyParser from "body-parser";
import { RedisStore } from 'connect-redis';
import { createSecretKey } from "crypto";
import express from "express";
import session, { SessionOptions } from "express-session";
import { Database } from "./database/Database.js";
import { DEVELOPMENT, JWT_SECRET, REDIS_ADDRESS, REDIS_PORT, SESSION_SECRET, showRuntimeVariable, SOCKET_PATH, SRV_ADDR, SRV_PORT } from "./env.js";
import { loggerPool } from "./instanceExport.js";
import { Logger } from "./modules/Console/Logger.js";
import { RedisClient } from "./modules/Redis/RedisClient.js";
import { SocketServer } from "./modules/SocketServer/SocketServer.js";
import { apiRouter } from "./routes/api.js";
import { defaultRouter } from "./routes/default.js";

const logger = loggerPool.getInstance();

logger.setPrefix(Logger.PREFIX.MAIN);

showRuntimeVariable();

export const db = new Database();

export const sessionSecret = createSecretKey(SESSION_SECRET, 'utf-8');
export const jwtSecretKey = createSecretKey(JWT_SECRET, 'utf-8');

// Redis clients
export const redisClient = new RedisClient({ url: `redis://${REDIS_ADDRESS}:${REDIS_PORT}` });

export const redisStore = new RedisStore({
    client: redisClient.pubClient,
    prefix: "EnhServer_session_"
});

const sess: SessionOptions = {
    secret: sessionSecret,
    store: redisStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,           // Only send over HTTPS
        signed: true,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}

const app = express();
app.set('trust proxy', 1)

logger.println("Wait for database and redis inited.");
await Promise.all([
    new Promise((res) => {
        const interval = setInterval(() => {
            if (!db.inited)
                return;
            clearInterval(interval)
            res(0);
        }, 300);
    }),
    redisClient.redisConnectProm
]);

const server = app.listen(SRV_PORT, SRV_ADDR, function () {
    logger.println("Server started!");
})
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// load session module
app.use(session(sess));

app.use((req, res, next) => {
    res.header("X-Powered-By", "EnhProject");
    if (DEVELOPMENT) {
        // To meet CORS without reverse proxy
        res.header("Access-Control-Allow-Methods", "POST,GET");
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Expose-Headers", "*")

        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
    }

    if (!req.session.accounts) {
        req.session.accounts = [];
    }

    next();
})

app.use(defaultRouter);
app.use("/api", apiRouter);

const socketServer = SocketServer.getInstance(server, {
    path: SOCKET_PATH,
    allowEIO3: true // for older socket.io-client support
});