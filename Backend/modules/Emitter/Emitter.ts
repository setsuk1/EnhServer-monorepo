import { EmitterEntry } from "./EmitterEntry.js";

export class Emitter {
    protected _handlers: {
        [key: string | symbol]: EmitterEntry[];
    };

    constructor() {
        this._init();
    }

    protected _init() {
        this._handlers = Object.create(null);
    }

    public eventNames(): (string | symbol)[] {
        const handlers = this._handlers;
        return Object.getOwnPropertyNames(handlers).concat(Object.getOwnPropertySymbols(handlers) as any);
    }

    public listenerCount(event: string | symbol): number {
        const listeners = this._handlers[event];
        if (Array.isArray(listeners) === false) {
            return 0;
        }
        return listeners.length;
    }

    public listeners(event: string | symbol): Function[] {
        const listeners = this._handlers[event];
        if (Array.isArray(listeners) === false) {
            return [];
        }
        return listeners.map(listener => listener.func);
    }

    protected _addListener(event: string | symbol, entry: EmitterEntry): boolean {
        const handlers = this._handlers;
        const listeners = handlers[event];
        if (Array.isArray(listeners) === false) {
            handlers[event] = [entry];
        } else {
            listeners.push(entry);
        }
        return true;
    }

    public addListener(event: string | symbol, func: Function, context?: any, times: number = Number.POSITIVE_INFINITY): boolean {
        if (typeof func !== 'function') {
            console.error('The listener must be a function');
            return false;
        }

        times = Math.floor(times);
        if (times > 0 === false) {
            console.error('The number of emits must be greater than 0');
            return false;
        }

        const entry = new EmitterEntry(func, context, times);
        return this._addListener(event, entry);
    }

    public on(event: string | symbol, func: Function, context?: any) {
        return this.addListener(event, func, context, Number.POSITIVE_INFINITY);
    }

    public once(event: string | symbol, func: Function, context?: any) {
        return this.addListener(event, func, context, 1);
    }

    public removeListener(event?: string | symbol, func?: Function, context?: any, times?: number): boolean {
        const len = arguments.length;
        if (len === 0) {
            this._init();
            return true;
        }

        const handlers = this._handlers;
        let listeners = handlers[event];
        if (Array.isArray(listeners) === false) {
            return false;
        }

        switch (len) {
            case 1:
                return delete handlers[event];
            case 2:
                listeners = listeners.filter(value => value.checkFunc(func));
                break;
            case 3:
                listeners = listeners.filter(value => value.checkFuncAndContext(func, context));
                break;
            default:
                listeners = listeners.filter(value => value.checkAll(func, context, times));
                break;
        }

        if (listeners.length) {
            handlers[event] = listeners;
            return true;
        }

        return delete handlers[event];
    }

    public removeAllListeners(event?: string | symbol): boolean {
        if (arguments.length) {
            return this.removeListener(event);
        }
        return this.removeListener();
    }

    public off(event: string | symbol, func?: Function, context?: any, once?: boolean): boolean {
        if (arguments.length > 3) {
            return this.removeListener(event, func, context, once && 1 || Number.POSITIVE_INFINITY);
        }
        return this.removeListener.apply(this, arguments as any);
    }

    protected _eventProcessor(this: any[], value: EmitterEntry): boolean {
        return value.callAndCheckTimes(this);
    }

    public emit(event: string | symbol, ...args: any[]): void {
        const handlers = this._handlers
        const listeners = handlers[event];
        if (Array.isArray(listeners) === false) {
            return;
        }
        handlers[event] = listeners.filter(this._eventProcessor, args);
    }
}