export enum PasskeyFlowEventList {
    USE_PASSWORD_LOGIN = 'use_password_login',
    HAS_LOGGED_IN = 'has_logged_in',
    TRY_PASSKEY_LOGIN = 'try_passkey_login',
    PASSKEY_LOGIN_SUCCESS = 'passkey_login_success'
}

export interface IPasskeyFlowEventParamsList {
    [PasskeyFlowEventList.USE_PASSWORD_LOGIN]: [];
    [PasskeyFlowEventList.HAS_LOGGED_IN]: [];
    [PasskeyFlowEventList.TRY_PASSKEY_LOGIN]: [];
    [PasskeyFlowEventList.PASSKEY_LOGIN_SUCCESS]: [number];
}
