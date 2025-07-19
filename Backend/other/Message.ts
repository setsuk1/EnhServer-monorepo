import { MessageTypeList } from './MessageTypeList.js';

export class Message<T extends number | string = MessageTypeList, D = undefined> {
    public type: T;
    public data: D;

    constructor(type: T, data?: D) {
        this.type = type;
        this.data = data;
    };

    public toJSON(): [T, D?] {
        const data = this.data;
        if (data == undefined) {
            return [this.type];
        }
        return [this.type, data];
    }
}
