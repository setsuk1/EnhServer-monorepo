import { NextFunction } from "express";
import { statements } from "../../database/statements.js";
import { db } from "../../main.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from "../../other/MessageTypeList.js";

export async function findUserAndTokenIdByToken(token: string) {
    const conn = await db.getConn();
    const [frow] = await statements.token.QUERY_TOKEN_BY_STRING.exec(conn, token);
    await conn.release();
    return frow;
}

export const tokenHandlers = {
    async VERIFY_TOKEN_EXISTED(req, res, next: NextFunction) {
        const token = res.locals.tokenId;
        if (!token) {
            res.send(new Message(MessageTypeList.PERMISSION_DENIED));
            return;
        }
        next();
    },
    async EXTRACT_TOKEN(req, res, next: NextFunction) {
        const token = req.headers.authorization?.replace(/^Bearer /, "");
        if (token) {
            const info = await findUserAndTokenIdByToken(token);
            if (info) {
                res.locals.userId = info.acc_id;
                res.locals.tokenId = info.id;
            }
        }
        next();
    }
}
