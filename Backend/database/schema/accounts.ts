import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const accounts = {
    CREATE(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            -- Basic account schema creation
            CREATE TABLE IF NOT EXISTS ${tableList.ACCOUNTS} (
                id          INT             AUTO_INCREMENT,
                account     NVARCHAR(50)    NOT NULL,
                password    NVARCHAR(50),       -- Use 50 if longer passwords may be used)
                created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        `));
    },
    ADD_COLUMN_NICKNAME_AND_ALLOW_PASSWORD(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            ALTER TABLE ${tableList.ACCOUNTS}
            ADD COLUMN allowPassword    BOOLEAN         DEFAULT TRUE,
            ADD COLUMN nickname         NVARCHAR(64)     DEFAULT 'User'
        `));
    },
    MODIFY_COLUMN_ACCOUNT_AND_PASSWORD(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            ALTER TABLE ${tableList.ACCOUNTS}
            MODIFY account  NVARCHAR(64) UNIQUE NOT NULL,
            MODIFY password NVARCHAR(64)
        `));
    },
}
