import { Emitter } from './Emitter.js';

/**
 * @typedef {{
 *     [SystemEvent.REDIRECT]: [URLSearchParams]
 * }} ISystemEmitterArgs
 * 
 * @typedef {{
 *     emit<T extends keyof ISystemEmitterArgs | any[]>(event: T extends keyof ISystemEmitterArgs ? T : string, ...args: [...(T extends keyof ISystemEmitterArgs ? ISystemEmitterArgs[T] : T), ...any[]]): boolean;
 *     on<T extends keyof ISystemEmitterArgs | any[]>(event: T extends keyof ISystemEmitterArgs ? T : string, fn: (...args: [...(T extends keyof ISystemEmitterArgs ? ISystemEmitterArgs[T] : T), ...any[]]) => void, context?: any): this;
 *     once<T extends keyof ISystemEmitterArgs | any[]>(event: T extends keyof ISystemEmitterArgs ? T : string, fn: (...args: [...(T extends keyof ISystemEmitterArgs ? ISystemEmitterArgs[T] : T), ...any[]]) => void, context?: any): this;
 *     addListener<T extends keyof ISystemEmitterArgs | any[]>(event: T extends keyof ISystemEmitterArgs ? T : string, fn: (...args: [...(T extends keyof ISystemEmitterArgs ? ISystemEmitterArgs[T] : T), ...any[]]) => void, context?: any, times?: number): this;
 * }} ISystemEmitter
 */

const SystemEvent = /** @type {const} */ ({
    REDIRECT: 'redirect'
});

/**
 * @implements {ISystemEmitter}
 */
export class System extends Emitter {
    static EVENT = SystemEvent;

    /**
     * @type {ISystemEmitter['emit']}
     */
    emit() { }
    /**
     * @type {ISystemEmitter['on']}
     */
    on() { }
    /**
     * @type {ISystemEmitter['once']}
     */
    once() { }
    /**
     * @type {ISystemEmitter['addListener']}
     */
    addListener() { }
}

System.prototype.emit = Emitter.prototype.emit;
System.prototype.on = Emitter.prototype.on;
System.prototype.once = Emitter.prototype.once;
System.prototype.addListener = Emitter.prototype.addListener;

export const system = new System();