import { Message } from './Message.js';
import { System, system } from './System.js';

/**
 * 
 * @param {string} html 
 */
export function htmlToFragment(html) {
    const template = document.createElement('template');
    template.innerHTML = html;
    return template.content;
}

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

export function wait(ms = 0) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const urlSearchParams = new URLSearchParams(window.location.search);

export function getURLSearchParams() {
    return new URLSearchParams(urlSearchParams);
}

/**
 * 
 * @param {RequestInfo | URL} input 
 * @param {RequestInit} init 
 */
export async function safeFetch(input, init) {
    try {
        return Message.fromArray(await (await fetch(input, init)).json());
    } catch (e) {
        return new Message(Message.TYPE.NETWORK_ERROR, e);
    }
}

export function isChrome() {
    return /Chrome/.test(navigator.userAgent);
}