import { NextFunction, Request, Response } from 'express';
import { Message } from '../../other/Message.js';
import { MessageTypeList } from '../../other/MessageTypeList.js';
import { TEXT_ALLOWED_MAX } from './routeConstant.js';

export function checkTextAllowedMax(text: any): boolean {
    return !(typeof text !== 'string' || !text.length || text.length > TEXT_ALLOWED_MAX)
}

export function checkPosInt(value: any): boolean {
    return Number.isInteger(value) && value > 0;
}

export function validateInt(value: any, min: number, max: number, def = 0): number {
    return Number.isInteger(value) && value >= min && value <= max ? value : def;
}

const replacement: [RegExp, string][] = [
    [/--.*(\n|$)/gm, " "],
    [/\s{2,}/gm, " "],
    [/\s*(,|\(|\)|>|<|=)\s*/gm, "$1"]
];

export function clearSqlStatements(sql: string): string {
    sql = sql.trim();
    for (const [a, b] of replacement) {
        sql = sql.replaceAll(a, b);
    }
    return sql.trim();
}

export function checkIdExist<S extends string>(name: S) {
    return function (req: Request<Record<S, any>>, res: Response<any, Record<S, number>>, next: NextFunction) {
        const id = +req.params[name];
        if (!checkPosInt(id)) {
            res.send(new Message(MessageTypeList.INVALID_DATA));
            return;
        }
        (res.locals as Record<S, number>)[name] = id;
        next();
    }
}
