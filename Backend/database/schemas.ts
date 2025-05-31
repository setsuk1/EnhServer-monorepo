import type { PoolConnection } from "mariadb";
import type { ISchemaUpdater } from "../interfaces/ISchemaUpdater.js";
import { tableList } from "./Database.js";

export const schemas: ISchemaUpdater[] = [
    {
        version: '2025-05-10',
        func: async function (conn: PoolConnection) {
            console.log(`Create schema [${this.version}]`)

            console.log("    - Create schema table");
            return conn.query(`
            CREATE TABLE if not exists ${tableList.SCHEMA} (
                id INT PRIMARY KEY AUTO_INCREMENT,
                VERSION_DATE VARCHAR(50) NOT NULL
            )`);
        }
    },
    {
        version: "2025-05-11",
        func: async function (conn: PoolConnection) {
            console.log(`Create schema [${this.version}]`)

            console.log("    - Create account table");
            await conn.query(`
            -- Basic account schema creation
            CREATE TABLE IF NOT EXISTS ${tableList.ACCOUNTS} (
                id          INT             AUTO_INCREMENT,
                account     NVARCHAR(50)    NOT NULL,
                password    NVARCHAR(50),       -- Use 50 if longer passwords may be used)
                created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )`)

            console.log("    - Create passkey table");
            await conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.PASSKEY} (
                cred_id             VARCHAR(255) PRIMARY KEY,      -- Base64Url string representation
                cred_public_key     BLOB,                          -- Public key for authentication
                internal_user_id    INT REFERENCES ${tableList.ACCOUNTS}(id),   -- Your own user ID integer  
                counter             INT DEFAULT 0,                 -- Use INTEGER if large numbers needed
                transports          VARCHAR(255),                  -- e.g., "usb,nfc"
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used           TIMESTAMP NULL                  -- Nullable if not used yet
            )`)

            console.log("    - Create account options table");
            await conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.ACCOUNT_OPTIONS} (
                id              INT,         -- Primary key (same as accounts.id) 
                allowPassword   BOOLEAN,
                nickname        VARCHAR(50),
            
                PRIMARY KEY (id),
                FOREIGN KEY (id) REFERENCES ${tableList.ACCOUNTS}(id)
            )`)

            console.log("    - Create Variable Table List table");
            await conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.VAR_TABLE_LIST} (
                id          INT     AUTO_INCREMENT,
                belong_acc  INT,
                name        NVARCHAR(50) UNIQUE NOT NULL,

                PRIMARY KEY (id),
                FOREIGN KEY (belong_acc) REFERENCES ${tableList.ACCOUNTS}(id)
            )`)

            console.log("    - Create Variable Table Data table");
            await conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.VAR_TABLE_DATA} (
                id          INT     AUTO_INCREMENT,
                table_id    INT,
                varKey         NVARCHAR(16384) NOT NULL,
                varValue       BLOB,

                PRIMARY KEY (id),
                FOREIGN KEY (table_id) REFERENCES ${tableList.VAR_TABLE_LIST}(id)
            )`)

            console.log("    - Create JSON Web Token (RFC 7519) table");
            await conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.JWT_TOKEN} (
                id          INT     AUTO_INCREMENT,
                acc_id      INT,
                tokenString VARCHAR(8192) NOT NULL,

                PRIMARY KEY (id),
                FOREIGN KEY (acc_id) REFERENCES ${tableList.ACCOUNTS}(id)
            )`)
        }
    },
]