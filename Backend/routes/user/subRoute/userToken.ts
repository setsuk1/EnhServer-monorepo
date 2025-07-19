import { Router } from "express";
import { statements } from "../../../database/statements.js";
import { LOG_LEVEL, loggerPool } from "../../../instanceExport.js";
import { IUserLocals } from '../../../interfaces/route/locals/IUserLocals.js';
import { IUserTokenLocals } from '../../../interfaces/route/locals/IUserTokenLocals.js';
import { IUserParams } from '../../../interfaces/route/params/IUserParams.js';
import { IUserTokenParams } from '../../../interfaces/route/params/IUserTokenParams.js';
import { ICreateTokenBody } from '../../../interfaces/route/reqBody/ICreateTokenBody.js';
import { IRenameBody } from '../../../interfaces/route/reqBody/IRenameBody.js';
import { db, redisClient } from "../../../main.js";
import { Logger } from "../../../modules/Console/Logger.js";
import { signJWT } from "../../../modules/jwtHelper.js";
import { Message } from "../../../other/Message.js";
import { MessageTypeList } from "../../../other/MessageTypeList.js";
import { checkIdExist, checkPosInt, checkTextAllowedMax } from '../../helper/common.js';
import { checkUserIsTokenOwner } from "../../helper/token.js";

export const userTokenRouter = Router();

const loggerPrefix = Logger.PREFIX.API("user-token");

const generalLogger = loggerPool.getInstance();
generalLogger.setPrefix(loggerPrefix);

userTokenRouter.get<IUserParams, any, any, {}, IUserLocals>("/", async (req, res) => {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch all tokens for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const conn = await db.getConn();
    const tokens = await statements.token.QUERY_TOKEN_INFO_BY_USER_ID.exec(conn, userId);
    await conn.release();

    generalLogger.println(`Session [${req.sessionID}] requested all tokens for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, tokens));
});

userTokenRouter.post<IUserParams, any, ICreateTokenBody, {}, IUserLocals>("/", async (req, res) => {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a token creation request for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    let tokenType = +req.body?.type;
    if (!checkPosInt(tokenType)) {
        tokenType = 1;
    }

    let token: string;
    let tokenId: number;
    switch (tokenType) {
        case 1:
            tokenId = +(await redisClient.pubClient.get("token_id_next"));
            redisClient.pubClient.set(`token_${tokenId}`, userId);
            redisClient.pubClient.set("token_id_next", tokenId + 1);
            token = await signJWT({ id: tokenId }, 1);
            break;
        case 2:
        default:
            token = await signJWT({ id: -1 }, 2);
            const conn = await db.getConn();
            const [frow] = await statements.token.CREATE_TOKEN.exec(conn, userId, token);
            await conn.release();

            if (!frow) {
                generalLogger.println(`Session [${req.sessionID}] failed to create token for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
            }
            tokenId = frow.id;
            break;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully created token [${tokenId}${tokenType === 1 ? '@login' : ''}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    generalLogger.println(`Created token for user [${userId}]: ${token}`, LOG_LEVEL.DEBUG);
    res.send(new Message(MessageTypeList.SUCCESS, { id: tokenId, string: token }));
});

userTokenRouter.all<IUserTokenParams, any, any, {}, IUserTokenLocals>(['/:tokenId', '/:tokenId/*'], checkIdExist('tokenId'), checkUserIsTokenOwner);

userTokenRouter.get<IUserTokenParams, any, any, {}, IUserTokenLocals>("/:tokenId", async function (req, res) {
    const { userId, tokenId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch token [${tokenId}] for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const conn = await db.getConn();
    const [info] = await statements.token.QUERY_TOKEN_INFO_BY_ID.exec(conn, tokenId);
    await conn.release();
    if (!info) {
        generalLogger.println(`Session [${req.sessionID}] failed to request token [${tokenId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] requested token [${tokenId}] for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, info));
});

userTokenRouter.delete<IUserTokenParams, any, any, {}, IUserTokenLocals>("/:tokenId", async function (req, res) {
    const { userId, tokenId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a delete token request for token [${tokenId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const conn = await db.getConn();
    const result = await statements.token.DELETE_TOKEN_BY_ID.exec(conn, tokenId);
    await conn.release();
    if (!result.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to delete token [${tokenId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully deleted token [${tokenId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userTokenRouter.put<IUserTokenParams, any, IRenameBody, {}, IUserTokenLocals>("/:tokenId/nickname", async function (req, res) {
    const { userId, tokenId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a token rename request for token [${tokenId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const nickname = req.body?.nickname;
    if (!checkTextAllowedMax(nickname)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to rename token [${tokenId}] for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const result = await statements.token.UPDATE_TOKEN_NICKNAME_BY_ID.exec(conn, tokenId, nickname);
    await conn.release();
    if (!result.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to rename token [${tokenId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully renamed token [${tokenId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});
