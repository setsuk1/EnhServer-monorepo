import { createPool, type Pool } from "mariadb";
import { DB_ADDR, DB_NAME, DB_PORT, DB_USER, DB_USER_PWD } from "../env.js";
import { schemas } from "./schemas.js";

export const tableList = {
    SCHEMA: "SCHEMA",
    ACCOUNTS: "accounts",
    PASSKEY: "passkey",
    ACCOUNT_OPTIONS: "accountOptions",
    VAR_TABLE_LIST: "varTableList",
    VAR_TABLE_DATA: "varTableData",
    JWT_TOKEN: "jwtToken",
}

export class Database {
    protected pool: Pool;

    static STATEMENT = {
        LOGIN_ACCOUNT: `select account from ${tableList.ACCOUNTS} WHERE account = ? and password = ?`,
        QUERY_ACCOUNT: `select id, account from ${tableList.ACCOUNTS} WHERE account = ?`,
        REGISTER_ACCOUNT: `INSERT INTO ${tableList.ACCOUNTS} (account, password) VALUES (?, ?)`,
        REGISTER_ACCOUNT_OPTIONS: `INSERT INTO ${tableList.ACCOUNT_OPTIONS} (id, allowPassword) VALUES (?, ?)`,

        GET_PASSKEY_CREDENTIAL_BY_USERNAME: `select cred_id, transports from ${tableList.PASSKEY} where internal_user_id = (SELECT id from ${tableList.ACCOUNTS} WHERE account = ?)`,
        GET_PASSKEY_CREDENTIAL: `select * from ${tableList.PASSKEY} where cred_id = ?`,
        UPDATE_PASSKEY_CREDENTIAL_COUNTER: `UPDATE ${tableList.PASSKEY} SET counter = ? where cred_id = ?`,
        ADD_PASSKEY_CREDENTIAL: `INSERT INTO ${tableList.PASSKEY} (
            cred_id, cred_public_key, counter, transports, internal_user_id
        ) VALUES (
            ?, ?, ?, ?, (SELECT id from ${tableList.ACCOUNTS} where account = ?)
        )`
    }

    constructor() {
        this.init();
    }

    async init() {
        console.log("Initializing database.");
        this.pool = createPool({
            database: DB_NAME,
            user: DB_USER,
            password: DB_USER_PWD,
            host: DB_ADDR,
            port: DB_PORT
        })
        await this.checkSchema();
    }

    async checkSchema() {
        console.log("Check schema");
        let conn = await this.getConn()

        console.log("Get table");
        let tables = await conn.query("show tables;");
        let tableList = Array.from(tables).flatMap(v => Object.values(v));
        if (!tableList.includes("SCHEMA")) {
            conn.release();
            console.log("Schema not exist");
            return this.updateSchema();
        }

        console.log("Start to check schema version.");
        let schema = await conn.query("select * from SCHEMA");
        let schemaList = Array.from(schema) as { id: number, VERSION_DATE: string }[];
        let currentVersion = schemaList.at(-1).VERSION_DATE;
        console.log(`Current database schema version is [${currentVersion}].`);
        if (currentVersion != Database.latestVersion) {
            conn.release()
            return this.updateSchema(currentVersion);
        }
        console.log("Current schema version is up to date.");
    }

    static latestVersion = schemas.at(-1).version;

    // async createSchema() {
    //     let conn = await this.getConn()
    //     schemas.forEach(async schema => {
    //         await conn.beginTransaction()
    //         await schema.func(conn);
    //         await conn.query(`
    //                 INSERT INTO ${tableList.SCHEMA} 
    //                 (VERSION_DATE) 
    //                 VALUES 
    //                 (?)
    //             `, schema.version)
    //         await conn.commit()
    //         if (schemas.indexOf(schema) !== 0)
    //             console.log(`${schema.version} update success`)
    //         else
    //             console.log(`${schema.version} schema created.`);
    //     })
    //     conn.release();
    // }

    async updateSchema(currentVersion?: string) {
        let outputStr = ["update", "create"];
        let isCreate = currentVersion === undefined;
        if (isCreate)
            console.log("No schema exist, try to create schema");
        else
            console.log("Schema is not the newest version, trying to update version.");

        let conn = await this.getConn();

        const index = schemas.findIndex(v => v.version == currentVersion);
        for (let v of schemas.filter((v, i) => i > index).values()) {
            console.log(`Schema version ${v.version}`)
            try {
                await conn.beginTransaction()
                await v.func(conn)
                await conn.query(`
                    INSERT INTO SCHEMA 
                    (VERSION_DATE) 
                    VALUES 
                    (?)
                `, v.version)
                console.log(`${v.version} ${outputStr[+isCreate]} success`)
                await conn.commit()
            } catch (e) {
                await conn.rollback()
                await conn.release();
                console.error(`${v.version} ${outputStr[+isCreate]} failed`)
                console.error(e)
                return Promise.reject();
            }
        }
    }

    getConn() {
        return this.pool.getConnection();
    }
}
