import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const schema = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.SCHEMA} (
                id              INT          AUTO_INCREMENT,
                VERSION_DATE    VARCHAR(50)  NOT NULL,

                PRIMARY KEY (id)
            )
        `));
    }
}
