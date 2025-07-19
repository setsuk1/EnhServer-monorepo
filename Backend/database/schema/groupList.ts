import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const groupList = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.GROUP_LIST} (
                id    INT AUTO_INCREMENT,
                name  NVARCHAR(50),
                -- external ref
                accId INT,

                PRIMARY KEY (id),

                -- FOREIGN KEY (accId) REFERENCES ${tableList.ACCOUNTS}(id),
                
                FOREIGN KEY groupList_ibfk_1(accId) REFERENCES ${tableList.ACCOUNTS}(id)
                ON DELETE CASCADE 
                ON UPDATE CASCADE
            )
        `));
    },
}
