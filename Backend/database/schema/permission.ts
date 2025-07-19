import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const permission = {
    CREATE(conn: PoolConnection): Promise<any> {
        return conn.query(clearSqlStatements(`
        CREATE TABLE IF NOT EXISTS ${tableList.PERMISSION} (
            id          INT     AUTO_INCREMENT,
            -- reference
            rEntryId    INT,
            -- targets
            tDomain     NVARCHAR(256),
            tTokenId    INT,
            tAccountId  INT,
            tGroupId    INT,
            -- permissions
            pRead       BOOL,
            pWrite      BOOL,
            pUpdate     BOOL,
            pDelete     BOOL,

            -- primary key
            PRIMARY KEY (id),
            -- ref foreign key
            -- FOREIGN KEY (rEntryId) REFERENCES ${tableList.PERMISSION_ENTRY}(id),
            -- target foreign key
            -- FOREIGN KEY (tTokenId) REFERENCES ${tableList.JWT_TOKEN}(id),
            -- FOREIGN KEY (tAccountId) REFERENCES ${tableList.ACCOUNTS}(id),
            -- FOREIGN KEY (tGroupId) REFERENCES ${tableList.GROUP_LIST}(id)

            -- ref foreign key 
            FOREIGN KEY permission_ibfk_1(rEntryId) REFERENCES ${tableList.PERMISSION_ENTRY}(id)
                ON DELETE CASCADE 
                ON UPDATE CASCADE,
            
            -- target foreign key
            FOREIGN KEY permission_ibfk_2(tTokenId) REFERENCES ${tableList.JWT_TOKEN}(id)
                ON DELETE CASCADE 
                ON UPDATE CASCADE,
            FOREIGN KEY permission_ibfk_3(tAccountId) REFERENCES ${tableList.ACCOUNTS}(id)
                ON DELETE CASCADE 
                ON UPDATE CASCADE,
            FOREIGN KEY permission_ibfk_4(tGroupId) REFERENCES ${tableList.GROUP_LIST}(id)
                ON DELETE CASCADE 
                ON UPDATE CASCADE
        )`));
    },
}
