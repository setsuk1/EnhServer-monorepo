import { Request } from 'express';
import { Response, type NextFunction } from 'express-serve-static-core';
import { IUserRelatedLocals } from '../../interfaces/route/locals/IUserRelatedLocals.js';
import { IUserParams } from '../../interfaces/route/params/IUserParams.js';
import { IQueryUserIndex } from '../../interfaces/route/query/IQueryUserIndex.js';
import { Message } from "../../other/Message.js";
import { MessageTypeList } from "../../other/MessageTypeList.js";
import { checkPosInt } from './common.js';

export function extractUserByParams(req: Request<IUserParams, any, any, {}, IUserRelatedLocals>, res: Response<any, IUserRelatedLocals>, next: NextFunction) {
    const userIndex = +req.params.userIndex;
    const user = req.session.accounts[userIndex];
    if (user?.isLoggedIn) {
        res.locals.userIndex = userIndex;
        res.locals.user = user;
        res.locals.userId = user.id;
    }
    next();
}

export function extractUserByQuery(req: Request<{}, any, any, IQueryUserIndex, IUserRelatedLocals>, res: Response<any, IUserRelatedLocals>, next: NextFunction) {
    const userIndex = +req.query.userIndex;
    const user = req.session.accounts[userIndex];
    if (user?.isLoggedIn) {
        res.locals.userIndex = userIndex;
        res.locals.user = user;
        res.locals.userId = user.id;
    }
    next();
}

export function verifyUserLogin(req: Request<{}, any, any, IQueryUserIndex, IUserRelatedLocals>, res: Response<any, IUserRelatedLocals>, next: NextFunction) {
    if (!res.locals.user?.isLoggedIn) {
        res.send(new Message(MessageTypeList.HAS_NOT_LOGGED_IN));
        return;
    }
    next();
}

export function checkUserId(req: Request<{}, any, any, IQueryUserIndex, IUserRelatedLocals>, res: Response<any, IUserRelatedLocals>, next: NextFunction) {
    if (!checkPosInt(res.locals.userId)) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}
