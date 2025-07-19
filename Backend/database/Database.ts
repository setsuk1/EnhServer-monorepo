import { createPool, type Pool, type PoolConnection } from "mariadb";
import { DB_ADDR, DB_NAME, DB_PORT, DB_USER, DB_USER_PWD } from "../env.js";
import { loggerPool } from "../instanceExport.js";
import { redisStore } from "../main.js";
import { Logger } from "../modules/Console/Logger.js";
import { clearSqlStatements } from "../routes/helper/common.js";
import { schemas } from "./schemas.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.DATABASE)

const INSERT_STATEMENT = clearSqlStatements(`
    INSERT INTO SCHEMA 
    (VERSION_DATE) 
    VALUES 
    (?)
`);

export class Database {
    protected pool: Pool;
    inited: boolean = false

    constructor() {
        this.init();
    }

    async init() {
        logger.println("Initializing database.");
        this.pool = createPool({
            database: DB_NAME,
            user: DB_USER,
            password: DB_USER_PWD,
            host: DB_ADDR,
            port: DB_PORT
        })
        await this.checkSchema();
        this.inited = true;
    }

    async checkSchema() {
        logger.println("Check schema");
        const conn = await this.getConn()

        logger.println("Get table");
        const tables = await conn.query("show tables");
        const tableList = Array.from(tables).flatMap(v => Object.values(v));
        if (!tableList.includes("SCHEMA")) {
            await conn.release();
            logger.println("Schema not exist")
            return this.updateSchema();
        }

        logger.println("Start to check schema version.")
        const schema = await conn.query("select VERSION_DATE from SCHEMA");
        const schemaList = Array.from(schema) as { VERSION_DATE: string }[];
        const currentVersion = schemaList.at(-1).VERSION_DATE;

        await conn.release()

        logger.println(`Current database schema version is [${currentVersion}].`)
        if (currentVersion != Database.latestVersion)
            return this.updateSchema(currentVersion);
        logger.println("Current schema version is up to date.")
    }

    static latestVersion = schemas.at(-1).version;

    async updateSchema(currentVersion?: string) {
        try {
            logger.println("Try to clear all session");
            await redisStore.clear();
        } catch (e) {
            const _err = e as Error;
            logger.println(`Clear session failed, reason: ${_err.message}`);
        }

        const outputStr = ["update", "create"];
        const isCreate = currentVersion === undefined;
        if (isCreate)
            logger.println("No schema exist, try to create schema")
        else
            logger.println("Schema is not the newest version, trying to update version.")

        const conn = await this.getConn();

        logger.setPrefix(Logger.PREFIX.DATABASE.replace("]", "Updater]"));
        const index = schemas.findIndex(v => v.version == currentVersion);
        for (const v of schemas.filter((v, i) => i > index).values()) {
            logger.println(`Create schema version ${v.version}`)
            try {
                await conn.beginTransaction()
                logger.setIndent("set", 1);
                await v.func(conn, logger)
                await conn.query(INSERT_STATEMENT, v.version)
                logger.setIndent("set", 0);
                logger.println(`${v.version} ${outputStr[+isCreate]} success`)
                await conn.commit()
            } catch (e) {
                logger.setIndent("set", 0);
                logger.println("Rollback");
                await conn.rollback()
                await conn.release();
                logger.println(`${v.version} ${outputStr[+isCreate]} failed`)
                logger.println(e)
                return Promise.reject();
            }
        }
        await conn.release();
    }

    getConn() {
        if (this.pool.idleConnections())
            return this.pool.getConnection();
        return new Promise<PoolConnection | PromiseLike<PoolConnection>>((res, rej) => {
            let failedTimes = 0;
            const i = setInterval(() => {
                if (failedTimes > 1000) {
                    rej(`Wait for ${failedTimes} periods, too long to get a connection.`);
                }
                if (this.pool.idleConnections() === 0) {
                    failedTimes++;
                    return
                }
                clearInterval(i);
                this.pool.getConnection().then(res, () => { });
            }, 100)
        })
    }
}
