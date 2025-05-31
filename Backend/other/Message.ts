enum TYPE {
    // SUCCESS
    SUCCESS = 1,

    REGISTER_PASSKEY_OPTIONS = 101,

    // ERROR
    UNEXPECTED_ERROR = 5001,
    GENERIC_ERROR,
    SPECIFIC_ERROR,

    INVALID_DATA = 5101,
    INVALID_STATE,

    HAS_LOGGED_IN = 5201,
    HAS_NOT_LOGGED_IN,

    ACCOUNT_OR_PASSWORD_ERROR = 5301,
    ACCOUNT_ALREADY_EXISTS,

    NO_PASSKEY_CRED = 5401,
    PASSKEY_REGISTERATION_VERIFY_FAILED,

    // FRONTEND SPECTIFIED
    NETWORK_ERROR = 10001,
    INVALID_MESSAGE,
    PASSKEY_LOGIN_START_AUTH_FAILED,
    PASSKEY_AUTHENTICATOR_ALREADY_REGISTERED
}

export class Message {
    public static TYPE = TYPE;

    public type: TYPE;
    public data: any;

    constructor(type: TYPE, data?: any) {
        this.type = type;
        this.data = data;
    };

    public toArray() {
        const data = this.data;
        if (data == undefined) {
            return [this.type];
        }
        return [this.type, data];
    }
}