class _UrlUtil {
    public static readonly ALLOWED_REDIRECT_HOSTS = Object.freeze(['discord.gg', 'github.com']);

    public static readonly locationSearch = Object.freeze(new URLSearchParams(location.search));

    public static toURL(url: string | URL, base?: string | URL): URL {
        try {
            return new URL(url, base);
        } catch {
            return undefined;
        }
    }

    public static isAllowedUrl(url: string | URL, base?: string | URL): boolean {
        url = this.toURL(url, base);
        if (!url) {
            return false;
        }
        return url.origin === location.origin || this.ALLOWED_REDIRECT_HOSTS.includes(url.hostname);
    }

    public static redirect(url: string | URL, base?: string | URL): boolean {
        const _url = this.toURL(url, base);
        if (!_url || !this.isAllowedUrl(_url)) {
            return false;
        }

        const windowParams = new URLSearchParams(location.search);
        if (windowParams.has('redirect_with_params', 'true')) {
            const targetParams = new URLSearchParams(_url.searchParams);

            _url.search = windowParams.toString();

            targetParams.forEach((value: string, key: string) => {
                _url.searchParams.set(key, value);
            });
        }

        location.assign(_url);
        return true;
    }

    public static redirectBase(url: string | URL): boolean {
        return this.redirect(url, document.baseURI);
    }
}

export const UrlUtil = Object.freeze(_UrlUtil);
