import { System, system } from './System';

/**
 * 
 * @param {string | URL} url 
 */
export function normalizeURL(url) {
    try {
        return new URL(url);
    } catch {
        return new URL(url, window.location.origin);
    }
}

/**
 * 
 * @param {string | URL} url 
 * @param {string[][] | Record<string, string> | string | URLSearchParams} [params] 
 * @returns {boolean}
 */
export function redirect(url = '', params) {
    url = normalizeURL(url);

    if (url.origin !== window.origin) {
        return false;
    }

    params = new URLSearchParams(params);
    system.emit(System.EVENT.REDIRECT, params);

    if (params.size) {
        const searchParams = url.searchParams;
        for (const [key, value] of params) {
            if (searchParams.has(key, value)) {
                continue;
            }
            searchParams.append(key, value);
        }
    }

    location.assign(url);
    return true;
}