import { LOG_LEVEL } from "../../env.js";

function getDateString(time: number) {
    function padNum(num: number, len: number) {
        return num.toString().padStart(len, "0");
    }
    const curDate = new Date(time);
    const year = padNum(curDate.getFullYear(), 4);
    const month = padNum(curDate.getMonth() + 1, 2);
    const date = padNum(curDate.getDate(), 2);
    const hour = padNum(curDate.getHours(), 2);
    const minute = padNum(curDate.getMinutes(), 2);
    const second = padNum(curDate.getSeconds(), 2);
    return `[${year}-${month}-${date} ${hour}:${minute}:${second}]`
}

export class Logger {
    static PREFIX = {
        SOCKET_SERVER: "[Socket Server] ",
        DATABASE: "[Database] ",
        REDIS_CLIENT: "[Redis Client] ",
        MAIN: "[Main] ",
        ACCOUNT_MANAGER: "[Account Manager] ",
        ROOM_MANAGER: "[Room manager] ",
        SYSTEM_EVENT_MANAGER: "[System Event Manager] ",
        MESSAGE_MANAGER: "[Message Manager] ",
        VARIABLE_TABLE_MANAGER: "[Variable Table Manager] ",
        DISCONNECT_MANAGER: "[Disconnect Manager] ",
        JWT_HELPER: "[JWTHelper] ",
        API(addStr: string) { return `[API - ${addStr}] ` }
    }

    protected _prefix: string = "";
    protected _indents: number = 0;
    protected _output: boolean = true;
    protected _showTime: boolean = true;
    protected _outputLevel: number = 1;

    constructor() {
        this.setOutputLevel(LOG_LEVEL);
    }

    setOutputLevel(level: number) {
        this._outputLevel = level;
    }

    setIndent(action: "set" | "add" | "reduce", value: number) {
        switch (action) {
            case "add":
                this._indents += value;
                break;
            case "set":
                this._indents = value;
                break;
            case "reduce":
                this._indents = Math.max(0, this._indents - value);
                break;
        }
    }

    setPrefix(prefix: string) {
        this._prefix = prefix;
    }

    setTime(show: boolean) {
        this._showTime = show;
    }

    setOutput(enable: boolean) {
        this._output = enable;
    }

    protected _print(output: any, newLine: boolean) {
        if (!this._output)
            return;
        const str = ' '.repeat(this._indents) +
            (this._showTime && (getDateString(Date.now()) + " ") || "") +
            (this._prefix || "") + output;// +
            // (newLine ? "\n" : "");
        console.log(str);
    }

    println(output: any, level: number = 1) {
        if (level > this._outputLevel)
            return;
        this._print(output, true);
    }

    print(output: any, level: number = 1) {
        if (level > this._outputLevel)
            return;
        this._print(output, false);
    }

    directOutput(output: string) {
        if (!this._output)
            return;
        console.log(output);
    }

    sepLine(char: string) {
        if (!this._output)
            return;
        if (char.length !== 1) {
            console.log("---------------------------------------------------------");
            console.log("Wrong with sepLine");
            console.log("---------------------------------------------------------");
            return;
        }
        this.println(char.repeat(60));
    }
}