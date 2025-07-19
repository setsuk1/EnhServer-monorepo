import { UserVo } from '../vo/UserVo.js';

export enum UserManagerEventList {
    USER_REFRESH = 'user_refresh',
    SWITCH_CURRENT_USER = 'switch_current_user'
}

export interface IUserManagerEventParamsList {
    [UserManagerEventList.USER_REFRESH]: [UserVo, number];
    [UserManagerEventList.SWITCH_CURRENT_USER]: [];
}
