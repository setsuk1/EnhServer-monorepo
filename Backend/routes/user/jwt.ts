import { Router } from "express";
import { jwtVerify, SignJWT } from "jose";
import { jwtSecretKey } from "../../main.js";
import { Message } from "../../other/Message.js";

export const jwtRouter = Router();

jwtRouter.all("/:id", async (req, res, next) => {
    if (!req.session.account?.[req.params.id]) {
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
        return;
    }
    next();
});

const tempEnvVar = {
    JWT_ISSUER: "EnhServer",
    JWT_AUDIENCE: "AUDIENCE",
    JWT_EXPIRATION_TIME: "1 day",
}

// create jwt
jwtRouter.get("/:id", async (req, res) => {
    const account = req.session.account[+req.params.id].account;

    const token = await new SignJWT({
        id: account,
    }) // details to  encode in the token
        .setProtectedHeader({
            alg: 'HS256'
        }) // algorithm
        .setIssuedAt()
        .setIssuer(tempEnvVar.JWT_ISSUER) // issuer
        .setAudience(tempEnvVar.JWT_AUDIENCE) // audience
        .setExpirationTime(tempEnvVar.JWT_EXPIRATION_TIME) // token expiration time, e.g., "1 day"
        .sign(jwtSecretKey); // secretKey generated from previous step
    console.log(token); // log token to console
    res.send(new Message(Message.TYPE.SUCCESS, token).toArray());
})

export async function verifyJWT(token: string) {
        try {
        // verify token
        const { payload, protectedHeader } = await jwtVerify(token, jwtSecretKey, {
            issuer: tempEnvVar.JWT_ISSUER, // issuer
            audience: tempEnvVar.JWT_AUDIENCE, // audience
        });
        // log values to console
        return new Message(Message.TYPE.SUCCESS, payload).toArray();
    } catch (e) {
        // token verification failed
        console.log("Token is invalid");
        return new Message(Message.TYPE.GENERIC_ERROR).toArray();
    }
}

// verify jwt
jwtRouter.post("/", async (req, res) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    try {
        // verify token
        const { payload, protectedHeader } = await jwtVerify(token, jwtSecretKey, {
            issuer: tempEnvVar.JWT_ISSUER, // issuer
            audience: tempEnvVar.JWT_AUDIENCE, // audience
        });
        // log values to console
        console.log(payload);
        console.log(protectedHeader);
        res.send(new Message(Message.TYPE.SUCCESS).toArray());
    } catch (e) {
        // token verification failed
        console.log("Token is invalid");
        res.send(new Message(Message.TYPE.GENERIC_ERROR).toArray());
    }

})

