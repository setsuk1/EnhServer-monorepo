import { MessageTypeList } from './MessageTypeList.js';

export class Message<D = undefined> {
    public static fromArray<D = undefined>(array: [MessageTypeList, D?]): Message<D> {
        if (Array.isArray(array) && array.length <= 2) {
            return new Message(...array);
        }
        return new Message(MessageTypeList.INVALID_MESSAGE, array as D);
    }

    protected _type: MessageTypeList;
    protected _data?: D;

    constructor(type: MessageTypeList, data?: D) {
        if (typeof type === 'number' && !isNaN(type)) {
            this._type = type;
        } else {
            this._type = MessageTypeList.INVALID_MESSAGE;
        }
        if (data != undefined) {
            this._data = data;
        }
        if (this._type > 5000) {
            console.error(`Error Message[${this._type}]`, this._data);
        }
    };

    public get type(): MessageTypeList {
        return this._type;
    }

    public get data(): D {
        return this._data;
    }

    public toJSON(): [MessageTypeList, D?] {
        if (this._data == undefined) {
            return [this._type];
        }
        return [this._type, this._data];
    }

    public isSuccess(): boolean {
        return this._type === MessageTypeList.SUCCESS;
    }
}
