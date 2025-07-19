import { IPasskeyCredByUser } from './IPasskeyCredByUser.js';

export interface IPasskeyCred extends IPasskeyCredByUser {
    cred_public_key: Uint8Array;
    // internal_user_id: number
    counter: number
    // created_at: string;
    // last_used: string;
}
