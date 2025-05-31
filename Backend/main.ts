import bodyParser from "body-parser";
import { createSecretKey } from "crypto";
import express from "express";
import type { SessionOptions } from "express-session";
import session from "express-session";
import { Database } from "./database/Database.js";
import { DEVELOPMENT, JWT_SECRET, PORT, showRuntimeVariable, SOCKET_PATH, SRV_ADDR } from "./env.js";
import { SocketServer } from "./modules/SocketServer/SocketServer.js";
import { apiRouter } from "./routes/api.js";
import { defaultRouter } from "./routes/default.js";

const majorVersion = 0, minorVersion = 0, patchVersion = 1;

console.log(`Welcome to EnhServer Backend v${majorVersion}.${minorVersion}.${patchVersion}`)

showRuntimeVariable();

// refer to ASCII
const secret = String.fromCharCode(
    ...new Array(50 + Math.floor(Math.random() * 50))
        .fill(0)
        .map(() => 32 + Math.floor(Math.random() * 95))
)
const sess: SessionOptions = {
    secret,
    cookie: {},
}

export const jwtSecretKey = createSecretKey(JWT_SECRET, 'utf-8');

const app = express();

const server = app.listen(PORT, SRV_ADDR, function () {
    console.log("Server started!");
})
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json());

// load session module
app.use(session(sess));

app.use((req, res, next) => {
    res.header("X-Powered-By", "EnhProject");
    if (DEVELOPMENT) {
        res.header("Access-Control-Allow-Methods", "POST,GET");
        res.header("Access-Control-Allow-Origin", "http://127.0.0.1:5500")
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Expose-Headers", "*")

        res.header(
            'Access-Control-Allow-Headers',
            'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        );
    }
    next();
})

app.use(defaultRouter);
app.use("/api", apiRouter);
export const db = new Database();

const socketServer = SocketServer.getInstance(server, {
    path: SOCKET_PATH,
    allowEIO3: true // for older socket.io-client support
});