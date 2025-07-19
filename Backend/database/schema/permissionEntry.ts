import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const permissionEntry = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.PERMISSION_ENTRY} (
                id              INT    AUTO_INCREMENT,
                -- targets
                tVarTableId     INT    UNIQUE,
                
                PRIMARY KEY (id),

                -- FOREIGN KEY (tVarTableId) REFERENCES ${tableList.VAR_TABLE_LIST}(id)

                 
                FOREIGN KEY permissionEntry_ibfk_1(tVarTableId) REFERENCES ${tableList.VAR_TABLE_LIST}(id)
                    ON DELETE CASCADE 
                    ON UPDATE CASCADE
            )
        `));
    },
}
