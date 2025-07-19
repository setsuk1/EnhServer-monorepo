import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const groupContent = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.GROUP_CONTENT} (
                id    INT,
                -- targets
                tTokenId    INT,
                tAccountId  INT,

                
                -- FOREIGN KEY (id) REFERENCES ${tableList.GROUP_LIST}(id),
                -- FOREIGN KEY (tTokenId) REFERENCES ${tableList.JWT_TOKEN}(id),
                -- FOREIGN KEY (tAccountId) REFERENCES ${tableList.ACCOUNTS}(id)

                FOREIGN KEY groupContent_ibfk_1(id) REFERENCES ${tableList.GROUP_LIST}(id)
                    ON DELETE CASCADE 
                    ON UPDATE CASCADE,
                FOREIGN KEY groupContent_ibfk_2(tTokenId) REFERENCES ${tableList.JWT_TOKEN}(id)
                    ON DELETE CASCADE 
                    ON UPDATE CASCADE,
                FOREIGN KEY groupContent_ibfk_3(tAccountId) REFERENCES ${tableList.ACCOUNTS}(id)
                    ON DELETE CASCADE 
                    ON UPDATE CASCADE
            )
        `));
    },
}
