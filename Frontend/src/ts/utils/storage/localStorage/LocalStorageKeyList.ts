export enum LocalStorageKeyList {
    THEME = 'theme',
    THEME_TRANSITION_METHOD = 'theme_transition_method',
    LAST_USER_INDEX = 'last_user_index'
}

export interface ILocalStorageValueList {
    [LocalStorageKeyList.THEME]: 'light' | 'dark';
    [LocalStorageKeyList.THEME_TRANSITION_METHOD]: 0 | 1;
    [LocalStorageKeyList.LAST_USER_INDEX]: number;
}
