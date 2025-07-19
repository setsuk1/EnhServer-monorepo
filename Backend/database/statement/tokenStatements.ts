import { PoolConnection, UpsertResult } from 'mariadb';
import { IReturningIdResult } from '../../interfaces/Database/IReturningIdResult.js';
import { ITokenIdByString } from '../../interfaces/Database/token/ITokenIdByString.js';
import { ITokenInfo } from '../../interfaces/Database/token/ITokenInfo.js';
import { clearSqlStatements } from '../../routes/helper/common.js';
import { tableList } from '../tableList.js';

export const tokenStatements = {
    CREATE_TOKEN: {
        sql: clearSqlStatements(`INSERT IGNORE INTO ${tableList.JWT_TOKEN} (acc_id, tokenString) VALUES (?, ?) RETURNING id`),
        exec(conn: PoolConnection, userId: number, tokenString: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [userId, tokenString]);
        }
    },

    QUERY_TOKEN_BY_STRING: {
        sql: clearSqlStatements(`SELECT id, acc_id FROM ${tableList.JWT_TOKEN} WHERE tokenString = ?`),
        exec(conn: PoolConnection, tokenString: string) {
            return conn.query<ITokenIdByString[]>(this.sql, [tokenString]);
        }
    },

    QUERY_TOKEN_ID_BY_ID_USER_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.JWT_TOKEN} WHERE id = ? AND acc_id = ?`),
        async exec(conn: PoolConnection, tokenId: number, userId: number) {
            return conn.query<IReturningIdResult[]>(this.sql, [tokenId, userId]);
        }
    },

    QUERY_TOKEN_INFO_BY_USER_ID: {
        sql: clearSqlStatements(`SELECT id, nickname FROM ${tableList.JWT_TOKEN} WHERE acc_id = ?`),
        exec(conn: PoolConnection, userId: number) {
            return conn.query<ITokenInfo[]>(this.sql, [userId]);
        }
    },
    QUERY_TOKEN_INFO_BY_ID: {
        sql: clearSqlStatements(`SELECT id, nickname FROM ${tableList.JWT_TOKEN} WHERE id = ?`),
        exec(conn: PoolConnection, tokenId: number) {
            return conn.query<ITokenInfo[]>(this.sql, [tokenId]);
        }
    },

    UPDATE_TOKEN_NICKNAME_BY_ID: {
        sql: clearSqlStatements(`UPDATE ${tableList.JWT_TOKEN} SET nickname = ? WHERE id = ?`),
        exec(conn: PoolConnection, tokenId: number, nickname: string) {
            return conn.query<UpsertResult>(this.sql, [nickname, tokenId]);
        }
    },

    DELETE_TOKEN_BY_ID: {
        sql: clearSqlStatements(`DELETE FROM ${tableList.JWT_TOKEN} WHERE id = ?`),
        exec(conn: PoolConnection, tokenId: number) {
            return conn.query<UpsertResult>(this.sql, [tokenId]);
        }
    }
};
