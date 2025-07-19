import { loggerPool, version } from "./instanceExport.js";
import { IEnvVars } from "./interfaces/IEnvVars.js";

const DEFAULT: IEnvVars = {
    SOCKET_PATH: "/socket.io",
    SRV_ADDR: "0.0.0.0",
    SRV_PORT: 80,
    SESSION_SECRET: String.fromCharCode(
        ...new Array(50 + Math.floor(Math.random() * 50))
            .fill(0)
            .map(() => 32 + Math.floor(Math.random() * 95))
    ),

    DB_ADDR: "localhost",
    DB_PORT: 3306,
    DB_NAME: "EnhServer",
    DB_USER: "EnhServerUser",
    DB_USER_PWD: "CHANGE_TO_MY_PASSWORD_PLEASE",

    RP_NAME: "Enh Server",
    RP_ID: "example.com",
    PROTOCOL: "https",

    JWT_SECRET: "THIS_IS_JWT_SECRET_FOR_ENHSERVER_AND_MUST_BE_REPLACED!",
    JWT_ISSUER: "EnhServer",
    JWT_AUDIENCE: "EnhUser",

    REDIS_ADDRESS: "localhost",
    REDIS_PORT: 6379,

    LOG_LEVEL: 1
};

const DEBUG: IEnvVars = {};

function stringToNumber(input: string) {
    if (!(input || input?.length))
        return undefined;
    let num = +input;
    if (isNaN(num))
        throw new Error(`Specified input [${input}] is not number`);
    return num;
}

export const DEVELOPMENT = +process.env.DEVELOPMENT || 0;

if (DEVELOPMENT) {
    DEBUG.LOG_LEVEL = 5;
}

// Web Server & Socket Server
export const SOCKET_PATH = process.env.SOCKET_PATH || DEBUG.SOCKET_PATH || DEFAULT.SOCKET_PATH;
export const SRV_ADDR = process.env.SRV_ADDR || DEBUG.SRV_ADDR || DEFAULT.SRV_ADDR;
export const SRV_PORT = stringToNumber(process.env.SRV_PORT) || DEBUG.SRV_PORT || DEFAULT.SRV_PORT;
export const SESSION_SECRET = process.env.SESSION_SECRET || DEBUG.SESSION_SECRET || DEFAULT.SESSION_SECRET;
// Database related
export const DB_ADDR = process.env.DB_ADDR || DEBUG.DB_ADDR || DEFAULT.DB_ADDR;
export const DB_PORT = stringToNumber(process.env.DB_PORT) || DEBUG.DB_PORT || DEFAULT.DB_PORT;
export const DB_NAME = process.env.DB_NAME || DEBUG.DB_NAME || DEFAULT.DB_NAME;
export const DB_USER = process.env.DB_USER || DEBUG.DB_USER || DEFAULT.DB_USER;
export const DB_USER_PWD = process.env.DB_USER_PWD || DEBUG.DB_USER_PWD || DEFAULT.DB_USER_PWD;
// Passkey
export const RP_NAME = process.env.RP_NAME || DEBUG.RP_NAME || DEFAULT.RP_NAME;
export const RP_ID = process.env.RP_ID || DEBUG.RP_ID || DEFAULT.RP_ID;
export const PROTOCOL = process.env.PROTOCOL || DEBUG.PROTOCOL || DEFAULT.PROTOCOL;
export const ORIGIN = `${PROTOCOL}://${RP_ID}`;
// JWT
export const JWT_SECRET = process.env.JWT_SECRET || DEBUG.JWT_SECRET || DEFAULT.JWT_SECRET;
export const JWT_ISSUER = process.env.JWT_ISSUER || DEBUG.JWT_ISSUER || DEFAULT.JWT_ISSUER;
export const JWT_AUDIENCE = process.env.JWT_AUDIENCE || DEBUG.JWT_AUDIENCE || DEFAULT.JWT_AUDIENCE;
// Redis
export const REDIS_ADDRESS = process.env.REDIS_ADDRESS || DEBUG.REDIS_ADDRESS || DEFAULT.REDIS_ADDRESS;
export const REDIS_PORT = process.env.REDIS_PORT || DEBUG.REDIS_PORT || DEFAULT.REDIS_PORT;
// Logger output
export const LOG_LEVEL = +process.env.LOG_LEVEL || DEBUG.LOG_LEVEL || DEFAULT.LOG_LEVEL;

export function showRuntimeVariable() {
    const logger = loggerPool.getInstance();
    logger.println(`Welcome to EnhServer Backend v${version.major}.${version.minor}.${version.patch}`);
    logger.println("Runtime variable: ");
    logger.setIndent('set', 1);
    logger.setPrefix("- ");
    logger.setTime(false);

    logger.println(`Listening address: ${SRV_ADDR}`,);
    logger.println(`Port: ${SRV_PORT}`);
    logger.println(`Socket listen path: ${SOCKET_PATH}`);
    logger.println(`SESSION_SECRET: ${SESSION_SECRET == DEFAULT.SESSION_SECRET ? "Auto generated random secret" : "Configured"}`);
    logger.println(`Current log level: ${LOG_LEVEL}`);

    logger.println(`Passkey:`);
    logger.setIndent("add", 1);
    logger.println(`Name: ${RP_NAME}`);
    logger.println(`Id: ${RP_ID}`);
    logger.println(`Protocol: ${PROTOCOL}`);
    logger.println(`Origin: ${ORIGIN}`);
    logger.setIndent("reduce", 1);


    if (DB_ADDR && DB_ADDR.length) {
        logger.println(`Database:`);
        logger.setIndent("add", 1);
        logger.println(`Address: ${DB_ADDR}`);
        logger.println(`Port: ${DB_PORT}`);
        logger.println(`Name: ${DB_NAME}`);
        logger.println(`User: ${DB_USER}`);
        logger.println(`Password: <redacted>`);
        logger.setIndent("reduce", 1);
    }

    logger.println(`JSON Web Token:`);
    logger.setIndent("add", 1);
    logger.println(`Secret: ${JWT_SECRET == DEFAULT.JWT_SECRET ? "Not configured, use default" : "Configured"}`);
    logger.println(`Issuer: ${JWT_ISSUER}`);
    logger.println(`Audience: ${JWT_AUDIENCE}`);
    logger.setIndent("reduce", 1);

    if (REDIS_ADDRESS && REDIS_ADDRESS.length) {
        logger.println(`Redis:`);
        logger.setIndent("add", 1);
        logger.println(`Address: ${REDIS_ADDRESS}`);
        logger.println(`Port: ${REDIS_PORT}`);
        logger.setIndent("reduce", 1);
    }

    logger.setIndent('set', 0);
    logger.setTime(true);
    loggerPool.releaseInstance(logger);
}