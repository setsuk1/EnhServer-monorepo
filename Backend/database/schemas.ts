import { PoolConnection } from "mariadb";
import { ISchemaUpdater } from "../interfaces/ISchemaUpdater.js";
import { Logger } from "../modules/Console/Logger.js";
import { accountOptions } from "./schema/accountOptions.js";
import { accounts } from "./schema/accounts.js";
import { groupContent } from "./schema/groupContent.js";
import { groupList } from "./schema/groupList.js";
import { jwtToken } from "./schema/jwtToken.js";
import { passkey } from "./schema/passkey.js";
import { permission } from "./schema/permission.js";
import { permissionEntry } from "./schema/permissionEntry.js";
import { schema } from "./schema/schema.js";
import { varTableData } from "./schema/varTableData.js";
import { varTableList } from "./schema/varTableList.js";

export const schemas: ISchemaUpdater[] = [
    {
        version: '2025-05-10',
        async func(conn: PoolConnection, logger: Logger) {
            logger.println("Create schema table");
            return schema.CREATE(conn);
        }
    },
    {
        version: "2025-05-11",
        async func(conn: PoolConnection, logger: Logger) {
            logger.println("Create account table");
            await accounts.CREATE(conn);

            logger.println("Create passkey table");
            await passkey.CREATE(conn);

            logger.println("Create account options table");
            await accountOptions.CREATE(conn);

            logger.println("Create Variable Table List table");
            await varTableList.CREATE(conn);

            logger.println("Create Variable Table Data table");
            await varTableData.CREATE(conn);

            logger.println("Create JSON Web Token (RFC 7519) table");
            await jwtToken.CREATE(conn);
        }
    },
    {
        version: "2025-06-09",
        async func(conn: PoolConnection, logger: Logger) {
            logger.println("Drop account options table");
            await accountOptions.DROP(conn);
            
            logger.println("Remove UNIQUE for name of variable table");
            await varTableList.REMOVE_UNIQUE_NAME(conn);
            
            logger.println('Add column "created_at" to variable table');
            await varTableList.ADD_COLUMN_CREATED_AT(conn);

            logger.println("Add UNIQUE for keys in variable table");
            await varTableData.ADD_UNIQUE_FOR_ID_AND_KEY(conn);

            logger.println("Add nickname for passkey table");
            await passkey.ADD_NICKNAME(conn);
            
            logger.println('Add column "id" and change primary key from "cred_id" to "id"');
            await passkey.ADD_COLUMN_ID_AND_CHANGE_PRIMARY_KEY(conn);
            
            logger.println("Add nickname for token table");
            await jwtToken.ADD_NICKNAME(conn);

            logger.println('Add column "nickname" and "allowPassword" to account table');
            await accounts.ADD_COLUMN_NICKNAME_AND_ALLOW_PASSWORD(conn);

            logger.println('Modify column "account" and "password" to NVARCHAR(64) in accounts table');
            await accounts.MODIFY_COLUMN_ACCOUNT_AND_PASSWORD(conn);

            logger.println('Change column name "name" to "nickname" for variable table list');
            await varTableList.CHANGE_COLUMN_NAME(conn);

            logger.println("Change foreign key to add cascade on delete and update");
            await passkey.MODIFY_FOREIGN_KEY_FOR_USER_ID(conn);
            await varTableList.MODIFY_FOREIGN_KEY_FOR_BELONG_ACC(conn);
            await varTableData.MODIFY_FOREIGN_KEY_FOR_TABLE_ID(conn);
            await jwtToken.MODIFY_FOREIGN_KEY_FOR_ACCOUNT_ID(conn);

            
            logger.println("Create new tables......");
            logger.println("Create group list table");
            await groupList.CREATE(conn);

            logger.println("Create group content table");
            await groupContent.CREATE(conn);

            logger.println("Create permission entry table");
            await permissionEntry.CREATE(conn);

            logger.println("Create permission table");
            await permission.CREATE(conn);
        },
    }
]
