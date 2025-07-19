import { Emitter } from '../../utils/emitter/Emitter.js';
import { LocalStorageKeyList } from '../../utils/storage/localStorage/LocalStorageKeyList.js';
import { LocalStorageUtil } from '../../utils/storage/localStorage/LocalStorageUtil.js';
import { SessionStorageKeyList } from '../../utils/storage/sessionStorage/SessionStorageKeyList.js';
import { SessionStorageUtil } from '../../utils/storage/sessionStorage/SessionStorageUtil.js';
import { TypeUtil } from '../../utils/TypeUtil.js';
import { CacheEventList } from '../caches/CacheEventList.js';
import { UserCache } from '../caches/UserCache.js';
import { UserServices } from '../services/UserServices.js';
import { UserVo } from '../vo/UserVo.js';
import { UserManagerEventList } from './UserManagerEventList.js';

export class UserManager {
    protected _caches: UserCache[] = [];

    protected _initPromise: Promise<void>;

    protected _currentUserIndex: number;

    public readonly emitter = new Emitter();

    constructor() {
        this._currentUserIndex = SessionStorageUtil.getItem(SessionStorageKeyList.CURRENT_USER_INDEX) ?? LocalStorageUtil.getItem(LocalStorageKeyList.LAST_USER_INDEX);
        this.initialize();
    }

    public get currentUserIndex(): number {
        return this._currentUserIndex;
    }

    protected initialize(): Promise<void> {
        if (this._initPromise) {
            return this._initPromise;
        }
        this._initPromise = this.fecthLoggedInUsers().then(() => this._initPromise = undefined);
        return this._initPromise;
    }

    public async fecthLoggedInUsers(): Promise<void> {
        const msg = await UserServices.fetchAllUser();
        if (!msg.isSuccess()) {
            return;
        }
        this._caches.splice(msg.data.length).forEach(cache => this.removeCache(cache));

        for (const userJson of msg.data) {
            let cache = this.getUserCacheByIndex(userJson.index);
            if (!cache) {
                this.addCache(new UserVo(userJson));
            } else {
                cache.cachedData.valueObject = userJson;
                cache.setData(cache.cachedData);
            }
        }

        if (!this.getUserCacheByIndex(this._currentUserIndex)?.cachedData?.isLoggedIn) {
            this.setCurrentUserIndex(this._caches.findIndex(cache => cache.cachedData.isLoggedIn));
        }
    }

    protected setCurrentUserIndex(index: number): void {
        this._currentUserIndex = index;
        LocalStorageUtil.setItem(LocalStorageKeyList.LAST_USER_INDEX, index);
        SessionStorageUtil.setItem(SessionStorageKeyList.CURRENT_USER_INDEX, index);
    }

    protected addCache(vo: UserVo): UserCache {
        const cache = new UserCache(vo.index);
        this._caches[vo.index] = cache;
        cache.emitter.on(CacheEventList.REFRESH, this.onUserRefresh, this);
        cache.setData(vo);
        return cache;
    }

    protected async addUser(index: number): Promise<UserCache> {
        const cache = new UserCache(index);
        const success = await cache.refresh();
        if (success) {
            this._caches[cache.index] = cache;
            cache.emitter.on(CacheEventList.REFRESH, this.onUserRefresh, this);
            cache.setData(cache.cachedData, cache.lastUpdated);
        }
        return cache;
    }

    protected removeCache(cache: UserCache): void {
        cache.emitter.off(CacheEventList.REFRESH, this.onUserRefresh, this);
        if (this.getUserCacheByIndex(cache.index) === cache) {
            this.initialize();
            return;
        }
        this.emitter.emit(UserManagerEventList.USER_REFRESH, undefined, cache.index);
    }

    protected onUserRefresh(cache: UserCache): void {
        const user = cache.cachedData;
        if (!user) {
            this.removeCache(cache);
            return;
        }
        this.emitter.emit(UserManagerEventList.USER_REFRESH, user, cache.index);
    }

    public async ready(): Promise<void> {
        await this._initPromise;
    }

    public async getCurrentUser(): Promise<UserVo> {
        await this.ready();
        return this.getUserCacheByIndex(this._currentUserIndex)?.getData();
    }

    public async getUsers(): Promise<UserVo[]> {
        await this.ready();
        return Promise.all(this._caches.map(user => user.getData()));
    }

    public async getUserByIndex(index: number): Promise<UserVo> {
        if (!TypeUtil.isUint(index)) {
            return undefined;
        }
        await this.ready();

        let cache = this.getUserCacheByIndex(index);
        let user: UserVo;
        if (cache) {
            user = await cache.getData();
        } else {
            cache = await this.addUser(index);
            user = cache.cachedData;
        }
        return user;
    }

    public getUserCacheByIndex(index: number): UserCache {
        return this._caches[index];
    }

    public async switcCurrenthUserByIndex(index: number): Promise<void> {
        if (!TypeUtil.isUint(index)) {
            return;
        }

        await this.refreshUser(index);
        if (index === this._currentUserIndex) {
            return;
        }

        const user = await this.getUserByIndex(index);
        if (user?.isLoggedIn) {
            this.setCurrentUserIndex(user.index);
            this.emitter.emit(UserManagerEventList.SWITCH_CURRENT_USER);
        } else {
            const user = await this.getCurrentUser();
            if (!user?.isLoggedIn) {
                await this.initialize();
            }
        }
    }

    public async updateNickname(index: number, nickname: string) {
        const msg = await UserServices.renameUser(index, nickname);
        if (msg.isSuccess()) {
            await this.refreshUser(index);
        }
        return msg;
    }

    public async updatePassword(index: number, password: string, newPassword: string) {
        const msg = await UserServices.changeUserPassword(index, password, newPassword);
        if (msg.isSuccess()) {
            await this.refreshUser(index);
        }
        return msg;
    }

    public async updateAllowPassword(index: number, allowPassword: boolean, password: string) {
        const msg = await UserServices.changeUserAllowPassword(index, allowPassword, password);
        if (msg.isSuccess()) {
            await this.refreshUser(index);
        }
        return msg;
    }

    public async refreshUser(index: number): Promise<void> {
        await this.ready();

        const cache = this.getUserCacheByIndex(index);
        let user: UserVo;
        if (cache) {
            await cache.refresh();
            user = await cache.getData();
        } else {
            user = await this.getUserByIndex(index);
        }
        if (index === this._currentUserIndex && !user?.isLoggedIn) {
            await this.initialize();
        }
    }
}

export const userManager = new UserManager();
