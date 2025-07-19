import { BaseVo } from './BaseVo.js';

export interface IVariableTableInfoVo {
    id: number;
    nickname: string;
    isOwner: boolean;
    createdAt: string;
}

export class VariableTableInfoVo extends BaseVo<IVariableTableInfoVo> {
    protected _createdAt: Date;

    public get id(): number {
        return this._vo.id;
    }

    public get nickname(): string {
        return this._vo.nickname;
    }

    public get isOwner(): boolean {
        return this._vo.isOwner;
    }

    public get createdAt(): Date {
        if (!this._createdAt) {
            this._createdAt = new Date(this._vo.createdAt);
        }
        return this._createdAt;
    }

    protected onVoReset(): void {
        this._createdAt = undefined;
    }
}
