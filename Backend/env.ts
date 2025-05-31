import type { IEnvVars } from "./interfaces/IEnvVars.js";

const DEFAULT: IEnvVars = {
    DB_ADDR: "localhost",
    DB_PORT: 3306,
    DB_NAME: "EnhServer",
    DB_USER: "EnhServerUser",
    DB_USER_PWD: "CHANGE_TO_MY_PASSWORD_PLEASE",

    SOCKET_PATH: "/socket.io",
    SRV_ADDR: "0.0.0.0",
    PORT: 3000,

    RP_NAME: "Enh Server",
    RP_ID: "example.com",
    PROTOCOL: "https://",

    JWT_SECRET: "THIS_IS_JWT_SECRET_FOR_ENHSERVER_AND_MUST_BE_REPLACED!"
};

const DEBUG: IEnvVars = {
}

function getOrigin() {
    return `${PROTOCOL}${RP_ID}`
}

function stringToNumber(input: string) {
    if (!(input || input?.length))
        return undefined;
    let num = +input;
    if (isNaN(num))
        throw new Error(`Specified input [${input}] is not number`);
    return num;
}

export const DEVELOPMENT = +process.env.DEVELOPMENT || 0;

export const DB_ADDR = process.env.DB_ADDR || DEBUG.DB_ADDR || DEFAULT.DB_ADDR;
export const DB_PORT = stringToNumber(process.env.DB_PORT) || DEBUG.DB_PORT || DEFAULT.DB_PORT;
export const DB_NAME = process.env.DB_NAME || DEBUG.DB_NAME || DEFAULT.DB_NAME;
export const DB_USER = process.env.DB_USER || DEBUG.DB_USER || DEFAULT.DB_USER;
export const DB_USER_PWD = process.env.DB_USER_PWD || DEBUG.DB_USER_PWD || DEFAULT.DB_USER_PWD;

export const SOCKET_PATH = process.env.SOCKET_PATH || DEBUG.SOCKET_PATH || DEFAULT.SOCKET_PATH;
export const SRV_ADDR = process.env.SRVADDR || DEBUG.SRV_ADDR || DEFAULT.SRV_ADDR;
export const PORT = stringToNumber(process.env.PORT) || DEBUG.PORT || DEFAULT.PORT;


export const RP_NAME = process.env.RP_NAME || DEBUG.RP_NAME || DEFAULT.RP_NAME;
export const RP_ID = process.env.RP_ID || DEBUG.RP_ID || DEFAULT.RP_ID;
export const PROTOCOL = process.env.PROTOCOL || DEBUG.PROTOCOL || DEFAULT.PROTOCOL;
export const ORIGIN = getOrigin();

export const JWT_SECRET = process.env.JWT_SECRET || DEBUG.JWT_SECRET || DEFAULT.JWT_SECRET;



export function showRuntimeVariable() {
    console.log("Runtime variable: ")
    console.log(`  - Listening address: ${SRV_ADDR}`)
    console.log(`  - Port: ${PORT}`)
    console.log(`  - Socket listen path: ${SOCKET_PATH}`)
    if (DB_ADDR && DB_ADDR.length) {
        console.log(`  - Database address: ${DB_ADDR}`)
        console.log(`  - Database port: ${DB_PORT}`)
        console.log(`  - Database user: ${DB_USER}`)
        console.log(`  - Database name: ${DB_NAME}`)
        console.log(`  - Database password: <redacted>`)
    }
}