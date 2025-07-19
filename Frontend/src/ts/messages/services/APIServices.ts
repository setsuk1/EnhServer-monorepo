import { Message } from '../Message.js';
import { MessageTypeList } from '../MessageTypeList.js';

export class APIServices {
    public static async safeFetch(input: RequestInfo | URL, init?: RequestInit) {
        try {
            return Message.fromArray(await (await fetch(input, init)).json());
        } catch (err) {
            return new Message(MessageTypeList.NETWORK_ERROR, err);
        }
    }
}
