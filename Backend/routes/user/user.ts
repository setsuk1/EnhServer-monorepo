import { generateAuthenticationOptions, verifyAuthenticationResponse, type AuthenticatorTransportFuture, type VerifiedAuthenticationResponse, type WebAuthnCredential } from "@simplewebauthn/server";
import { Router } from "express";
import { statements } from "../../database/statements.js";
import { ORIGIN, RP_ID } from "../../env.js";
import { LOG_LEVEL, loggerPool } from "../../instanceExport.js";
import { IUserLocals } from '../../interfaces/route/locals/IUserLocals.js';
import { IUserParams } from '../../interfaces/route/params/IUserParams.js';
import { IChangeAllowPasswordBody } from '../../interfaces/route/reqBody/IChangeAllowPasswordBody.js';
import { IChangePasswordBody } from '../../interfaces/route/reqBody/IChangePasswordBody.js';
import { ILoginBody } from '../../interfaces/route/reqBody/ILoginBody.js';
import { IPasswordLoginBody } from "../../interfaces/route/reqBody/IPasswordLoginBody.js";
import { IRenameBody } from '../../interfaces/route/reqBody/IRenameBody.js';
import { IUserData } from '../../interfaces/route/resMsgData/IUserData.js';
import { db } from "../../main.js";
import { Logger } from "../../modules/Console/Logger.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from '../../other/MessageTypeList.js';
import { checkTextAllowedMax } from '../helper/common.js';
import { extractUserByParams, verifyUserLogin } from '../helper/user.js';
import { userPasskeyRouter } from "./subRoute/userPasskey.js";
import { userTokenRouter } from "./subRoute/userToken.js";
import { userVariableTableRouter } from './subRoute/userVariableTable.js';

export const userRouter = Router();

const loggerPrefix = Logger.PREFIX.API("user");
const passkeyLoggerPrefix = Logger.PREFIX.API("passkey-login");

const generalLogger = loggerPool.getInstance();
generalLogger.setPrefix(loggerPrefix);

const passkeyLogger = loggerPool.getInstance();
passkeyLogger.setPrefix(passkeyLoggerPrefix);

userRouter.get("/", async (req, res) => {
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch all logged-in users.`, LOG_LEVEL.MOST_VERBOSE);

    const sesUsers = req.session.accounts;
    const ids = sesUsers.map(user => user.id);
    let retUsers: IUserData[];
    if (ids.length) {
        const conn = await db.getConn();
        const queryUsers = await statements.account.QUERY_USER_BY_IDS.exec(conn, ids);
        await conn.release();

        retUsers = sesUsers.map((sUser, index) => {
            const qUser = queryUsers.find(qUser => qUser.id === sUser.id);
            if (!qUser) {
                return undefined;
            }
            return {
                index,
                account: sUser.account,
                isLoggedIn: sUser.isLoggedIn,
                nickname: qUser.nickname,
                allowPassword: qUser.allowPassword
            };
        }).filter(_ => _);
    } else {
        retUsers = [];
    }

    generalLogger.println(`Session [${req.sessionID}] requested all logged-in users.`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, retUsers));
});

userRouter.post<{}, any, IPasswordLoginBody>("/", async (req, res) => {
    generalLogger.println(`Session [${req.sessionID}] initiated a registration request.`, LOG_LEVEL.MORE_VERBOSE);

    const account = req.body?.account;
    const password = req.body?.password;
    if (!checkTextAllowedMax(account) || !checkTextAllowedMax(password)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to register with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const [frow] = await statements.account.CREATE_USER.exec(conn, account, password);
    await conn.release();
    if (!frow) {
        await conn.release();
        generalLogger.println(`Session [${req.sessionID}] attempted to register with an existing account.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.ACCOUNT_ALREADY_EXISTS));
        return;
    }

    const id = frow.id;
    const users = req.session.accounts;
    const index = users.length;
    users.push({
        id,
        account,
        isLoggedIn: true
    });

    generalLogger.println(`Session [${req.sessionID}] successfully registered user [${id}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS, index));
});

userRouter.put<{}, any, IPasswordLoginBody>("/", async (req, res) => {
    generalLogger.println(`Session [${req.sessionID}] initiated a login request.`, LOG_LEVEL.MORE_VERBOSE);

    const account = req.body?.account;
    const password = req.body?.password;
    if (!checkTextAllowedMax(account) || !checkTextAllowedMax(password)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to login with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const [user] = await statements.account.QUERY_USER_BY_ACCOUNT_PASSWORD.exec(conn, account, password);
    await conn.release();
    if (!user) {
        generalLogger.println(`Session [${req.sessionID}] failed to login due to incorrect account or password.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.ACCOUNT_OR_PASSWORD_ERROR));
        return;
    }

    if (!user.allowPassword) {
        generalLogger.println(`Session [${req.sessionID}] failed to login because password login is not allowed.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_OPERATION));
        return;
    }

    const users = req.session.accounts;
    let index = users.findIndex(v => v.account == account);
    if (index !== -1) {
        if (users[index].isLoggedIn) {
            generalLogger.println(`Session [${req.sessionID}] is already logged in as ${account}.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.HAS_LOGGED_IN));
            return;
        }
        users[index].isLoggedIn = true;
    } else {
        index = users.length;
        users.push({
            id: user.id,
            account,
            isLoggedIn: true
        });
    }

    generalLogger.println(`Session [${req.sessionID}] successfully logged in as user [${user.id}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS, index));
});

/******************************/
/*        passkey login       */
/******************************/

userRouter.post<{}, any, ILoginBody>("/generate-authentication-options", async function (req, res, next) {
    passkeyLogger.println("Generate authentication options", LOG_LEVEL.VERBOSE);

    const users = req.session.accounts;
    const account = req.body?.account;
    if (users.find(user => user.account == account)?.isLoggedIn === true) {
        res.send(new Message(MessageTypeList.HAS_LOGGED_IN));
        return;
    }

    const conn = await db.getConn();
    const [user] = await statements.account.QUERY_USER_BY_ACCOUNT.exec(conn, account);
    if (!user) {
        await conn.release();
        res.send(new Message(MessageTypeList.ACCOUNT_OR_PASSWORD_ERROR));
        return;
    }

    const infos = await statements.account.QUERY_PASSKEY_BY_USER_ID.exec(conn, user.id);
    await conn.release();

    const allowCredentials = infos.map(info => ({
        id: info.cred_id,
        type: 'public-key',
        transports: Array.from(info.transports) as AuthenticatorTransportFuture[]
    }));

    if (!allowCredentials.length) {
        passkeyLogger.println(`No credential for user [${user.id}]`, LOG_LEVEL.MORE_VERBOSE);
        res.send(new Message(MessageTypeList.NO_PASSKEY_CRED));
        return;
    }

    const options = await generateAuthenticationOptions({
        // Require users to use a previously-registered authenticator
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
    });

    req.session.authenticateOptions = {
        userId: user.id,
        account,
        challenge: options.challenge
    };

    res.send(new Message(MessageTypeList.SUCCESS, options));
});

userRouter.post("/verify-authentication", async function (req, res, next) {
    passkeyLogger.println("Verify authentication", LOG_LEVEL.VERBOSE);

    const authenticateOptions = req.session.authenticateOptions;
    req.session.authenticateOptions = undefined;
    if (!authenticateOptions) {
        res.send(new Message(MessageTypeList.INVALID_STATE));
        return;
    }

    const { userId, account, challenge: expectedChallenge } = authenticateOptions;
    const { body } = req;
    const conn = await db.getConn();
    const [rawCredential] = await statements.account.QUERY_PASSKEY_BY_CRED_ID.exec(conn, body.id);

    const credential: WebAuthnCredential = {
        id: rawCredential.cred_id,
        publicKey: Uint8Array.from(Object.values(rawCredential.cred_public_key)),
        counter: rawCredential.counter,
        transports: JSON.parse(rawCredential.transports)
    };

    let verification: VerifiedAuthenticationResponse;
    try {
        verification = await verifyAuthenticationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            credential,
            requireUserVerification: false,
        });
        await statements.account.UPDATE_PASSKEY_COUNTER_BY_ID.exec(conn, rawCredential.id, verification.authenticationInfo.newCounter);
    } catch (error: any) {
        await conn.release();
        passkeyLogger.println(error._message, LOG_LEVEL.MOST_VERBOSE);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR, error.message));
        return;
    }

    const { verified } = verification;
    if (!verified) {
        res.send(new Message(MessageTypeList.GENERIC_ERROR));
        await conn.release();
        return;
    }

    const users = req.session.accounts;
    let index = users.findIndex(user => user.id === userId);
    if (index !== -1) {
        await conn.release();
        if (users[index].isLoggedIn) {
            passkeyLogger.println(`[${req.sessionID}] has logged in as user [${userId}]`, LOG_LEVEL.MORE_VERBOSE);
            res.send(new Message(MessageTypeList.HAS_LOGGED_IN));
            return;
        }
        users[index].isLoggedIn = true;
    } else {
        index = users.length;
        users.push({
            id: userId,
            account,
            isLoggedIn: true
        });
    }

    res.send(new Message(MessageTypeList.SUCCESS, index));
});

/**********************************/
/*        passkey login end       */
/**********************************/

userRouter.all<IUserParams, any, any, {}, IUserLocals>(['/:userIndex', '/:userIndex/*'], extractUserByParams, verifyUserLogin);

userRouter.get<IUserParams, any, any, {}, IUserLocals>("/:userIndex", async (req, res) => {
    const { userIndex, user, userId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const conn = await db.getConn();
    const [queryUser] = await statements.account.QUERY_USER_BY_ID.exec(conn, userId);
    await conn.release();

    const retUser: IUserData = {
        index: userIndex,
        account: user.account,
        isLoggedIn: user.isLoggedIn,
        nickname: queryUser.nickname,
        allowPassword: queryUser.allowPassword
    };

    generalLogger.println(`Session [${req.sessionID}] requested user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, retUser));
});

userRouter.delete<IUserParams, any, any, {}, IUserLocals>('/:userIndex', (req, res) => {
    const { userIndex, userId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] delete user [${userId}].`, LOG_LEVEL.NORMAL);

    req.session.accounts.splice(userIndex, 1);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userRouter.put<IUserParams, any, any, {}, IUserLocals>('/:userIndex/logout', (req, res) => {
    const user = res.locals.user;
    generalLogger.println(`Session [${req.sessionID}] logout user [${user.id}].`, LOG_LEVEL.NORMAL);

    user.isLoggedIn = false;
    res.send(new Message(MessageTypeList.SUCCESS));
});

userRouter.put<IUserParams, any, IRenameBody, {}, IUserLocals>('/:userIndex/nickname', async (req, res) => {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a rename request for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const nickname = req.body?.nickname;
    if (!checkTextAllowedMax(nickname)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to rename user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const updateResult = await statements.account.UPDATE_NICKNAME.exec(conn, userId, nickname);
    await conn.release();
    if (!updateResult.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to rename user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully renamed user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userRouter.put<IUserParams, any, IChangePasswordBody, {}, IUserLocals>("/:userIndex/password", async function (req, res) {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a password change request for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const password = req.body?.password;
    const newPassword = req.body?.newPassword;
    if (password === newPassword) {
        generalLogger.println(`Session [${req.sessionID}] failed to change password for user [${userId}] due to an invalid operation.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_OPERATION));
        return;
    }
    if (!checkTextAllowedMax(password) || !checkTextAllowedMax(newPassword)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to change password for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const updateResult = await statements.account.UPDATE_PASSWORD.exec(conn, userId, password, newPassword);
    await conn.release();
    if (!updateResult.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to change password for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] changed password for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userRouter.put<IUserParams, any, IChangeAllowPasswordBody, {}, IUserLocals>('/:userIndex/allow-password', async function (req, res) {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to change password login settings for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const allowPassword = req.body?.allowPassword;
    const password = req.body?.password;
    if (typeof allowPassword !== 'boolean' || !checkTextAllowedMax(password)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to change password login settings for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    if (!allowPassword) {
        const [frow] = await statements.account.QUERY_PASSKEY_TOTAL.exec(conn, userId);
        if (!(frow?.total > 0)) {
            await conn.release();
            generalLogger.println(`Session [${req.sessionID}] attempted to disable password login for user [${userId}], but the operation was blocked because password login is the only authentication method enabled.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.REQUIRE_ONE_AUTH_METHOD));
            return;
        }
    }

    const updateResult = await statements.account.UPDATE_ALLOW_PASSWORD.exec(
        conn,
        userId,
        allowPassword ? null : password,
        allowPassword,
        allowPassword ? password : null
    );
    await conn.release();
    if (!updateResult.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to change password login settings for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully changed password login settings for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userRouter.use("/:userIndex/passkey", userPasskeyRouter);
userRouter.use("/:userIndex/token", userTokenRouter);
userRouter.use('/:userIndex/variable-table', userVariableTableRouter);
