export enum VariableTableInfoTableEventList {
    DELETE_VARIABLE_TABLE_INFO = 'delete_variable_table_info'
}

export interface IVariableTableInfoTableEventParamsList {
    [VariableTableInfoTableEventList.DELETE_VARIABLE_TABLE_INFO]: [number];
}
