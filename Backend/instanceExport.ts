import { Logger } from "./modules/Console/Logger.js";
import { Pool } from "./modules/generic/Pool.js";

export const loggerPool = new Pool(Logger);
export const version = {
    major: 0,
    minor: 0,
    patch: 1
}

export enum LOG_LEVEL {
    NORMAL = 1,
    VERBOSE,
    MORE_VERBOSE,
    MOST_VERBOSE,
    DEBUG
}