import { ISessionAccount } from '../../Session/ISessionAccount.js';

export interface IUserLocals {
    userIndex: number;
    user: ISessionAccount;
    userId: number;
}
