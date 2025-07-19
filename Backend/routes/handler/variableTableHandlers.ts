import { Request, Response } from 'express';
import { IUserRelatedLocals } from '../../interfaces/route/locals/IUserRelatedLocals.js';
import { IVariableTableData } from '../../interfaces/route/resMsgData/IVariableTableData.js';
import { varTblMgr } from '../../modules/VariableTable/VariableTableManager.js';
import { Message } from '../../other/Message.js';
import { MessageTypeList } from '../../other/MessageTypeList.js';
import { transVarTblInfo } from '../helper/variableTable.js';

export const variableTableHandlers = {
    async GET_TABLE_LIST(req: Request<{}, any, any, {}, IUserRelatedLocals>, res: Response<any, IUserRelatedLocals>) {
        const userId = res.locals.userId;
        const list = await varTblMgr.listAllTable();

        const infos: IVariableTableData[] = list.map(v => transVarTblInfo(userId, v));
        res.send(new Message(MessageTypeList.SUCCESS, infos));
    }
};
