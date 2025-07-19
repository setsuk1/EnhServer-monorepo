import { jwtVerify, SignJWT, type JWTPayload } from "jose";
import { JWT_AUDIENCE, JWT_ISSUER } from "../env.js";
import { LOG_LEVEL, loggerPool } from "../instanceExport.js";
import { jwtSecretKey, redisClient } from "../main.js";
import { tokenExpiration } from "../other/TokenTypeList.js";
import { Logger } from "./Console/Logger.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.JWT_HELPER);

export async function signJWT(payload: JWTPayload, type: number = 1) {
    const expiration = tokenExpiration[type] || tokenExpiration[1];
    logger.println(`JWT type = ${type}`, LOG_LEVEL.MOST_VERBOSE);
    logger.println(`JWT expiration = ${expiration}`, LOG_LEVEL.MOST_VERBOSE);

    const token = await new SignJWT(payload) // details to  encode in the token
        .setProtectedHeader({
            alg: 'HS256'
        }) // algorithm
        .setIssuedAt()
        .setIssuer(JWT_ISSUER) // issuer
        .setAudience(JWT_AUDIENCE) // audience
        .setExpirationTime(expiration) // token expiration time, e.g., "1 day"
        .sign(jwtSecretKey); // secretKey generated from previous step
    return token;
}

export async function verifyJWT(token: string) {
    logger.println(`Verifying JWT.`, LOG_LEVEL.VERBOSE);
    try {
        // verify token
        const { payload, protectedHeader } = await jwtVerify(token, jwtSecretKey, {
            issuer: JWT_ISSUER, // issuer
            audience: JWT_AUDIENCE, // audience
        });
        const userId = +(await redisClient.pubClient.get(`token_${payload.id}`));
        // log values to console
        return { userId };
    } catch (e) {
        // token verification failed
        return undefined;
    }
}