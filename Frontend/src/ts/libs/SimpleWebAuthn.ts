import * as SimpleWebAuthnBrowser from '@simplewebauthn/browser';

type SWAB = typeof SimpleWebAuthnBrowser;

let webAuthn: SWAB;

export class SimpleWebAuthn {
    protected static loading: Promise<void>;

    public static async loaded(): Promise<void> {
        if (webAuthn) {
            return;
        }
        if (!this.loading) {
            this.loading = import(`${location.origin}/static/js/simplewebauthn-browser-13.1.0.umd.min.js`)
                .then(() => {
                    if (!('SimpleWebAuthnBrowser' in window) || !window.SimpleWebAuthnBrowser) {
                        throw Error('SimpleWebAuthnBrowser is not loaded correctly');
                    }
                    webAuthn = window.SimpleWebAuthnBrowser as SWAB;
                });
        }
        return this.loading;
    }

    public static async startRegistration(...args: Parameters<SWAB['startRegistration']>): ReturnType<SWAB['startRegistration']> {
        if (!webAuthn) {
            await this.loaded();
        }
        return webAuthn.startRegistration(...args);
    }

    public static async startAuthentication(...args: Parameters<SWAB['startAuthentication']>): ReturnType<SWAB['startAuthentication']> {
        if (!webAuthn) {
            await this.loaded();
        }
        return webAuthn.startAuthentication(...args);
    }
}

SimpleWebAuthn.loaded();
