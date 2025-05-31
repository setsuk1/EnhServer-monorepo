import {
    generateAuthenticationOptions,
    generateRegistrationOptions,
    verifyAuthenticationResponse,
    verifyRegistrationResponse,
    type AuthenticatorTransportFuture,
    type GenerateRegistrationOptionsOpts,
    type RegistrationResponseJSON,
    type VerifiedAuthenticationResponse,
    type VerifiedRegistrationResponse,
    type WebAuthnCredential
} from "@simplewebauthn/server";

import { Router } from "express";
import { Database } from "../../database/Database.js";
import { ORIGIN, RP_ID, RP_NAME } from "../../env.js";
import { db } from "../../main.js";
import { Message } from "../../other/Message.js";

export const pskRouter = Router();

pskRouter.get("/generate-registration-options", async function (req, res) {
    console.log("Generate registration options");
    if (isNaN(req?.session?.currentAccount)) {
        console.error(`${req.sessionID} has not logged in.`);
        res.send(new Message(Message.TYPE.HAS_NOT_LOGGED_IN).toArray());
        return;
    }

    const user = req.session.account[req.session.currentAccount].account;
    const conn = await db.getConn()
    const credential: { cred_id: string, transports: string }[] = Array.from(await conn.query(Database.STATEMENT.GET_PASSKEY_CREDENTIAL_BY_USERNAME, [user]));

    const excludeCredentials = credential.map(dev => ({
        id: dev.cred_id,
        // type: 'public-key',
        transports: Array.from(dev.transports) as AuthenticatorTransportFuture[],
    }));
    conn.release();

    const opts: GenerateRegistrationOptionsOpts = {
        rpName: RP_NAME,
        rpID: RP_ID,
        userName: user,
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

    req.session.registerChallenge = options.challenge;

    res.send(new Message(Message.TYPE.REGISTER_PASSKEY_OPTIONS, options).toArray());
});

pskRouter.post("/verify-registration", async function (req, res, next) {
    console.log("Verify registration");
    const body: RegistrationResponseJSON = req.body;

    const user = req.session.account[req.session.currentAccount].account;

    const expectedChallenge = req.session.registerChallenge;

    if (!expectedChallenge) {
        res.send(new Message(Message.TYPE.INVALID_STATE).toArray());
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
        console.error(_error.message);
        res.send(new Message(Message.TYPE.UNEXPECTED_ERROR, _error.message).toArray());
        return;
    }

    const { verified, registrationInfo } = verification;

    if (verified && registrationInfo) {
        const { credential } = registrationInfo;

        const conn = await db.getConn();

        const existingCredential = Array.from(await conn.query(Database.STATEMENT.GET_PASSKEY_CREDENTIAL_BY_USERNAME, [user])).find((psk: any) => psk.cred_id == credential.id);

        if (!existingCredential) {
            /**
             * Add the returned credential to the user's list of credentials
             */
            const newCred: WebAuthnCredential = {
                id: credential.id,
                publicKey: credential.publicKey,
                counter: credential.counter,
                transports: body.response.transports,
            };

            // insert to db
            const values = [newCred.id, Buffer.from(newCred.publicKey), newCred.counter, JSON.stringify(newCred.transports), user];
            await conn.query(Database.STATEMENT.ADD_PASSKEY_CREDENTIAL, values);
        } else {
            // update db
            // conn.query()
        }
        conn.release();
    }

    req.session.registerChallenge = undefined;

    res.send(new Message(verified ? Message.TYPE.SUCCESS : Message.TYPE.PASSKEY_REGISTERATION_VERIFY_FAILED).toArray());
})

pskRouter.post("/generate-authentication-options", async function (req, res, next) {
    console.log("Generate authentication options")
    const user = req.body.acc;

    if (req.session.account && req.session.account.find(value => value.account == user)?.isLoggedIn === true) {
        res.send(new Message(Message.TYPE.HAS_LOGGED_IN).toArray());
        return;
    }

    const conn = await db.getConn();
    let accList = Array.from(await conn.query(Database.STATEMENT.QUERY_ACCOUNT, [user]));

    if (!accList.length) {
        conn.release();
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
        return;
    }

    const credential: { cred_id: string, transports: string }[] = Array.from(await conn.query(Database.STATEMENT.GET_PASSKEY_CREDENTIAL_BY_USERNAME, [user]));

    conn.release();

    const allowCredentials = credential.map(dev => ({
        id: dev.cred_id,
        type: 'public-key',
        transports: Array.from(dev.transports) as AuthenticatorTransportFuture[],
    }));

    if (!allowCredentials.length) {
        console.error(`No credential for user [${user}]`);
        res.send(new Message(Message.TYPE.NO_PASSKEY_CRED).toArray());
        return;
    }

    const options = await generateAuthenticationOptions({
        // Require users to use a previously-registered authenticator
        rpID: RP_ID,
        allowCredentials,
        userVerification: 'preferred',
    });

    req.session.authenticateChallenge = options.challenge;
    req.session.authenticateOptions = {
        acc: user
    };

    res.send(new Message(Message.TYPE.SUCCESS, options).toArray());
});


pskRouter.post("/verify-authentication", async function (req, res, next) {
    console.log("Verify authentication")

    if (!req.session.authenticateOptions) {
        res.send(new Message(Message.TYPE.INVALID_STATE).toArray());
        return;
    }

    const { body } = req;

    const expectedChallenge = req.session.authenticateChallenge;
    const conn = await db.getConn();

    const authenticator: any[] = Array.from(await conn.query(Database.STATEMENT.GET_PASSKEY_CREDENTIAL, [body.id]));

    conn.release();

    const rawCredential = authenticator.find(v => v.cred_id == body.id);
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
    } catch (error: any) {
        console.error(error);
        res.send(new Message(Message.TYPE.UNEXPECTED_ERROR, error.message).toArray());
        return;
    }

    const { verified } = verification;

    if (!verified) {
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
        return;
    }

    if (!req.session.account)
        req.session.account = [];

    let checkIndex = req.session.account.findIndex(v => v.account == req.session.authenticateOptions.acc);
    if (checkIndex !== -1) {
        if (req.session.account[checkIndex].isLoggedIn) {
            console.log(`[${req.sessionID}] has logged in in as ${req.session.authenticateOptions.acc}`);
            res.send(new Message(Message.TYPE.HAS_LOGGED_IN).toArray());
            return;
        }
        req.session.account[checkIndex].isLoggedIn = true;
        req.session.currentAccount = checkIndex;
    } else {
        req.session.account.push({
            account: req.session.authenticateOptions.acc,
            isLoggedIn: true
        })
        req.session.currentAccount = 0;
    }

    req.session.authenticateChallenge = undefined;
    req.session.authenticateOptions = undefined;

    res.send(new Message(Message.TYPE.SUCCESS).toArray());
});

export { pskRouter as signRouter };

