const NOT_FOUND = -1;

export class UidTable {
    protected generateChars: string = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";;
    protected _map = new Map<string, any>();

    public reset() {
        this.generateChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890";
        this._map = new Map();
    }

    get(key: string) {
        return this._map.get(key);
    }

    has(key: string) {
        return this._map.has(key);
    }

    delete(key: string) {
        this._map.delete(key);
    }

    list() {
        return Array.from(this._map.entries());
    }

    setGenerateChars(str: string) {
        this.generateChars = str;
    }

    setAssociatedValue(uid: string, value: any): boolean {
        if (!this._map.has(uid))
            return false;

        this._map.set(uid, value);
        return true;
    }

    generateUid(prefix: string = undefined, length: number = 10, associatedObject: any = undefined) {
        let uids = this._map.keys();
        let uid = prefix?.slice(0) || "";
        let totalLen = length + uid.length;
        while (uid.length < totalLen)
            uid += this.newChar();

        for(;;) {
            let flag = true;
            for(let i of uids) {
                if(uid == i) {
                    uid += this.newChar();
                    flag = false;
                }
            }
            if(flag)
                break;
        }

        this._map.set(uid, associatedObject);
        return uid;
    }

    protected newChar() {
        let index = Math.floor(Math.random() * this.generateChars.length);
        return this.generateChars[index];
    }
}