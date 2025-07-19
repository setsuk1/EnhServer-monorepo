import { Emitter } from '../../emitter/Emitter.js';
import { JsonUtil } from '../../JsonUtil.js';
import { LocalStorageEventList } from './LocalStorageEventList.js';
import { ILocalStorageValueList, LocalStorageKeyList } from './LocalStorageKeyList.js';
import { LocalStorageParserList } from './LocalStorageParserList.js';

export class LocalStorageUtil {
    protected static readonly parserMap = new Map<LocalStorageKeyList, (value: ILocalStorageValueList[LocalStorageKeyList]) => ILocalStorageValueList[LocalStorageKeyList]>();
    public static readonly emitter = new Emitter();

    public static registerParser<K extends string = LocalStorageKeyList, V extends Record<string, any> = ILocalStorageValueList>(key: K, parser: (value: V[K]) => V[K]) {
        this.parserMap.set(key as LocalStorageKeyList, parser);
    }

    public static parse<K extends string = LocalStorageKeyList, V extends Record<string, any> = ILocalStorageValueList>(key: K, value: V[K]): V[K] {
        const parser = this.parserMap.get(key as LocalStorageKeyList);
        if (typeof parser === 'function') {
            return parser(value) as V[K];
        }
        return value;
    }

    public static setItem<K extends string = LocalStorageKeyList, V extends Record<string, any> = ILocalStorageValueList>(key: K, value: V[K]): void {
        const oldValue = this.getItem<K, V>(key);
        localStorage.setItem(key, JsonUtil.stringify(this.parse<K, V>(key, value)));

        const newValue = this.getItem<K, V>(key);
        change(key, newValue, oldValue);
    }

    public static getItem<K extends string = LocalStorageKeyList, V extends Record<string, any> = ILocalStorageValueList>(key: K): V[K] | null {
        return this.parse<K, V>(key, JsonUtil.parse(localStorage.getItem(key)))
    }
}

LocalStorageUtil.registerParser(LocalStorageKeyList.THEME, LocalStorageParserList[LocalStorageKeyList.THEME]);
LocalStorageUtil.registerParser(LocalStorageKeyList.THEME_TRANSITION_METHOD, LocalStorageParserList[LocalStorageKeyList.THEME_TRANSITION_METHOD]);
LocalStorageUtil.registerParser(LocalStorageKeyList.LAST_USER_INDEX, LocalStorageParserList[LocalStorageKeyList.LAST_USER_INDEX]);

function change(key: string, newValue: any, oldValue: any) {
    LocalStorageUtil.emitter.emit(LocalStorageEventList.CHANGE, key, newValue, oldValue);

    switch (key) {
        case LocalStorageKeyList.THEME:
            LocalStorageUtil.emitter.emit(LocalStorageEventList.THEME_CHANGED, newValue, oldValue);
            break;
        case LocalStorageKeyList.THEME_TRANSITION_METHOD:
            LocalStorageUtil.emitter.emit(LocalStorageEventList.THEME_TRANSITION_METHOD_CHANGED, newValue, oldValue);
            break;
    }
}

window.addEventListener('storage', function (ev: StorageEvent) {
    if (ev.storageArea !== this.localStorage) {
        return;
    }

    const key = ev.key;
    change(key, LocalStorageUtil.parse(key, JsonUtil.parse(ev.newValue)), LocalStorageUtil.parse(key, JsonUtil.parse(ev.oldValue)));
});
