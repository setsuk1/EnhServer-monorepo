import { JsonUtil } from '../../JsonUtil.js';
import { ISessionStorageValueList, SessionStorageKeyList } from './SessionStorageKeyList.js';
import { SessionStorageParserList } from './SessionStorageParserList.js';

export class SessionStorageUtil {
    protected static readonly parserMap = new Map<SessionStorageKeyList, (value: ISessionStorageValueList[SessionStorageKeyList]) => ISessionStorageValueList[SessionStorageKeyList]>();

    public static registerParser<K extends string = SessionStorageKeyList, V extends Record<string, any> = ISessionStorageValueList>(key: K, parser: (value: V[K]) => V[K]) {
        this.parserMap.set(key as SessionStorageKeyList, parser);
    }

    public static parse<K extends string = SessionStorageKeyList, V extends Record<string, any> = ISessionStorageValueList>(key: K, value: V[K]): V[K] {
        const parser = this.parserMap.get(key as SessionStorageKeyList);
        if (typeof parser === 'function') {
            return parser(value) as V[K];
        }
        return value;
    }

    public static setItem<K extends string = SessionStorageKeyList, V extends Record<string, any> = ISessionStorageValueList>(key: K, value: V[K]): void {
        const oldValue = this.getItem<K, V>(key);
        sessionStorage.setItem(key, JsonUtil.stringify(this.parse<K, V>(key, value)));
    }

    public static getItem<K extends string = SessionStorageKeyList, V extends Record<string, any> = ISessionStorageValueList>(key: K): V[K] | null {
        return this.parse<K, V>(key, JsonUtil.parse(sessionStorage.getItem(key)))
    }
}

SessionStorageUtil.registerParser(SessionStorageKeyList.CURRENT_USER_INDEX, SessionStorageParserList[SessionStorageKeyList.CURRENT_USER_INDEX]);
