import { Request } from "express";
import { Response, type NextFunction } from 'express-serve-static-core';
import { statements } from "../../database/statements.js";
import { IUserTokenLocals } from '../../interfaces/route/locals/IUserTokenLocals.js';
import { db } from "../../main.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from "../../other/MessageTypeList.js";

export async function checkUserIsTokenOwner(req: Request<{}, any, any, {}, IUserTokenLocals>, res: Response<any, IUserTokenLocals>, next: NextFunction) {
    const { userId, tokenId } = res.locals;
    const conn = await db.getConn();
    const [frow] = await statements.token.QUERY_TOKEN_ID_BY_ID_USER_ID.exec(conn, tokenId, userId);
    await conn.release();
    if (!frow) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}
