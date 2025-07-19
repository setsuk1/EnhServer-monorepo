export enum SidebarComponentEventList {
    SIDEBAR_COLLAPSED = 'sidebar_collapsed',
    MENU_ITEM_CLICK = 'menu_item_click'
}

export interface ISidebarComponentEventParamsList {
    [SidebarComponentEventList.SIDEBAR_COLLAPSED]: [];
    [SidebarComponentEventList.MENU_ITEM_CLICK]: [string];
}
