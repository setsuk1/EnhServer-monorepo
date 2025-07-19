import { BaseCache } from './BaseCache.js';

export enum CacheEventList {
    REFRESH = 'refresh'
}

export interface CacheEventParamsList {
    [CacheEventList.REFRESH]: [BaseCache<any>];
}
