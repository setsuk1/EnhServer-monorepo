import type { PoolConnection } from "mariadb";

export interface ISchemaUpdater {
    version: string,
    func: (conn: PoolConnection) => Promise<void>;
}