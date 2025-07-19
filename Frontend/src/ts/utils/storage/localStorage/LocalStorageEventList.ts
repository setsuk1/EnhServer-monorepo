export enum LocalStorageEventList {
    CHANGE = 'change',
    THEME_CHANGED = 'theme_changed',
    THEME_TRANSITION_METHOD_CHANGED = 'theme_transition_method_changed'
}

export interface ILocalStorageEventParamsList {
    [LocalStorageEventList.CHANGE]: [string, string, string];
    [LocalStorageEventList.THEME_CHANGED]: [string, string];
    [LocalStorageEventList.THEME_TRANSITION_METHOD_CHANGED]: [0 | 1, 0 | 1];
}
