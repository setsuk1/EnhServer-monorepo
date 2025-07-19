import { Router } from "express";
import { LOG_LEVEL, loggerPool } from "../../instanceExport.js";
import { ITokenLocals } from '../../interfaces/route/locals/ITokenLocals.js';
import { IVariableTableEntryLocals } from '../../interfaces/route/locals/IVariableTableEntryLocals.js';
import { IVariableTableLocals } from "../../interfaces/route/locals/IVariableTableLocals.js";
import { IWithTokenLocals } from '../../interfaces/route/locals/IWithTokenLocals.js';
import { IVariableTableEntryParams } from "../../interfaces/route/params/IVariableTableEntryParams.js";
import { IVariableTableParams } from "../../interfaces/route/params/IVariableTableParams.js";
import { IWithUserIndexParams } from '../../interfaces/route/params/IWithUserIndexParams.js';
import { IQueryUserIndex } from '../../interfaces/route/query/IQueryUserIndex.js';
import { IChangeValueBody } from '../../interfaces/route/reqBody/IChangeValueBody.js';
import { ICreateVariableTableBody } from '../../interfaces/route/reqBody/ICreateVariableTableBody.js';
import { ICreateVariableTableEntryBody } from '../../interfaces/route/reqBody/ICreateVariableTableEntryBody.js';
import { IRenameBody } from '../../interfaces/route/reqBody/IRenameBody.js';
import { IVariableTableData } from '../../interfaces/route/resMsgData/IVariableTableData.js';
import { IVariableTableEntryData } from '../../interfaces/route/resMsgData/IVariableTableEntryData.js';
import { Logger } from "../../modules/Console/Logger.js";
import { VarTableResp, varTblMgr } from "../../modules/VariableTable/VariableTableManager.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from '../../other/MessageTypeList.js';
import { tokenHandlers } from "../handler/tokenHandler.js";
import { checkIdExist, checkTextAllowedMax } from "../helper/common.js";
import { extractUserByQuery } from "../helper/user.js";
import { checkVariableTableIsEntryOwner, transVarTblInfo, validateKeyAndValue, validateValue } from "../helper/variableTable.js";

export const variableTableRouter = Router();
export const variableTableEntriesRouter = Router();

const loggerPrefix = Logger.PREFIX.API("variable-table");

const generalLogger = loggerPool.getInstance();
generalLogger.setPrefix(loggerPrefix);

variableTableRouter.get<IWithUserIndexParams, any, any, IQueryUserIndex, IWithTokenLocals>('/',
    tokenHandlers.EXTRACT_TOKEN,
    extractUserByQuery,
    async (req, res) => {
        const { userId, tokenId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}]${tokenId ? ` used token [${tokenId}]` : ''} initiated a request to fetch all variable table info for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

        const list = await varTblMgr.listAllTable();

        const infos: IVariableTableData[] = list.map(v => transVarTblInfo(userId, v));
        generalLogger.println(`Session [${req.sessionID}]${tokenId ? ` used token [${tokenId}]` : ''} requested all variable table info for user [${userId}].`, LOG_LEVEL.VERBOSE);
        res.send(new Message(MessageTypeList.SUCCESS, infos));
    }
);

variableTableRouter.post<IWithUserIndexParams, any, ICreateVariableTableBody, IQueryUserIndex, IWithTokenLocals>("/",
    tokenHandlers.EXTRACT_TOKEN,
    tokenHandlers.VERIFY_TOKEN_EXISTED,
    async (req, res) => {
        const { userId, tokenId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a variable table creation request for user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);
        generalLogger.println("Start to create var table.", LOG_LEVEL.VERBOSE);

        const nickname = req.body?.nickname;
        if (!checkTextAllowedMax(nickname)) {
            generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] attempted to create variable table for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.INVALID_DATA));
            return;
        }

        const result = await varTblMgr.createTableByUserId(nickname, userId);
        switch (result.type) {
            case VarTableResp.SUCCESS:
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to create variable table for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        const varTblId = result.data;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] successfully created variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS, varTblId));
    }
);

variableTableRouter.all<IVariableTableParams, any, any, {}, IVariableTableLocals>(["/:varTblId", "/:varTblId/*"],
    tokenHandlers.EXTRACT_TOKEN,
    tokenHandlers.VERIFY_TOKEN_EXISTED,
    checkIdExist("varTblId")
);

variableTableRouter.get<IVariableTableParams, any, any, {}, IVariableTableLocals & ITokenLocals>("/:varTblId",
    async (req, res) => {
        const { userId, tokenId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a request to fetch variable table [${varTblId}] info for user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

        const msg = await varTblMgr.getVarTableDataById(varTblId);
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to request variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        const transInfo = transVarTblInfo(userId, msg.data);
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] requested variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.VERBOSE);
        res.send(new Message(MessageTypeList.SUCCESS, transInfo));
    }
);

variableTableRouter.delete<IVariableTableParams, any, any, {}, IVariableTableLocals & ITokenLocals>("/:varTblId",
    async (req, res) => {
        const { userId, tokenId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a delete variable table request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const msg = await varTblMgr.deleteTableWithPerm({
            tokenId,
            tableId: varTblId
        });

        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            case VarTableResp.NO_WRITE_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] successfully deleted variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);

variableTableRouter.put<IVariableTableParams, any, IRenameBody, {}, IVariableTableLocals & ITokenLocals>("/:varTblId/nickname",
    async (req, res) => {
        const { userId, tokenId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a variable table rename request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const nickname = req.body?.nickname;
        if (!checkTextAllowedMax(nickname)) {
            generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] attempted to rename variable table [${varTblId}] for user [${userId}] with invalid data.`, LOG_LEVEL.NORMAL);
            res.send(new Message(MessageTypeList.INVALID_DATA));
            return;
        }

        const msg = await varTblMgr.renameTableWithPerm(nickname, {
            tableId: varTblId,
            tokenId
        });
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            case VarTableResp.NO_UPDATE_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                break;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to rename variable table [${varTblId}] for user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR))
                break;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] successfully renamed variable table [${varTblId}] for user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);

variableTableRouter.use('/:varTblId/variable', variableTableEntriesRouter);

/************************************/
/*        /:varTblId/variable       */
/************************************/

variableTableEntriesRouter.get<IVariableTableParams, any, any, {}, IVariableTableLocals & ITokenLocals>("/",
    async (req, res) => {
        const { userId, tokenId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a request to fetch all entries for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

        let entries: IVariableTableEntryData[];
        const msg = (await varTblMgr.listValueWithPerm({
            tableId: varTblId,
            domain: null,
            tokenId,
            userId: null
        }));
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                entries = msg.data;
                break;
            case VarTableResp.NO_READ_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                return;
            default:
                entries = []
                break;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] requested all entries for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.VERBOSE);
        res.send(new Message(MessageTypeList.SUCCESS, entries));
    }
);

variableTableEntriesRouter.post<IVariableTableParams, any, ICreateVariableTableEntryBody, {}, IVariableTableLocals & ITokenLocals>("/",
    validateKeyAndValue,
    async (req, res) => {
        const { userId, tokenId, varTblId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a entry creation request for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const key = req.body?.key;
        const value = req.body?.value;
        const msg = await varTblMgr.setNewValueWithPerm(key, value, {
            tableId: varTblId,
            domain: null,
            tokenId,
            userId: null
        });
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            case VarTableResp.NO_WRITE_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                return;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to create entry for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        const varTblEntId = msg.data;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] successfully created entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS, varTblEntId));
    }
);

variableTableEntriesRouter.all<IVariableTableEntryParams, any, any, {}, IVariableTableEntryLocals & ITokenLocals>("/:varTblEntId",
    checkIdExist("varTblEntId"),
    checkVariableTableIsEntryOwner
);

variableTableEntriesRouter.get<IVariableTableEntryParams, any, any, {}, IVariableTableEntryLocals & ITokenLocals>("/:varTblEntId",
    async (req, res) => {
        const { userId, tokenId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a request to fetch entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MOST_VERBOSE);

        const msg = await varTblMgr.getValueByIdWithPerm(varTblEntId, {
            tableId: varTblId,
            domain: null,
            tokenId,
            userId: null,
        });
        switch (msg.type) {
            case VarTableResp.NO_READ_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] requested entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.VERBOSE);
        res.send(new Message(MessageTypeList.SUCCESS, msg.data));
    }
);

variableTableEntriesRouter.delete<IVariableTableEntryParams, any, any, {}, IVariableTableEntryLocals & ITokenLocals>("/:varTblEntId",
    async (req, res) => {
        const { userId, tokenId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a request to delete entry [${varTblEntId}] from variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const msg = await varTblMgr.deleteValueByIdWithPerm(varTblEntId, {
            tableId: varTblId,
            domain: null,
            tokenId,
            userId: null
        });
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            case VarTableResp.NO_DELETE_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
                return;
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] successfully deleted entry [${varTblEntId}] for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);

variableTableEntriesRouter.put<IVariableTableEntryParams, any, IChangeValueBody, {}, IVariableTableEntryLocals & ITokenLocals>("/:varTblEntId",
    validateValue,
    async (req, res) => {
        const { userId, tokenId, varTblId, varTblEntId } = res.locals;
        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] initiated a request to change entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.MORE_VERBOSE);

        const value = req.body?.value;
        const msg = await varTblMgr.updateValueByIdWithPerm(
            varTblEntId,
            value,
            {
                tableId: varTblId,
                tokenId,
                userId: null,
                domain: null,
            }
        );
        switch (msg.type) {
            case VarTableResp.SUCCESS:
                break;
            case VarTableResp.NO_UPDATE_PERMISSION:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to delete variable table [${varTblId}] for user [${userId}] due to permission denied.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.PERMISSION_DENIED));
            default:
                generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] failed to change entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}] due to an unknown error.`, LOG_LEVEL.NORMAL);
                res.send(new Message(MessageTypeList.UNEXPECTED_ERROR));
                return;
        }

        generalLogger.println(`Session [${req.sessionID}] used token [${tokenId}] changed entry [${varTblEntId}] value for variable table [${varTblId}] of user [${userId}].`, LOG_LEVEL.NORMAL);
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);
