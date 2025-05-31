export class Emitter {
    /**
     * @protected
     * @type {{ [key: string | symbol]: EmitterEntry[] }} 
     */
    _handlers;

    constructor() {
        this._init();
    }

    /**
     * @protected
     * @returns {void}
     */
    _init() {
        this._handlers = Object.create(null);
    }

    /**
     * @public
     * @returns {(string | symbol)[]}
     */
    eventNames() {
        const handlers = this._handlers;
        return Object.getOwnPropertyNames(handlers).concat(Object.getOwnPropertySymbols(handlers));
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @returns {number}
     */
    listenerCount(event) {
        const listeners = this._handlers[event];
        if (Array.isArray(listeners) === false) {
            return 0;
        }
        return listeners.length;
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @returns {Function[]}
     */
    listeners(event) {
        const listeners = this._handlers[event];
        if (Array.isArray(listeners) === false) {
            return [];
        }
        return listeners.map(listener => listener.func);
    }

    /**
     * @protected
     * @param {string | symbol} event 
     * @param {EmitterEntry} entry 
     * @returns {boolean}
     */
    _addListener(event, entry) {
        const handlers = this._handlers;
        const listeners = handlers[event];
        if (Array.isArray(listeners) === false) {
            handlers[event] = [entry];
        } else {
            listeners.push(entry);
        }
        return true;
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @param {Function} func 
     * @param {any} [context] 
     * @param {number} [times] 
     * @returns {boolean}
     */
    addListener(event, func, context, times = Number.POSITIVE_INFINITY) {
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

    /**
     * @public
     * @param {string | symbol} event 
     * @param {Function} func 
     * @param {any} [context] 
     * @returns {boolean}
     */
    on(event, func, context) {
        return this.addListener(event, func, context, Number.POSITIVE_INFINITY);
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @param {Function} func 
     * @param {any} [context] 
     * @returns {boolean}
     */
    once(event, func, context) {
        return this.addListener(event, func, context, 1);
    }

    /**
     * @public
     * @param {string | symbol} [event] 
     * @param {Function} [func] 
     * @param {any} [context] 
     * @param {number} [times] 
     * @returns {boolean}
     */
    removeListener(event, func, context, times) {
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

    /**
     * @public
     * @param {string | symbol} [event] 
     * @returns {boolean}
     */
    removeAllListeners(event) {
        if (arguments.length) {
            return this.removeListener(event);
        }
        return this.removeListener();
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @param {Function} [func] 
     * @param {any} [context] 
     * @param {boolean} [once] 
     * @returns {boolean}
     */
    off(event, func, context, once) {
        if (arguments.length > 3) {
            return this.removeListener(event, func, context, once && 1 || Number.POSITIVE_INFINITY);
        }
        return this.removeListener.apply(this, arguments);
    }

    /**
     * @protected
     * @this {any[]}
     * @param {EmitterEntry} value 
     * @returns {boolean}
     */
    _eventProcessor(value) {
        return value.callAndCheckTimes(this);
    }

    /**
     * @public
     * @param {string | symbol} event 
     * @param {...any} args 
     * @returns {void}
     */
    emit(event, ...args) {
        const handlers = this._handlers
        const listeners = handlers[event];
        if (Array.isArray(listeners) === false) {
            return;
        }
        handlers[event] = listeners.filter(this._eventProcessor, args);
    }
}

export class EmitterEntry {
    /**
     * @protected
     * @type {Function}
     */
    _func;

    /**
     * @protected
     * @type {number}
     */
    _times;

    /**
     * @protected
     * @type {any}
     */
    _context;

    /**
     * 
     * @param {Function} func 
     * @param {any} context 
     * @param {number} times 
     */
    constructor(func, context, times) {
        this._func = func;
        this._context = context;
        this._times = times;
    }

    /**
     * @public
     * @type {Function}
     */
    get func() {
        return this._func;
    }

    /**
     * @public
     * @param {Function} func 
     * @returns {boolean}
     */
    checkFunc(func) {
        return func !== this._func;
    }

    /**
     * @public
     * @param {Function} func 
     * @param {any} context 
     * @returns {boolean}
     */
    checkFuncAndContext(func, context) {
        return func !== this._func || context !== this._context;
    }

    /**
     * @public
     * @param {Function} func 
     * @param {any} context 
     * @param {number} times 
     * @returns {boolean}
     */
    checkAll(func, context, times) {
        return func !== this._func || context !== this._context || times < this._times;
    }

    /**
     * @public
     * @param {any[]} args 
     * @returns {boolean}
     */
    callAndCheckTimes(args) {
        if (this._times >= 1 === false) {
            return;
        }
        this._func.apply(this._context, args);
        return --this._times >= 1;
    }
}