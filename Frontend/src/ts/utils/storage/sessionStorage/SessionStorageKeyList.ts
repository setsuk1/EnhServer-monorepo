export enum SessionStorageKeyList {
    CURRENT_USER_INDEX = 'current_user_index'
}

export interface ISessionStorageValueList {
    [SessionStorageKeyList.CURRENT_USER_INDEX]: number;
}
