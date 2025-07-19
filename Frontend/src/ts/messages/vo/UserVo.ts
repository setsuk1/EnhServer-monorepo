import { BaseVo } from './BaseVo.js';

export interface IUserVo {
    index: number;
    account: string;
    isLoggedIn: boolean;
    nickname: string;
    allowPassword: boolean;
};

export class UserVo extends BaseVo<IUserVo> {
    public get index(): number {
        return this._vo.index;
    }

    public get account(): string {
        return this._vo.account;
    }

    public get isLoggedIn(): boolean {
        return this._vo.isLoggedIn;
    }

    public get nickname(): string {
        return this._vo.nickname;
    }

    public get allowPassword(): boolean {
        return this._vo.allowPassword;
    }
}
