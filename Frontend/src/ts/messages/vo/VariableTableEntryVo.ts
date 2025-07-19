import { BaseVo } from './BaseVo.js';

export interface IVariableTableEntryVo {
    id: number;
    key: string;
    value: { type: 'Buffer', data: number[] };
}

export class VariableTableEntryVo extends BaseVo<IVariableTableEntryVo> {
    protected _value: Uint8Array<ArrayBuffer>;

    public get id(): number {
        return this._vo.id;
    }

    public get key(): string {
        return this._vo.key;
    }

    public get value(): Uint8Array {
        if (!this._value) {
            this._value = new Uint8Array(this._vo.value.data);
        }
        return this._value;
    }

    protected onVoReset(): void {
        this._value = undefined;
    }
}
