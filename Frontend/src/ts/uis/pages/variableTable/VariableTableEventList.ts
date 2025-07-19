export enum VariableTableEventList {
    PERMISSION_DENIED = 'permission_denied'
}

export interface IVariableTableEventParamsList {
    [VariableTableEventList.PERMISSION_DENIED]: []
}
