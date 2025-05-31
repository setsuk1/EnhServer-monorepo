import { safeFetch } from './function.js';
import { Message } from './Message.js';

const { startRegistration, startAuthentication } = SimpleWebAuthnBrowser;

export async function reqRegOpts() {
    const msg = await safeFetch('api/passkey/generate-registration-options');

    switch (msg.type) {
        case Message.TYPE.NETWORK_ERROR:
        case Message.TYPE.INVALID_MESSAGE:
        case Message.TYPE.HAS_NOT_LOGGED_IN:
        case Message.TYPE.REGISTER_PASSKEY_OPTIONS:
            return msg;
        default:
            return new Message();
    }
}

export async function verifyRegOpts(optionsJSON) {
    let attResp;

    try {
        attResp = await startRegistration({ optionsJSON });
    } catch (error) {
        if (error.name === 'InvalidStateError') {
            return new Message(Message.TYPE.PASSKEY_AUTHENTICATOR_ALREADY_REGISTERED);
        }
        return new Message(Message.TYPE.UNEXPECTED_ERROR, error);
    }

    const msg = await safeFetch('api/passkey/verify-registration', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(attResp),
    });

    switch (msg.type) {
        case Message.TYPE.NETWORK_ERROR:
        case Message.TYPE.INVALID_MESSAGE:
        case Message.TYPE.INVALID_STATE:
        case Message.TYPE.UNEXPECTED_ERROR:
        case Message.TYPE.PASSKEY_REGISTERATION_VERIFY_FAILED:
        case Message.TYPE.SUCCESS:
            return msg;
        default:
            return new Message();
    }
}

/**
 * 
 * @param {string} account 
 */
export async function reqAuthOpts(account) {
    const msg = await safeFetch('api/passkey/generate-authentication-options', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            acc: account
        }),
        credentials: 'include'
    });

    switch (msg.type) {
        case Message.TYPE.NETWORK_ERROR:
        case Message.TYPE.INVALID_MESSAGE:
        case Message.TYPE.HAS_LOGGED_IN:
        case Message.TYPE.GENERIC_ERROR:
        case Message.TYPE.NO_PASSKEY_CRED:
        case Message.TYPE.SUCCESS:
            return msg;
        default:
            return new Message();
    }
}

export async function verifyAuthOpts(optionsJSON) {
    let asseResp;

    try {
        asseResp = await startAuthentication({ optionsJSON });
    } catch (error) {
        return new Message(Message.TYPE.PASSKEY_LOGIN_START_AUTH_FAILED, error);
    }

    const msg = await safeFetch('api/passkey/verify-authentication', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(asseResp),
    });

    switch (msg.type) {
        case Message.TYPE.NETWORK_ERROR:
        case Message.TYPE.INVALID_MESSAGE:
        case Message.TYPE.INVALID_STATE:
        case Message.TYPE.UNEXPECTED_ERROR:
        case Message.TYPE.GENERIC_ERROR:
        case Message.TYPE.HAS_LOGGED_IN:
        case Message.TYPE.SUCCESS:
            return msg;
        default:
            return new Message();
    }
}