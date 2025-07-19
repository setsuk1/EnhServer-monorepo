import { UrlUtil } from './UrlUtil.js';

export class HtmlUtil {
    public static waitDOMContentLoaded(): Promise<Event> | void {
        if (document.readyState === 'loading') {
            return new Promise<Event>(resolve => document.addEventListener('DOMContentLoaded', resolve));
        }
    }

    public static createFragment(html: string): DocumentFragment {
        const template = document.createElement('template');
        template.innerHTML = html;
        return template.content;
    }

    public static createElement<T extends HTMLElement>(html: string): T {
        return this.createFragment(html).firstElementChild as T;
    }

    public static createDom(html: string): { root: HTMLElement } & { [key: string]: HTMLElement } {
        const root = this.createElement(html);
        const dom = {} as { root: HTMLElement } & { [key: string]: HTMLElement };
        root.querySelectorAll('[data-enh-label]').forEach((el: HTMLElement) => {
            dom[el.dataset['enhLabel']] = el;
        });
        dom.root = root;
        return dom;
    }

    public static isChromium(): boolean {
        return !!window['chrome'] && /chrome|chromium|crios/i.test(navigator.userAgent);
    }

    public static isCSSFileLinked(filePath: string | URL): boolean {
        const href = UrlUtil.toURL(filePath, document.baseURI).href;
        return !!Array.from(document.styleSheets).find(sheet => sheet.href === href);
    }

    public static async linkCSSFile(filePath: string | URL): Promise<void> {
        const href = UrlUtil.toURL(filePath, document.baseURI).href;
        if (this.isCSSFileLinked(href)) {
            return;
        }
        const link = loadingMap.keys().find(link => link.href === href);
        if (link) {
            return loadingMap.get(link);
        }

        return new Promise<void>((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = href;

            link.addEventListener('load', () => {
                loadingMap.delete(link);
                resolve();
            });
            link.addEventListener('error', (err) => {
                loadingMap.delete(link);
                reject(err);
            });

            document.head.appendChild(link);
        });
    }
}

const loadingMap = new Map<HTMLLinkElement, Promise<void>>();
