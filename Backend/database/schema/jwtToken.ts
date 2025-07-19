import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const jwtToken = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.JWT_TOKEN} (
                id          INT     AUTO_INCREMENT,
                acc_id      INT,
                tokenString VARCHAR(8192) NOT NULL,

                PRIMARY KEY (id),
                FOREIGN KEY (acc_id) REFERENCES ${tableList.ACCOUNTS}(id)
            )
        `));
    },
    ADD_NICKNAME(conn: PoolConnection): Promise<any> {
        return conn.query(`ALTER TABLE ${tableList.JWT_TOKEN} ADD COLUMN nickname NVARCHAR(64) NOT NULL DEFAULT "預設Token"`)
    },
    async MODIFY_FOREIGN_KEY_FOR_ACCOUNT_ID(conn: PoolConnection) {
        await conn.query(`ALTER TABLE ${tableList.JWT_TOKEN} DROP FOREIGN KEY jwtToken_ibfk_1`)

        await conn.query(clearSqlStatements(
            `ALTER TABLE ${tableList.JWT_TOKEN} ADD CONSTRAINT jwtToken_ibfk_1 
            FOREIGN KEY (acc_id) REFERENCES ${tableList.ACCOUNTS}(id)
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `))
    }
}
