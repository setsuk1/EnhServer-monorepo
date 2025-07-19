import { Message } from '../Message.js';
import { TokenVo } from '../vo/TokenVo.js';
import { APIServices } from './APIServices.js';

export interface ICreateTokenResponse {
    id: number;
    string: string;
}

export class TokenServices {
    public static async fetchAllToken(userIndex: number): Promise<TokenVo[]> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/token`);
        if (!msg.isSuccess() || !Array.isArray(msg.data)) {
            return [];
        }
        return msg.data.map(vo => new TokenVo(vo));
    }

    public static createToken(userIndex: number, type: number): Promise<Message<ICreateTokenResponse>> {
        return APIServices.safeFetch(`/api/user/${userIndex}/token`, {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ type })
        });
    }

    public static async fetchToken(userIndex: number, id: number): Promise<TokenVo> {
        const msg = await APIServices.safeFetch(`/api/user/${userIndex}/token/${id}`);
        if (!msg.isSuccess() || !msg.data) {
            return undefined;
        }
        return new TokenVo(msg.data);
    }

    public static deleteToken(userIndex: number, id: number): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/token/${id}`, {
            method: 'DELETE'
        });
    }

    public static renameToken(userIndex: number, id: number, nickname: string): Promise<Message> {
        return APIServices.safeFetch(`/api/user/${userIndex}/token/${id}/nickname`, {
            method: 'PUT',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ nickname })
        });
    }
}
