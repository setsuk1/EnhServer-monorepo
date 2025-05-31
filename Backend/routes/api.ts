import { Router } from "express";
import { Database } from "../database/Database.js";
import type { IAccountResult } from "../interfaces/IAccountResult.js";
import type { ILoginData } from "../interfaces/ILoginData.js";
import { db } from "../main.js";
import { Message } from "../other/Message.js";
import { jwtRouter } from "./user/jwt.js";
import { pskRouter } from "./user/passkey.js";
import { profileRouter } from "./user/profile.js";


export const apiRouter = Router();

apiRouter.get("/", (req, res, next) => {
    res.json({
        type: "success",
        data: "Hello world"
    })
})


apiRouter.use("/user", profileRouter);
apiRouter.use("/passkey", pskRouter);
apiRouter.use("/token", jwtRouter);

function checkAccountAndPassword(account: string, password: string): boolean {
    if (typeof account !== 'string' || typeof password !== 'string' || !account.length || !password.length || account.length > 50 || password.length > 50) {
        return false;
    }
    return true;
}

apiRouter.post("/login", async (req, res, next) => {
    console.log("Login request");
    const data: ILoginData = req.body;
    if (!checkAccountAndPassword(data?.acc, data?.pwd)) {
        console.error(`[${req.sessionID}] try to login with invalid data`);
        res.send(new Message(Message.TYPE.INVALID_DATA).toArray());
        return;
    }

    const conn = await db.getConn();
    const result: IAccountResult[] = Array.from(await conn.query(Database.STATEMENT.LOGIN_ACCOUNT, [data.acc, data.pwd]));
    conn.release();

    if (!result.length) {
        res.send(new Message(Message.TYPE.ACCOUNT_OR_PASSWORD_ERROR).toArray());
        return;
    }

    console.log(`[${req.sessionID}] login in as ${data.acc}`);

    if (!req.session.account)
        req.session.account = [];

    const checkIndex = req.session.account.findIndex(v => v.account == result[0].account);
    if (checkIndex !== -1) {
        if (req.session.account[checkIndex].isLoggedIn) {
            console.log(`[${req.sessionID}] has logged in in as ${data.acc}`);
            res.send(new Message(Message.TYPE.HAS_LOGGED_IN).toArray());
            return;
        }
        req.session.account[checkIndex].isLoggedIn = true;
        req.session.currentAccount = checkIndex;
    } else {
        req.session.account.push({
            account: result[0].account,
            isLoggedIn: true
        });
        req.session.currentAccount = 0;
    }

    res.send(new Message(Message.TYPE.SUCCESS).toArray());
})

apiRouter.post("/register", async (req, res, next) => {
    console.log("Register request");
    const data: ILoginData = req.body;
    if (!checkAccountAndPassword(data?.acc, data?.pwd)) {
        console.error(`[${req.sessionID}] try to register with invalid data`);
        res.send(new Message(Message.TYPE.INVALID_DATA).toArray());
        return;
    }

    const conn = await db.getConn();
    const result: IAccountResult[] = Array.from(await conn.query(Database.STATEMENT.QUERY_ACCOUNT, [data.acc]));
    const target = result[0];

    if (result.length === 1 && target) {
        conn.release();

        console.log(`${req.sessionID} try to register an existed account.`);
        res.send(new Message(Message.TYPE.ACCOUNT_ALREADY_EXISTS).toArray());
        return;
    }

    await conn.beginTransaction();
    const reg = await conn.query(Database.STATEMENT.REGISTER_ACCOUNT, [data.acc, data.pwd]);

    const { insertId } = reg;
    const options = await conn.query(Database.STATEMENT.REGISTER_ACCOUNT_OPTIONS, [insertId, false]);
    await conn.commit();
    conn.release();

    if (!req.session.account)
        req.session.account = [];

    req.session.account.push({
        account: data.acc,
        isLoggedIn: true
    });
    req.session.currentAccount = req.session.account.length - 1;

    console.log(`${req.sessionID} register ${data.acc} success.`);
    res.send(new Message(Message.TYPE.SUCCESS).toArray());
});