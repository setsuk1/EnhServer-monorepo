import { PoolConnection, UpsertResult } from 'mariadb';
import { IPermissionFullResult } from '../../interfaces/Permission/manager/IFullPermission.js';
import { IPermissionQueryResult } from '../../interfaces/Permission/manager/IPermissionQueryResult.js';
import { IPermissionResult } from '../../interfaces/Permission/manager/IPermissionResult.js';
import { clearSqlStatements } from '../../routes/helper/common.js';
import { tableList } from '../tableList.js';

export const permissionStatements = {
    ADD_PERMISSION: {
        sql: clearSqlStatements(`
            INSERT INTO ${tableList.PERMISSION} (
                rEntryId, tDomain, tTokenId, tAccountId, tGroupId, pRead, pWrite, pUpdate, pDelete 
            ) VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `),
        exec(
            conn: PoolConnection,
            rEntryId: number,
            tDomain: string = null, tTokenId: number = null, tAccountId: number = null, tGroupId: number = null,
            pRead: boolean, pWrite: boolean, pUpdate: boolean, pDelete: boolean
        ) {
            return conn.query<UpsertResult>(
                this.sql,
                [rEntryId, tDomain, tTokenId, tAccountId, tGroupId, pRead, pWrite, pUpdate, pDelete]
            );
        }
    },
    GET_PERMISSION: {
        sql: clearSqlStatements(`
                SELECT 
                    MAX(pRead) as pRead, MAX(pWrite) as pWrite,
                    MAX(pUpdate) as pUpdate, MAX(pWrite) as pDelete
                FROM ${tableList.PERMISSION} WHERE 
                    rEntryId = ?
                    AND (tDomain = ? OR tDomain IS NULL)
                    AND (tTokenId = ? OR tTokenId IS NULL)
                    AND (tAccountId = ? OR tAccountId IS NULL)
            `),
        exec(conn: PoolConnection, rEntryId: number, tDomain: string, tTokenId: number, tAccountId: number, tGroupId: number) {
            return conn.query<IPermissionResult[]>(
                this.sql,
                [rEntryId, tDomain, tTokenId, tAccountId, tGroupId]
            );
        }
    },
    GET_ENTRY_ID_BY_VAR_TABLE_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.PERMISSION_ENTRY} WHERE (tVarTableId = ? OR tVarTableId IS NULL)`),
        async exec(conn: PoolConnection, tVarTableId?: number) {
            const result = await conn.query(this.sql, [tVarTableId]);
            if (result.length !== 1)
                return undefined;
            return result[0].id as number;
        }
    },

    GET_PERMISSION_BY_ID: {
        sql: clearSqlStatements(`
            SELECT 
                tAccountId, tDomain, tGroupId, tTokenId,
                pRead, pWrite, pUpdate, pDelete 
            FROM ${tableList.PERMISSION} WHERE id = ?
        `),
        async exec(conn: PoolConnection, id: number) {
            const result = await conn.query<IPermissionQueryResult[]>(
                this.sql,
                [id]
            );
            if (result.length !== 1)
                return undefined;
            return result[0];
        }
    },
    GET_ENTRY_ID_BY_PERMISSION_ID: {
        sql: clearSqlStatements(`SELECT rEntryId FROM ${tableList.PERMISSION} WHERE id = ?`),
        async exec(conn: PoolConnection, permId: number) {
            const result = await conn.query<{ rEntryId: number }[]>(
                this.sql,
                [permId]
            )
            if (result.length !== 1)
                return undefined;
            return result[0];
        }
    },
    GET_PERMISSIONS_BY_ENTRY_ID: {
        sql: clearSqlStatements(`SELECT * from ${tableList.PERMISSION} WHERE rEntryId = ?`),
        async exec(conn: PoolConnection, rEntryId: number) {
            const result = await conn.query<IPermissionFullResult[]>(
                this.sql,
                [rEntryId]
            );
            return result;
        }
    },
    UPSERT_PERMISSION_BY_ID: {
        sql: clearSqlStatements(`
            INSERT INTO ${tableList.PERMISSION} (
                id,
                tDomain, tTokenId, tAccountId, tGroupId, 
                pRead, pWrite, pUpdate, pDelete
            ) VALUES (
                ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )
            ON CONFLICT(id) DO UPDATE
            SET tAccountId = VALUES(tAccountId),
                tDomain = VALUES(tDomain),
                tGroupId = VALUES(tGroupId),
                tTokenId = VALUES(tTokenId),
                pDelete = VALUES(pDelete),
                pRead = VALUES(pRead),
                pUpdate = VALUES(pUpdate),
                pWrite = VALUES(pWrite)
        `),
        async exec(conn: PoolConnection,
            id: number,
            tDomain: string = null, tTokenId: number = null, tAccountId: number = null, tGroupId: number = null,
            pRead: boolean, pWrite: boolean, pUpdate: boolean, pDelete: boolean) {
            return conn.query<UpsertResult>(
                this.sql,
                [
                    id,
                    tDomain, tTokenId, tAccountId, tGroupId,
                    pRead, pWrite, pUpdate, pDelete
                ]
            )
        }
    },
    GET_ENTRY_CONTENT_BY_ID: {
        sql: clearSqlStatements(`SELECT tVarTableId FROM ${tableList.PERMISSION_ENTRY} WHERE id = ?`),
        async exec(conn: PoolConnection, id: number) {
            const result = await conn.query<{ tVarTableId: number }[]>(
                this.sql,
                [id]
            )
            if (result.length !== 1)
                return undefined;
            return result[0];
        }
    }
};
