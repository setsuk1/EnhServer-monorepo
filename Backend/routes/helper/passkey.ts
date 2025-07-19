import { Request } from "express";
import { NextFunction, Response } from 'express-serve-static-core';
import { statements } from "../../database/statements.js";
import { IUserPasskeyLocals } from '../../interfaces/route/locals/IUserPasskeyLocals.js';
import { db } from "../../main.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from "../../other/MessageTypeList.js";

export async function checkUserIsPasskeyOwner(req: Request<{}, any, any, {}, IUserPasskeyLocals>, res: Response<any, IUserPasskeyLocals>, next: NextFunction) {
    const { userId, passkeyId } = res.locals;
    const conn = await db.getConn();
    const [frow] = await statements.account.QUERY_PASSKEY_ID_BY_ID_USER_ID.exec(conn, passkeyId, userId);
    await conn.release();
    if (!frow) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}
