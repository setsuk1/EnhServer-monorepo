import {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    type AuthenticatorTransportFuture,
    type GenerateRegistrationOptionsOpts,
    type RegistrationResponseJSON,
    type VerifiedRegistrationResponse,
    type WebAuthnCredential
} from "@simplewebauthn/server";

import { Router } from "express";
import { statements } from '../../../database/statements.js';
import { ORIGIN, RP_ID, RP_NAME } from '../../../env.js';
import { LOG_LEVEL, loggerPool } from '../../../instanceExport.js';
import { IUserLocals } from '../../../interfaces/route/locals/IUserLocals.js';
import { IUserPasskeyLocals } from '../../../interfaces/route/locals/IUserPasskeyLocals.js';
import { IUserParams } from '../../../interfaces/route/params/IUserParams.js';
import { IUserPasskeyParams } from '../../../interfaces/route/params/IUserPasskeyParams.js';
import { IRenameBody } from '../../../interfaces/route/reqBody/IRenameBody.js';
import { db } from '../../../main.js';
import { Logger } from '../../../modules/Console/Logger.js';
import { Message } from '../../../other/Message.js';
import { MessageTypeList } from '../../../other/MessageTypeList.js';
import { checkIdExist, checkTextAllowedMax } from '../../helper/common.js';
import { checkUserIsPasskeyOwner } from '../../helper/passkey.js';

export const userPasskeyRouter = Router();

const loggerPrefix = Logger.PREFIX.API("user-passkey");
const passkeyLoggerPrefix = Logger.PREFIX.API("passkey-register");

const generalLogger = loggerPool.getInstance();
generalLogger.setPrefix(loggerPrefix);

const passkeyLogger = loggerPool.getInstance();
passkeyLogger.setPrefix(passkeyLoggerPrefix);

userPasskeyRouter.get<IUserParams, any, any, {}, IUserLocals>("/", async function (req, res) {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch all passkeys for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const conn = await db.getConn();
    const infos = await statements.account.QUERY_PASSKEY_INFO_BY_USER_ID.exec(conn, userId);
    await conn.release();

    generalLogger.println(`Session [${req.sessionID}] requested all passkeys for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, infos));
});

userPasskeyRouter.get<IUserParams, any, any, {}, IUserLocals>("/generate-registration-options", async function (req, res) {
    const user = res.locals.user;
    passkeyLogger.println("Generate registration options", LOG_LEVEL.VERBOSE);

    const conn = await db.getConn()
    const credential = await statements.account.QUERY_PASSKEY_BY_USER_ID.exec(conn, user.id);
    await conn.release();

    const excludeCredentials = credential.map(dev => ({
        id: dev.cred_id,
        transports: Array.from(dev.transports) as AuthenticatorTransportFuture[],
    }));
    const opts: GenerateRegistrationOptionsOpts = {
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user.account,
        attestationType: 'none',
        /**
         * Passing in a user's list of already-registered authenticator IDs here prevents users from
         * registering the same device multiple times. The authenticator will simply throw an error in
         * the browser if it's asked to perform registration when one of these ID's already resides
         * on it.
         */
        excludeCredentials,
        authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
        },
        /**
         * Support the two most common algorithms: ES256, and RS256
         */
        // supportedAlgorithmIDs: [-7, -257],
    };
    const options = await generateRegistrationOptions(opts);
    user.registerChallenge = options.challenge;

    res.send(new Message(MessageTypeList.REGISTER_PASSKEY_OPTIONS, options));
});

userPasskeyRouter.post<IUserParams, any, any, {}, IUserLocals>("/verify-registration", async function (req, res, next) {
    const user = res.locals.user;
    passkeyLogger.println("Verify registration", LOG_LEVEL.VERBOSE);

    const body: RegistrationResponseJSON = req.body;
    const expectedChallenge = user.registerChallenge;
    user.registerChallenge = undefined;
    if (!expectedChallenge) {
        res.send(new Message(MessageTypeList.INVALID_STATE));
        return;
    }

    let verification: VerifiedRegistrationResponse;
    try {
        verification = await verifyRegistrationResponse({
            response: body,
            expectedChallenge,
            expectedOrigin: ORIGIN,
            expectedRPID: RP_ID,
            requireUserVerification: false,
        });
    } catch (error: any) {
        const _error = error as Error;
        passkeyLogger.println(_error.message, LOG_LEVEL.MOST_VERBOSE);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR, _error.message));
        return;
    }

    const { verified, registrationInfo } = verification;
    let id: number;
    if (verified && registrationInfo) {
        passkeyLogger.println("Passkey registration success.", LOG_LEVEL.VERBOSE);
        const { credential } = registrationInfo;
        const conn = await db.getConn();
        const [frow] = await statements.account.QUERY_PASSKEY_ID_BY_USER_ID_CRED_ID.exec(conn, user.id, credential.id);
        if (!frow) {
            /**
             * Add the returned credential to the user's list of credentials
             */
            const newCred: WebAuthnCredential = {
                id: credential.id,
                publicKey: credential.publicKey,
                counter: credential.counter,
                transports: body.response.transports,
            };

            const [frow] = await statements.account.CREATE_PASSKEY.exec(conn, newCred.id, Buffer.from(newCred.publicKey), newCred.counter, JSON.stringify(newCred.transports), user.id);
            id = frow.id;
        } else {
            await conn.release();
            res.send(MessageTypeList.UNEXPECTED_ERROR);
            return;
        }
        await conn.release();
    } else {
        res.send(MessageTypeList.PASSKEY_REGISTERATION_VERIFY_FAILED);
        return;
    }

    res.send(new Message(MessageTypeList.SUCCESS, id));
});

userPasskeyRouter.all<IUserPasskeyParams, any, any, {}, IUserPasskeyLocals>(['/:passkeyId', '/:passkeyId/*'], checkIdExist('passkeyId'), checkUserIsPasskeyOwner);

userPasskeyRouter.get<IUserPasskeyParams, any, any, {}, IUserPasskeyLocals>("/:passkeyId", async function (req, res) {
    const { userId, passkeyId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch passkey [${passkeyId}] for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const conn = await db.getConn()
    const [info] = await statements.account.QUERY_PASSKEY_INFO_BY_ID.exec(conn, passkeyId);
    await conn.release();
    if (!info) {
        generalLogger.println(`Session [${req.sessionID}] failed to request passkey [${passkeyId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] requested passkey [${passkeyId}] for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, info));
});

userPasskeyRouter.delete<IUserPasskeyParams, any, any, {}, IUserPasskeyLocals>("/:passkeyId", async function (req, res) {
    const { userId, passkeyId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a delete passkey request for passkey [${passkeyId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const conn = await db.getConn();
    const [user] = await statements.account.QUERY_USER_BY_ID.exec(conn, userId);
    if (!user.allowPassword) {
        const [frow] = await statements.account.QUERY_PASSKEY_TOTAL.exec(conn, userId);
        if (!(frow?.total > 1)) {
            await conn.release();
            generalLogger.println(`Session [${req.sessionID}] attempted to delete passkey [${passkeyId}] for user [${userId}], but the operation was blocked because passkey login is the only enabled authentication method and this is the last remaining passkey.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.REQUIRE_ONE_AUTH_METHOD));
            return;
        }
    }

    const result = await statements.account.DELETE_PASSKEY_BY_ID.exec(conn, passkeyId);
    await conn.release();
    if (!result.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to delete passkey [${passkeyId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully deleted passkey [${passkeyId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userPasskeyRouter.put<IUserPasskeyParams, any, IRenameBody, {}, IUserPasskeyLocals>("/:passkeyId/nickname", async function (req, res) {
    const { userId, passkeyId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a passkey rename request for passkey [${passkeyId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const nickname = req.body?.nickname;
    if (!checkTextAllowedMax(nickname)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to rename passkey [${passkeyId}] for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const conn = await db.getConn();
    const result = await statements.account.UPDATE_PASSKEY_NICKNAME_BY_ID.exec(conn, passkeyId, nickname);
    await conn.release();
    if (!result.affectedRows) {
        generalLogger.println(`Session [${req.sessionID}] failed to rename passkey [${passkeyId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
        return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully renamed passkey [${passkeyId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});
