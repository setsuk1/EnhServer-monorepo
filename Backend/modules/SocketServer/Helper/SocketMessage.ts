export class SocketMessage<T> {
    public type: number;
    public data: T;

    constructor(type: number, data?: T) {
        this.type = type;
        this.data = data;
    };

    public toArray() {
        const data = this.data;
        if (data == undefined) {
            return [this.type];
        }
        return [this.type, data];
    }
}