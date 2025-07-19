export enum PasswordFlowEventList {
    CANCEL_PASSWORD_LOGIN = 'cancel_password_login',
    HAS_LOGGED_IN = 'has_logged_in',
    PASSWORD_LOGIN_SUCCESS = 'password_login_success'
}

export interface IPasswordFlowEventParamsList {
    [PasswordFlowEventList.CANCEL_PASSWORD_LOGIN]: [];
    [PasswordFlowEventList.HAS_LOGGED_IN]: [];
    [PasswordFlowEventList.PASSWORD_LOGIN_SUCCESS]: [];
}
