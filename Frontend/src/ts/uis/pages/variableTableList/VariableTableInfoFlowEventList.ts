export enum VariableTableInfoFlowEventList {
    UPDATE_ALL_VARIABLE_TABLE_INFO = 'update_all_variable_table_info',
    DELETE_VARIABLE_TABLE_INFO = 'delete_variable_table_info'
}

export interface IVariableTableInfoFlowEventParamsList {
    [VariableTableInfoFlowEventList.UPDATE_ALL_VARIABLE_TABLE_INFO]: [];
    [VariableTableInfoFlowEventList.DELETE_VARIABLE_TABLE_INFO]: [number];
}
