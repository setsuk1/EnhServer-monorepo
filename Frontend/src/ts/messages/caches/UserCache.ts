import { MessageTypeList } from '../MessageTypeList.js';
import { UserServices } from '../services/UserServices.js';
import { UserVo } from '../vo/UserVo.js';
import { BaseCache } from './BaseCache.js';
import { CacheFetchResultList } from './CacheFetchResultList.js';

export class UserCache extends BaseCache<UserVo> {
    protected _index: number;

    constructor(index: number, ttl?: number) {
        super(ttl);
        this._index = index;
        this._name = `UserCache[${this._index}]`;
    }

    public get index(): number {
        return this._index;
    }

    protected async fetchData(): Promise<CacheFetchResultList> {
        const msg = await UserServices.fetchUser(this._index);
        switch (msg.type) {
            case MessageTypeList.HAS_NOT_LOGGED_IN:
                return CacheFetchResultList.failure;
            case MessageTypeList.SUCCESS:
                break;
            default:
                return CacheFetchResultList.retry;
        }

        if (this._data) {
            this._data.valueObject = msg.data;
        } else {
            this._data = new UserVo(msg.data);
        }
        return CacheFetchResultList.success;
    }
}
