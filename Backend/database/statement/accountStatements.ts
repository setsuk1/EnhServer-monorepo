import { PoolConnection, UpsertResult } from 'mariadb';
import { IQueryTotalResult } from '../../interfaces/Database/IQueryTotalResult.js';
import { IReturningIdResult } from '../../interfaces/Database/IReturningIdResult.js';
import { IPasskeyCred } from '../../interfaces/Database/passkey/IPasskeyCred.js';
import { IPasskeyInfo } from '../../interfaces/Database/passkey/IPasskeyInfo.js';
import { IQueryUserResult } from '../../interfaces/Database/user/IQueryUserResult.js';
import { clearSqlStatements } from '../../routes/helper/common.js';
import { tableList } from '../tableList.js';

export const accountStatements = {
    CREATE_USER: {
        sql: clearSqlStatements(`INSERT IGNORE INTO ${tableList.ACCOUNTS} (account, password) VALUES (?, ?) RETURNING id`),
        exec(conn: PoolConnection, account: string, password: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [account, password]);
        }
    },

    QUERY_USER_BY_IDS: {
        sql: clearSqlStatements(`SELECT id, nickname, allowPassword FROM ${tableList.ACCOUNTS} WHERE id IN ($ids)`),
        exec(conn: PoolConnection, userIds: number[]) {
            if (!userIds?.length) {
                return [];
            }
            const sql = this.sql.replace('$ids', Array(userIds.length).fill('?').join(','));
            return conn.query<IQueryUserResult[]>(sql, userIds);
        }
    },

    QUERY_USER_BY_ID: {
        sql: clearSqlStatements(`SELECT id, nickname, allowPassword FROM ${tableList.ACCOUNTS} WHERE id = ?`),
        exec(conn: PoolConnection, userId: number) {
            return conn.query<IQueryUserResult[]>(this.sql, [userId]);
        }
    },
    QUERY_USER_BY_ACCOUNT: {
        sql: clearSqlStatements(`SELECT id, nickname, allowPassword FROM ${tableList.ACCOUNTS} WHERE account = ?`),
        exec(conn: PoolConnection, account: string) {
            return conn.query<IQueryUserResult[]>(this.sql, [account]);
        }
    },
    QUERY_USER_BY_ACCOUNT_PASSWORD: {
        sql: clearSqlStatements(`SELECT id, nickname, allowPassword FROM ${tableList.ACCOUNTS} WHERE account = ? AND password = ?`),
        exec(conn: PoolConnection, account: string, password: string) {
            return conn.query<IQueryUserResult[]>(this.sql, [account, password]);
        }
    },

    UPDATE_NICKNAME: {
        sql: clearSqlStatements(`UPDATE ${tableList.ACCOUNTS} SET nickname = ? WHERE id = ?`),
        exec(conn: PoolConnection, userId: number, nickname: string) {
            return conn.query<UpsertResult>(this.sql, [nickname, userId]);
        }
    },
    UPDATE_PASSWORD: {
        sql: clearSqlStatements(`UPDATE ${tableList.ACCOUNTS} SET password = ? WHERE id = ? AND allowPassword = TRUE AND password = ?`),
        exec(conn: PoolConnection, userId: number, password: string, newPassword: string) {
            return conn.query<UpsertResult>(this.sql, [newPassword, userId, password]);
        }
    },
    UPDATE_ALLOW_PASSWORD: function () {
        const basesql = clearSqlStatements(`UPDATE ${tableList.ACCOUNTS} SET allowPassword = ?, password = ? WHERE id = ? AND password`);
        const sql = `${basesql}=?`;
        const sql2 = `${basesql} IS NULL`;
        return {
            basesql, sql, sql2,
            exec(conn: PoolConnection, userId: number, password: string, allowPassword: boolean, newPassword: string) {
                if (password === null) {
                    return conn.query<UpsertResult>(this.sql2, [allowPassword, newPassword, userId]);
                }
                return conn.query<UpsertResult>(this.sql, [allowPassword, newPassword, userId, password]);
            }
        };
    }(),



    CREATE_PASSKEY: {
        sql: clearSqlStatements(`
            INSERT IGNORE INTO ${tableList.PASSKEY} (
                cred_id, cred_public_key, counter, transports, internal_user_id
            ) VALUES (
                ?, ?, ?, ?, ?
            ) RETURNING id
        `),
        exec(conn: PoolConnection, cred_id: string, cred_public_key: Buffer, counter: number, transports: string, userId: number) {
            return conn.query<IReturningIdResult[]>(
                this.sql,
                [cred_id, cred_public_key, counter, transports, userId]
            );
        }
    },

    QUERY_PASSKEY_TOTAL: {
        sql: clearSqlStatements(`SELECT COUNT(*) AS total FROM ${tableList.PASSKEY} WHERE internal_user_id = ?`),
        exec(conn: PoolConnection, user_id: number) {
            return conn.query<IQueryTotalResult[]>(this.sql, [user_id]);
        }
    },

    QUERY_PASSKEY_ID_BY_USER_ID_CRED_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.PASSKEY} WHERE internal_user_id = ? AND cred_id = ?`),
        exec(conn: PoolConnection, user_id: number, cred_id: string) {
            return conn.query<IReturningIdResult[]>(this.sql, [user_id, cred_id]);
        }
    },
    QUERY_PASSKEY_ID_BY_ID_USER_ID: {
        sql: clearSqlStatements(`SELECT id FROM ${tableList.PASSKEY} WHERE id = ? AND internal_user_id = ?`),
        exec(conn: PoolConnection, id: number, user_id: number) {
            return conn.query<IReturningIdResult[]>(this.sql, [id, user_id]);
        }
    },

    QUERY_PASSKEY_INFO_BY_USER_ID: {
        sql: clearSqlStatements(`SELECT id, cred_id, nickname FROM ${tableList.PASSKEY} WHERE internal_user_id = ?`),
        exec(conn: PoolConnection, user_id: number) {
            return conn.query<IPasskeyInfo[]>(this.sql, [user_id]);
        }
    },
    QUERY_PASSKEY_INFO_BY_ID: {
        sql: clearSqlStatements(`SELECT id, cred_id, nickname FROM ${tableList.PASSKEY} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<IPasskeyInfo[]>(this.sql, [id]);
        }
    },

    QUERY_PASSKEY_BY_USER_ID: {
        sql: clearSqlStatements(`SELECT id, cred_id, nickname, transports FROM ${tableList.PASSKEY} WHERE internal_user_id = ?`),
        exec(conn: PoolConnection, user_id: number) {
            return conn.query<IPasskeyCred[]>(this.sql, [user_id]);
        }
    },
    QUERY_PASSKEY_BY_CRED_ID: {
        sql: clearSqlStatements(`SELECT * FROM ${tableList.PASSKEY} WHERE cred_id = ?`),
        exec(conn: PoolConnection, cred_id: string) {
            return conn.query<IPasskeyCred[]>(this.sql, [cred_id]);
        }
    },

    UPDATE_PASSKEY_COUNTER_BY_ID: {
        sql: clearSqlStatements(`UPDATE ${tableList.PASSKEY} SET counter = ? WHERE id = ?`),
        exec(conn: PoolConnection, id: number, counter: number) {
            return conn.query(this.sql, [counter, id]);
        }
    },
    UPDATE_PASSKEY_NICKNAME_BY_ID: {
        sql: clearSqlStatements(`UPDATE ${tableList.PASSKEY} SET nickname = ? WHERE id = ?`),
        exec(conn: PoolConnection, id: number, nickname: string) {
            return conn.query<UpsertResult>(
                this.sql, [nickname, id]
            );
        }
    },

    DELETE_PASSKEY_BY_ID: {
        sql: clearSqlStatements(`DELETE FROM ${tableList.PASSKEY} WHERE id = ?`),
        exec(conn: PoolConnection, id: number) {
            return conn.query<UpsertResult>(this.sql, [id]);
        }
    }
};
