export enum ComponentEventList {
    RENDER = 'render',
    CREATE_DOM = 'create_dom',
    SHOW = 'show',
    HIDE = 'hide',
    REMOVE = 'remove'
}

export interface IComponentEventParamsList {
    [ComponentEventList.RENDER]: [];
    [ComponentEventList.CREATE_DOM]: [];
    [ComponentEventList.SHOW]: [];
    [ComponentEventList.HIDE]: [];
    [ComponentEventList.REMOVE]: [];
}
