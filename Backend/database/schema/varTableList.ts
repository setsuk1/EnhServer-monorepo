import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const varTableList = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.VAR_TABLE_LIST} (
                id          INT     AUTO_INCREMENT,
                belong_acc  INT,
                name        NVARCHAR(50) UNIQUE NOT NULL,

                PRIMARY KEY (id),
                FOREIGN KEY (belong_acc) REFERENCES ${tableList.ACCOUNTS}(id)
            )
        `));
    },
    REMOVE_UNIQUE_NAME(conn: PoolConnection): Promise<any> {
        return conn.query(
            `ALTER TABLE ${tableList.VAR_TABLE_LIST} DROP CONSTRAINT IF EXISTS name`
        );
    },
    ADD_COLUMN_CREATED_AT(conn: PoolConnection): Promise<any> {
        return conn.query(
            `ALTER TABLE ${tableList.VAR_TABLE_LIST} ADD created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP`
        );
    },
    CHANGE_COLUMN_NAME(conn: PoolConnection) {
        return conn.query(
            `ALTER TABLE ${tableList.VAR_TABLE_LIST} CHANGE name nickname NVARCHAR(64)`
        );
    },
    async MODIFY_FOREIGN_KEY_FOR_BELONG_ACC(conn: PoolConnection) {
        await conn.query(`ALTER TABLE ${tableList.VAR_TABLE_LIST} DROP FOREIGN KEY varTableList_ibfk_1`)

        await conn.query(clearSqlStatements(
            `ALTER TABLE ${tableList.VAR_TABLE_LIST} ADD CONSTRAINT varTableList_ibfk_1 
            FOREIGN KEY (belong_acc) REFERENCES ${tableList.ACCOUNTS}(id)
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `))
    }
}
