import { TypeUtil } from '../../TypeUtil.js';
import { ISessionStorageValueList, SessionStorageKeyList } from './SessionStorageKeyList.js';

export class SessionStorageParserList {
    public static [SessionStorageKeyList.CURRENT_USER_INDEX] = function (value: ISessionStorageValueList[SessionStorageKeyList.CURRENT_USER_INDEX]): ISessionStorageValueList[SessionStorageKeyList.CURRENT_USER_INDEX] {
        if (TypeUtil.isUint(value)) {
            return value;
        }
        return null;
    }
}
