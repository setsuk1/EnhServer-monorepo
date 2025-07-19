import { NextFunction, Request, Response } from 'express';
import { statements } from '../../database/statements.js';
import { IVariableTableInfo } from '../../interfaces/Database/varTable/IVariableTableInfo.js';
import { IVariableTableEntryLocals } from '../../interfaces/route/locals/IVariableTableEntryLocals.js';
import { IVariableTableLocals } from '../../interfaces/route/locals/IVariableTableLocals.js';
import { IChangeValueBody } from '../../interfaces/route/reqBody/IChangeValueBody.js';
import { ICreateVariableTableEntryBody } from '../../interfaces/route/reqBody/ICreateVariableTableEntryBody.js';
import { IVariableTableData } from '../../interfaces/route/resMsgData/IVariableTableData.js';
import { db } from '../../main.js';
import { Message } from '../../other/Message.js';
import { MessageTypeList } from '../../other/MessageTypeList.js';

export function transVarTblInfo(userId: number, { id, nickname, belong_acc, created_at }: IVariableTableInfo): IVariableTableData {
    return { id, nickname, isOwner: belong_acc === userId, createdAt: created_at };
}

export async function checkUserIsVariableTableOwner(req: Request<{}, any, any, {}, IVariableTableLocals>, res: Response<any, IVariableTableLocals>, next: NextFunction) {
    const { userId, varTblId } = res.locals;
    const conn = await db.getConn();
    const [frow] = await statements.variableTable.QUERY_TABLE_ID_BY_ID_USER_ID.exec(conn, varTblId, userId);
    await conn.release();
    if (!frow) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}

export async function checkVariableTableIsEntryOwner(req: Request<{}, any, any, {}, IVariableTableEntryLocals>, res: Response<any, IVariableTableEntryLocals>, next: NextFunction) {
    const { varTblId, varTblEntId } = res.locals;
    const conn = await db.getConn();
    const [frow] = await statements.variableTable.QUERY_ENTRY_ID_BY_ID_TABLE_ID.exec(conn, varTblEntId, varTblId);
    await conn.release();
    if (!frow) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}

export function validateValue(req: Request<{}, any, IChangeValueBody>, res: Response, next: NextFunction) {
    const value = req.body?.value;
    if (!value && value !== '') {
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }
    next();
}

export function validateKeyAndValue(req: Request<{}, any, ICreateVariableTableEntryBody>, res: Response, next: NextFunction) {
    const key = req.body?.key;
    const value = req.body?.value;
    if (typeof key !== 'string' || !value && value !== '') {
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }
    next();
}
