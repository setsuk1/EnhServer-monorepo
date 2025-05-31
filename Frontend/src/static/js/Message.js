export const MessageType = /** @type {const} */ ({
    // SUCCESS
    SUCCESS: 1,

    REGISTER_PASSKEY_OPTIONS: 101,

    // ERROR
    UNEXPECTED_ERROR: 5001,
    GENERIC_ERROR: 5002,
    SPECIFIC_ERROR: 5003,

    INVALID_DATA: 5101,
    INVALID_STATE: 5102,

    HAS_LOGGED_IN: 5201,
    HAS_NOT_LOGGED_IN: 5202,

    ACCOUNT_OR_PASSWORD_ERROR: 5301,
    ACCOUNT_ALREADY_EXISTS: 5302,

    NO_PASSKEY_CRED: 5401,
    PASSKEY_REGISTERATION_VERIFY_FAILED: 5402,

    // FRONTEND SPECTIFIED
    NETWORK_ERROR: 10001,
    INVALID_MESSAGE: 10002,
    PASSKEY_LOGIN_START_AUTH_FAILED: 10003,
    PASSKEY_AUTHENTICATOR_ALREADY_REGISTERED: 10004
});

export class Message {
    static TYPE = MessageType;

    /**
     * 
     * @param {[number, any]} array 
     */
    static fromArray(array) {
        if (Array.isArray(array) && array.length <= 2) {
            return new Message(...array);
        }
        return new Message(MessageType.INVALID_MESSAGE, array);
    }

    /**
     * 
     * @param {number} type 
     * @param {any} [data] 
     */
    constructor(type, data) {
        this.type = isNaN(type) && MessageType.INVALID_MESSAGE || type;
        if (data != undefined) {
            this.data = data;
        }
    };

    toArray() {
        const data = this.data;
        if (data == undefined) {
            return [this.type];
        }
        return [this.type, data];
    }

    isValid() {
        return !isNaN(this.type ?? NaN) && !this.checkType(MessageType.INVALID_MESSAGE);
    }

    /**
     * 
     * @param {number[]} type 
     */
    checkType(...type) {
        return type.includes(this.type);
    }
}