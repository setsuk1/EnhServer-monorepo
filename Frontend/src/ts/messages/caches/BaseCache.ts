import { Emitter } from '../../utils/emitter/Emitter.js';
import { TimeUtil } from '../../utils/TimeUtil.js';
import { CacheEventList } from './CacheEventList.js';
import { CacheFetchResultList } from './CacheFetchResultList.js';

export abstract class BaseCache<T> {
    protected _name = 'BaseCache';

    protected _data: T;
    protected _lastUpdated: number = NaN;
    protected _ttl: number;

    public readonly emitter = new Emitter();

    constructor(ttl = 10 * TimeUtil.MINUTE) {
        this._ttl = Math.max(0, +ttl || 0);
    }

    public get lastUpdated(): number {
        return this._lastUpdated;
    }

    public get age(): number {
        return TimeUtil.now() - this._lastUpdated;
    }

    public get cachedData(): T {
        return this._data;
    }

    public isFreshWithin(ms: number): boolean {
        return this.age < ms;
    }

    public async getData(): Promise<T> {
        if (!this._data || this.isExpired()) {
            await this.refresh();
        }
        return this._data;
    }

    public setData(data: T, lastUpdated?: number): void {
        this._data = data;
        this._lastUpdated = +lastUpdated || TimeUtil.now();
        this.emitter.emit(CacheEventList.REFRESH, this);
    }

    public isExpired(): boolean {
        return !this._data || this.age > this._ttl;
    }

    public async refresh(maxRetries?: number, retryInterval = TimeUtil.SECOND): Promise<boolean> {
        maxRetries = Math.trunc(maxRetries);
        retryInterval = Math.max(0, retryInterval) || 0;
        if (isNaN(maxRetries)) {
            maxRetries = 15;
        }
        for (; ;) {
            let result: CacheFetchResultList;
            try {
                result = await this.fetchData();
            } catch {
                result = CacheFetchResultList.retry;
            }
            switch (result) {
                case CacheFetchResultList.success:
                    break;
                case CacheFetchResultList.retry:
                    if (--maxRetries < 0) {
                        console.error(`${this._name}: exceeded maximum retry attempts`);
                        this.onRefreshFailure();
                        return false;
                    }
                    console.error(`${this._name}: Fetch failed. Retrying in ${retryInterval}ms...`);
                    await TimeUtil.wait(retryInterval);
                    console.log(`${this._name}: try fetching the data again`);
                    continue;
                case CacheFetchResultList.failure:
                default:
                    console.error(`${this._name}: failed to fetch data`);
                    this.onRefreshFailure();
                    return false;
            }
            break;
        }
        this._lastUpdated = TimeUtil.now();
        this.emitter.emit(CacheEventList.REFRESH, this);
        return true;
    }

    protected abstract fetchData(): Promise<CacheFetchResultList>;

    protected onRefreshFailure(): void {
        this.setData(undefined);
    }
}
