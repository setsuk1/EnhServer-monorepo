export enum InputInfoFlowEventList {
    USER_REGISTER_SUCCESS = 'user_register_success'
}

export interface IInputInfoFlowEventParamsList {
    [InputInfoFlowEventList.USER_REGISTER_SUCCESS]: [number];
}
