export enum AccountFlowEventList {
    NEXT_STEP = 'next_step'
}

export interface IAccountFlowEventParamsList {
    [AccountFlowEventList.NEXT_STEP]: [string];
}
