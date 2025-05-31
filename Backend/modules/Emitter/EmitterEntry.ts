export class EmitterEntry {
    protected _func: Function;
    protected _times: number;
    protected _context: any;

    constructor(func: Function, context: any, times: number) {
        this._func = func;
        this._context = context;
        this._times = times;
    }

    public get func(): Function {
        return this._func;
    }

    public checkFunc(func: Function): boolean {
        return func !== this._func;
    }

    public checkFuncAndContext(func: Function, context: any): boolean {
        return func !== this._func || context !== this._context;
    }

    public checkAll(func: Function, context: any, times: number): boolean {
        return func !== this._func || context !== this._context || times < this._times;
    }

    public callAndCheckTimes(args: any[]): boolean {
        if (this._times >= 1 === false) {
            return;
        }
        this._func.apply(this._context, args);
        return --this._times >= 1;
    }
}