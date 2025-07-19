import { PoolConnection } from "mariadb";
import { tableList } from "../tableList.js";

export const varTableData = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(`
            CREATE TABLE IF NOT EXISTS ${tableList.VAR_TABLE_DATA} (
                id          INT     AUTO_INCREMENT,
                table_id    INT,
                varKey      NVARCHAR(16384) NOT NULL,
                varValue    BLOB,

                PRIMARY KEY (id),
                FOREIGN KEY (table_id) REFERENCES ${tableList.VAR_TABLE_LIST}(id)
            )
        `);
    },
    ADD_UNIQUE_FOR_ID_AND_KEY(conn: PoolConnection): Promise<any> {
        return conn.query(`
            ALTER TABLE ${tableList.VAR_TABLE_DATA} ADD CONSTRAINT varKeyInTable UNIQUE (table_id, varKey)
        `);
    },
    async MODIFY_FOREIGN_KEY_FOR_TABLE_ID(conn: PoolConnection) {
        await conn.query(`ALTER TABLE ${tableList.VAR_TABLE_DATA} DROP FOREIGN KEY varTableData_ibfk_1`)
        
        await conn.query(`ALTER TABLE ${tableList.VAR_TABLE_DATA} ADD CONSTRAINT varTableData_ibfk_1 
            FOREIGN KEY (table_id) REFERENCES ${tableList.VAR_TABLE_LIST}(id)
            ON DELETE CASCADE 
            ON UPDATE CASCADE
        `)
    }
}
