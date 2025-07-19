import { TypeUtil } from '../../TypeUtil.js';
import { ILocalStorageValueList, LocalStorageKeyList } from './LocalStorageKeyList.js';

export class LocalStorageParserList {
    public static readonly [LocalStorageKeyList.THEME] = function (value: ILocalStorageValueList[LocalStorageKeyList.THEME]): ILocalStorageValueList[LocalStorageKeyList.THEME] {
        switch (value) {
            case 'light':
            case 'dark':
                break;
            default:
                value = 'dark';
                break;
        }
        return value;
    }

    public static readonly [LocalStorageKeyList.THEME_TRANSITION_METHOD] = function (value: ILocalStorageValueList[LocalStorageKeyList.THEME_TRANSITION_METHOD]): ILocalStorageValueList[LocalStorageKeyList.THEME_TRANSITION_METHOD] {
        switch (value) {
            case 0:
            case 1:
                return value;
            default:
                return 1;
        }
    }

    public static readonly [LocalStorageKeyList.LAST_USER_INDEX] = function (value: ILocalStorageValueList[LocalStorageKeyList.LAST_USER_INDEX]): ILocalStorageValueList[LocalStorageKeyList.LAST_USER_INDEX] {
        return TypeUtil.isUint(value) ? value : -1;
    }
}
