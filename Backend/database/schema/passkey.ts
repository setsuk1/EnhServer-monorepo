import { PoolConnection } from "mariadb";
import { clearSqlStatements } from "../../routes/helper/common.js";
import { tableList } from "../tableList.js";

export const passkey = {
    CREATE(conn: PoolConnection) {
        return conn.query(clearSqlStatements(`
            CREATE TABLE IF NOT EXISTS ${tableList.PASSKEY} (
                cred_id             VARCHAR(255) PRIMARY KEY,      -- Base64Url string representation
                cred_public_key     BLOB,                          -- Public key for authentication
                internal_user_id    INT REFERENCES ${tableList.ACCOUNTS}(id),   -- Your own user ID integer  
                counter             INT DEFAULT 0,                 -- Use INTEGER if large numbers needed
                transports          VARCHAR(255),                  -- e.g., "usb,nfc"
                created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_used           TIMESTAMP NULL                  -- Nullable if not used yet
            )
        `));
    },
    ADD_NICKNAME(conn: PoolConnection) {
        return conn.query(`ALTER TABLE ${tableList.PASSKEY} ADD COLUMN nickname NVARCHAR(64) NOT NULL DEFAULT "預設Passkey"`)
    },
    async MODIFY_FOREIGN_KEY_FOR_USER_ID(conn: PoolConnection) {
        await conn.query(`ALTER TABLE ${tableList.PASSKEY} DROP FOREIGN KEY passkey_ibfk_1`)
        await conn.query(clearSqlStatements(
            `ALTER TABLE ${tableList.PASSKEY} ADD CONSTRAINT passkey_ibfk_1 
            FOREIGN KEY (internal_user_id) REFERENCES ${tableList.ACCOUNTS}(id) 
            ON DELETE CASCADE 
            ON UPDATE CASCADE`
        ))
    },
    ADD_COLUMN_ID_AND_CHANGE_PRIMARY_KEY(conn: PoolConnection) {
        return conn.query(clearSqlStatements(
            `ALTER TABLE ${tableList.PASSKEY}
            DROP PRIMARY KEY,
            ADD COLUMN id INT AUTO_INCREMENT PRIMARY KEY,
            ADD UNIQUE KEY (cred_id)`
        ));
    }
}
