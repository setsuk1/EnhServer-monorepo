import { PoolConnection } from "mariadb";
import { Logger } from "../modules/Console/Logger.js";

export interface ISchemaUpdater {
    version: string,
    func: (conn: PoolConnection, logger: Logger) => Promise<void>;
}