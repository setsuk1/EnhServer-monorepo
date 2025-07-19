import { Router } from 'express';
import { LOG_LEVEL, loggerPool } from '../../../instanceExport.js';
import { IUserLocals } from '../../../interfaces/route/locals/IUserLocals.js';
import { IUserVariableTableEntryLocals } from '../../../interfaces/route/locals/IUserVariableTableEntryLocals.js';
import { IUserVariableTableLocals } from '../../../interfaces/route/locals/IUserVariableTableLocals.js';
import { IUserParams } from '../../../interfaces/route/params/IUserParams.js';
import { IUserVariableTableEntryParams } from '../../../interfaces/route/params/IUserVariableTableEntryParams.js';
import { IUserVariableTableParams } from '../../../interfaces/route/params/IUserVariableTableParams.js';
import { IChangeValueBody } from '../../../interfaces/route/reqBody/IChangeValueBody.js';
import { ICreateVariableTableBody } from '../../../interfaces/route/reqBody/ICreateVariableTableBody.js';
import { ICreateVariableTableEntryBody } from '../../../interfaces/route/reqBody/ICreateVariableTableEntryBody.js';
import { IRenameBody } from '../../../interfaces/route/reqBody/IRenameBody.js';
import { IVariableTableData } from '../../../interfaces/route/resMsgData/IVariableTableData.js';
import { IVariableTableEntryData } from '../../../interfaces/route/resMsgData/IVariableTableEntryData.js';
import { Logger } from '../../../modules/Console/Logger.js';
import { VarTableResp, varTblMgr } from '../../../modules/VariableTable/VariableTableManager.js';
import { Message } from '../../../other/Message.js';
import { MessageTypeList } from '../../../other/MessageTypeList.js';
import { checkIdExist, checkTextAllowedMax } from '../../helper/common.js';
import { checkUserIsVariableTableOwner, checkVariableTableIsEntryOwner, transVarTblInfo, validateKeyAndValue, validateValue } from '../../helper/variableTable.js';

export const userVariableTableRouter = Router();
export const userVariableTableEntriesRouter = Router();

const loggerPrefix = Logger.PREFIX.API("user-variable-talbe");

const generalLogger = loggerPool.getInstance();
generalLogger.setPrefix(loggerPrefix);

userVariableTableRouter.get<IUserParams, any, any, {}, IUserLocals>('/', async (req, res) => {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch all variable table info for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const infos = await varTblMgr.listUserTableByUserId(userId);
    const transInfos: IVariableTableData[] = infos.map(v => transVarTblInfo(userId, v));

    generalLogger.println(`Session [${req.sessionID}] requested all variable table info for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, transInfos));
});

userVariableTableRouter.post<IUserParams, any, ICreateVariableTableBody, {}, IUserLocals>('/', async (req, res) => {
    const userId = res.locals.userId;
    generalLogger.println(`Session [${req.sessionID}] initiated a variable table creation request for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const nickname = req.body?.nickname;
    if (!checkTextAllowedMax(nickname)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to create variable table for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const result = await varTblMgr.createTableByUserId(nickname, userId);
    switch (result.type) {
        case VarTableResp.SUCCESS:
            break;
        default:
            generalLogger.println(`Session [${req.sessionID}] failed to create variable table for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
            return;
    }

    const varTblId = result.data;
    generalLogger.println(`Session [${req.sessionID}] successfully created variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS, varTblId));
});

userVariableTableRouter.all<IUserVariableTableParams, any, any, {}, IUserVariableTableLocals>(["/:varTblId", "/:varTblId/*"],
    checkIdExist('varTblId'),
    checkUserIsVariableTableOwner
);

userVariableTableRouter.get<IUserVariableTableParams, any, any, {}, IUserVariableTableLocals>("/:varTblId", async (req, res) => {
    const { userId, varTblId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch variable table [${varTblId}] info for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    const msg = await varTblMgr.getVarTableDataById(varTblId);
    switch (msg.type) {
        case VarTableResp.SUCCESS:
            break;
        default:
            generalLogger.println(`Session [${req.sessionID}] failed to request variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
            return;
    }

    const transInfo = transVarTblInfo(userId, msg.data);
    generalLogger.println(`Session [${req.sessionID}] requested variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, transInfo));
});

userVariableTableRouter.delete<IUserVariableTableParams, any, any, {}, IUserVariableTableLocals>("/:varTblId", async (req, res) => {
    const { userId, varTblId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a delete variable table request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const msg = await varTblMgr.deleteTableById(varTblId);
    switch (msg.type) {
        case VarTableResp.SUCCESS:
            break;
        default:
            generalLogger.println(`Session [${req.sessionID}] failed to delete variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
            return;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully deleted variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userVariableTableRouter.put<IUserVariableTableParams, any, IRenameBody, {}, IUserVariableTableLocals>("/:varTblId/nickname", async (req, res) => {
    const { userId, varTblId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a variable table rename request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

    const nickname = req.body?.nickname;
    if (!checkTextAllowedMax(nickname)) {
        generalLogger.println(`Session [${req.sessionID}] attempted to rename variable table [${varTblId}] for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.INVALID_DATA));
        return;
    }

    const msg = await varTblMgr.renameTableById(nickname, varTblId);
    switch (msg.type) {
        case VarTableResp.SUCCESS:
            break;
        default:
            generalLogger.println(`Session [${req.sessionID}] failed to rename variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.UNEXPECTED_ERROR))
            break;
    }

    generalLogger.println(`Session [${req.sessionID}] successfully renamed variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
    res.send(new Message(MessageTypeList.SUCCESS));
});

userVariableTableRouter.use('/:varTblId/variable', userVariableTableEntriesRouter);

/************************************/
/*        /:varTblId/variable       */
/************************************/

userVariableTableEntriesRouter.get<IUserVariableTableParams, any, any, {}, IUserVariableTableLocals>("/", async (req, res) => {
    const { userId, varTblId } = res.locals;
    generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch all entries for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

    let entries: IVariableTableEntryData[];
    const msg = await varTblMgr.listValueByTableId(varTblId);
    switch (msg.type) {
        case VarTableResp.SUCCESS:
            entries = msg.data;
            break;
        default:
            entries = []
            break;
    }

    generalLogger.println(`Session [${req.sessionID}] requested all entries for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.VERBOSE);
    res.send(new Message(MessageTypeList.SUCCESS, entries));
});

userVariableTableEntriesRouter.post<IUserVariableTableParams, any, ICreateVariableTableEntryBody, {}, IUserVariableTableLocals>("/",
    validateKeyAndValue,
    async (req, res) => {
        const { userId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] initiated a entry creation request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const key = req.body?.key;
        const value = req.body?.value;
        const msg = await varTblMgr.setNewValueByTableId(varTblId, key, value);
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] failed to create entry for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        const varTblEntId = msg.data;
        generalLogger.println(`Session [${req.sessionID}] successfully created entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS, varTblEntId));
    }
);

userVariableTableEntriesRouter.all<IUserVariableTableEntryParams, any, any, {}, IUserVariableTableEntryLocals>("/:varTblEntId",
    checkIdExist('varTblEntId'),
    checkVariableTableIsEntryOwner
);

userVariableTableEntriesRouter.get<IUserVariableTableEntryParams, any, any, {}, IUserVariableTableEntryLocals>('/:varTblEntId',
    async (req, res) => {
        const { userId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] initiated a request to fetch entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

        const msg = await varTblMgr.getValueById(varTblEntId);

        generalLogger.println(`Session [${req.sessionID}] requested entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.VERBOSE);
        res.send(new Message(MessageTypeList.SUCCESS, msg.data));
    }
);

userVariableTableEntriesRouter.delete<IUserVariableTableEntryParams, any, any, {}, IUserVariableTableEntryLocals>('/:varTblEntId',
    async (req, res) => {
        const { userId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] initiated a request to delete entry [${varTblEntId}] from variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const msg = await varTblMgr.deleteValueById(varTblEntId);
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] failed to delete entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] successfully deleted entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);

userVariableTableEntriesRouter.put<IUserVariableTableEntryParams, any, IChangeValueBody, {}, IUserVariableTableEntryLocals>('/:varTblEntId',
    validateValue,
    async (req, res) => {
        const { userId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] initiated a request to change entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const value = req.body?.value;
        const msg = await varTblMgr.updateValueById(varTblEntId, value);
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] failed to change entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] changed entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);
