import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

/**
 * @deprecated
 */
export const accountOptions = {
    CREATE(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.ACCOUNT_OPTIONS} (
                id              INT,         -- Primary key (same as accounts.id) 
                allowPassword   BOOLEAN,
                nickname        VARCHAR(50),
            
                PRIMARY KEY (id),
                FOREIGN KEY (id) REFERENCES ${tableList.ACCOUNTS}(id)
            )
        `));
    },
    DROP(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            DROP TABLE IF EXISTS ${tableList.ACCOUNT_OPTIONS}
        `));
    }
}
