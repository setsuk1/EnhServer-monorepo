export abstract class BaseVo<V = any> {
    protected _vo: V;

    constructor(vo: V) {
        this._vo = vo || {} as V;
    }

    get valueObject(): V {
        return this._vo;
    }
    set valueObject(vo: V) {
        this._vo = vo || {} as V;
        this.onVoReset();
    }

    protected onVoReset(): void {

    }
}
