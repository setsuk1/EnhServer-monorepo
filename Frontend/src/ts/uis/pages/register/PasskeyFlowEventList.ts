export enum PasskeyFlowEventList {
    PASSKEY_REGISTER_SUCCESS = 'passkey_register_success',
    SKIP_REGISTER_PASSKEY = 'skip_register_passkey'
}

export interface IPasskeyFlowEventParamsList {
    [PasskeyFlowEventList.PASSKEY_REGISTER_SUCCESS]: [number];
    [PasskeyFlowEventList.SKIP_REGISTER_PASSKEY]: [];
}
