import { AuthenticationResponseJSON, PublicKeyCredentialCreationOptionsJSON, PublicKeyCredentialRequestOptionsJSON, RegistrationResponseJSON } from '@simplewebauthn/browser';
import { Message } from '../Message.js';
import { PasskeyVo } from '../vo/PasskeyVo.js';
import { APIServices } from './APIServices.js';

export class PasskeyServices {
    public static async fetchAllPasskey(userIndex: number): Promise<PasskeyVo[]> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/passkey`);
        if (!msg.isSuccess() || !Array.isArray(msg.data)) {
            return [];
        }
        return msg.data.map(vo => new PasskeyVo(vo));
    }

    public static requestRegisterOptions(userIndex: number): Promise<Message<PublicKeyCredentialCreationOptionsJSON>> {
        return APIServices.safeFetch(`/api/user/${userIndex}/passkey/generate-registration-options`);
    }

    public static async verifyRegisterOptions(userIndex: number, attResp: RegistrationResponseJSON): Promise<Message<number>> {
        return APIServices.safeFetch(`/api/user/${userIndex}/passkey/verify-registration`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(attResp),
        });
    }

    public static requestAuthenticationOptions(account: string): Promise<Message<PublicKeyCredentialRequestOptionsJSON>> {
        return APIServices.safeFetch('/api/user/generate-authentication-options', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ account })
        });
    }

    public static async verifyAuthenticationOptions(asseResp: AuthenticationResponseJSON): Promise<Message<number>> {
        return APIServices.safeFetch('/api/user/verify-authentication', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(asseResp),
        });
    }

    public static async fetchPasskey(userIndex: number, id: number): Promise<PasskeyVo> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/passkey/${id}`);
        if (!msg.isSuccess() || !msg.data) {
            return undefined;
        }
        return new PasskeyVo(msg.data);
    }

    public static async deletePasskey(userIndex: number, id: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/passkey/${id}`, {
            method: 'DELETE'
        });
    }

    public static async renamePasskey(userIndex: number, id: number, nickname: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/passkey/${id}/nickname`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname })
        });
    }
}
