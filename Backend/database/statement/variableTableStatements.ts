import { PoolConnection, UpsertResult } from 'mariadb';
import { IReturningIdResult } from '../../interfaces/Database/IReturningIdResult.js';
import { IVariableTableInfo } from '../../interfaces/Database/varTable/IVariableTableInfo.js';
import { IVarTableValue } from '../../interfaces/Database/varTable/IVarTableValue.js';
import { IVariableTableEntryData } from '../../interfaces/route/resMsgData/IVariableTableEntryData.js';
import { clearSqlStatements } from '../../routes/helper/common.js';
import { tableList } from '../tableList.js';

export const variableTableStatements = {
    CREATE_TABLE: {
        sql: clearSqlStatements(`INSERT IGNORE INTO ${tableList.VAR_TABLE_LIST} (belong_acc, nickname) VALUES (?, ?) RETURNING id`),
        exec(conn: PoolConnection, userId: number, nickname: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [userId, nickname]);
        }
    },

    QUERY_TABLE_ID_BY_ID_USER_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.VAR_TABLE_LIST} WHERE id = ? AND belong_acc = ?`),
        exec(conn: PoolConnection, id: number, userId: number) {
            return conn.query<IReturningIdResult[]>(this.sql, [id, userId]);
        }
    },

    QUERY_TABLE_INFO: {
        sql: clearSqlStatements(`SELECT id, belong_acc, nickname, created_at FROM ${tableList.VAR_TABLE_LIST}`),
        exec(conn: PoolConnection) {
            return conn.query<IVariableTableInfo[]>(this.sql);
        }
    },

    QUERY_TABLE_INFO_BY_ID: {
        sql: clearSqlStatements(`SELECT id, belong_acc, nickname, created_at FROM ${tableList.VAR_TABLE_LIST} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<IVariableTableInfo[]>(this.sql, [id]);
        }
    },
    QUERY_TABLE_INFO_BY_USER_ID: {
        sql: clearSqlStatements(`SELECT id, belong_acc, nickname, created_at FROM ${tableList.VAR_TABLE_LIST} WHERE belong_acc = ?`),
        exec(conn: PoolConnection, userId: number) {
            return conn.query<IVariableTableInfo[]>(this.sql, [userId]);
        }
    },

    UPDATE_TABLE_NICKNAME_BY_ID: {
        sql: clearSqlStatements(`UPDATE ${tableList.VAR_TABLE_LIST} SET nickname = ? WHERE id = ?`),
        exec(conn: PoolConnection, id: number, nickname: string) {
            return conn.query<UpsertResult>(this.sql, [nickname, id]);
        }
    },

    DELETE_TABLE_BY_ID: {
        sql: clearSqlStatements(`DELETE FROM ${tableList.VAR_TABLE_LIST} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<UpsertResult>(this.sql, [id]);
        }
    },



    CREATE_ENTRY: {
        sql: clearSqlStatements(`INSERT IGNORE INTO ${tableList.VAR_TABLE_DATA} (table_id, varKey, varValue) VALUES (?, ?, ?) RETURNING id`),
        exec(conn: PoolConnection, varTblId: number, key: string, value: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [varTblId, key, value]);
        }
    },
    CREATE_OR_UPDATE_ENTRY: {
        sql: clearSqlStatements(`INSERT INTO ${tableList.VAR_TABLE_DATA} (table_id, varKey, varValue) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE varValue = VALUES(varValue) RETURNING id`),
        exec(conn: PoolConnection, varTblId: number, key: string, value: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [varTblId, key, value]);
        }
    },

    QUERY_ENTRY_ID_BY_ID_TABLE_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.VAR_TABLE_DATA} WHERE id = ? AND table_id = ?`),
        exec(conn: PoolConnection, id: number, varTblId: number) {
            return conn.query<IReturningIdResult[]>(this.sql, [id, varTblId]);
        }
    },

    QUERY_ENTRY_VALUE_BY_TABLE_ID_KEY: {
        sql: clearSqlStatements(`SELECT varValue as 'value' FROM ${tableList.VAR_TABLE_DATA} WHERE table_id = ? AND varKey = ?`),
        exec(conn: PoolConnection, varTblId: number, key: string) {
            return conn.query<IVarTableValue[]>(this.sql, [varTblId, key]);
        }
    },

    QUERY_ENTRY_BY_ID: {
        sql: clearSqlStatements(`SELECT id, varKey AS 'key', varValue AS 'value' FROM ${tableList.VAR_TABLE_DATA} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<IVariableTableEntryData[]>(this.sql, [id]);
        }
    },
    QUERY_ENTRY_BY_TABLE_ID: {
        sql: clearSqlStatements(`SELECT id, varKey AS 'key', varValue AS 'value' FROM ${tableList.VAR_TABLE_DATA} WHERE table_id = ?`),
        exec(conn: PoolConnection, varTblId: number) {
            return conn.query<IVariableTableEntryData[]>(this.sql, [varTblId]);
        }
    },

    UPDATE_ENTRY_VALUE_BY_ID: {
        sql: clearSqlStatements(`UPDATE ${tableList.VAR_TABLE_DATA} SET varValue = ? WHERE id = ?`),
        exec(conn: PoolConnection, id: number, value: any) {
            return conn.query<UpsertResult>(this.sql, [value, id]);
        }
    },

    DELETE_ENTRY_BY_TABLE_ID_KEY: {
        sql: clearSqlStatements(`DELETE FROM ${tableList.VAR_TABLE_DATA} WHERE table_id = ? AND varKey = ?`),
        exec(conn: PoolConnection, varTblId: number, key: string) {
            return conn.query<UpsertResult>(
                this.sql, [varTblId, key]
            );
        }
    },

    DELETE_ENTRY_BY_ID: {
        sql: clearSqlStatements(`DELETE FROM ${tableList.VAR_TABLE_DATA} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<UpsertResult>(this.sql, [id]);
        }
    },
};
