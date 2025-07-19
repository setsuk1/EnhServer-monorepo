import { BaseVo } from './BaseVo.js';

export interface IPasskeyVo {
    id: number;
    cred_id: string;
    nickname: string;
}

export class PasskeyVo extends BaseVo<IPasskeyVo> {
    public get id(): number {
        return this._vo.id;
    }

    public get cred_id(): string {
        return this._vo.cred_id;
    }

    public get nickname(): string {
        return this._vo.nickname;
    }
}
