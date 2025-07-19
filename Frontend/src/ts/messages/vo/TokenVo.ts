import { BaseVo } from './BaseVo.js';

export interface ITokenVo {
    id: number;
    nickname: string;
}

export class TokenVo extends BaseVo<ITokenVo> {
    public get id(): number {
        return this._vo.id;
    }

    public get nickname(): string {
        return this._vo.nickname;
    }
}
