import { Router, type NextFunction } from "express";
import { IPermissionFullResult } from "../../interfaces/Permission/manager/IFullPermission.js";
import { ITokenLocals } from "../../interfaces/route/locals/ITokenLocals.js";
import { Logger } from "../../modules/Console/Logger.js";
import { permMgr } from "../../modules/Permission/PermissionManager.js";
import { varTblMgr } from "../../modules/VariableTable/VariableTableManager.js";
import { Message } from "../../other/Message.js";
import { MessageTypeList } from "../../other/MessageTypeList.js";
import { tokenHandlers } from "../handler/tokenHandler.js";
import { checkIdExist } from "../helper/common.js";

export const permissionRouter = Router();

const loggerPrefix = Logger.PREFIX.API("Permission");

function transformPermission(rawPermission: IPermissionFullResult) {
    const obj = JSON.parse(JSON.stringify(rawPermission));
    const refs = Object.entries(obj).filter(v => v[0].startsWith("r")).filter(v => !!+v[1]);
    if (refs.length !== 1)
        return undefined;
    const [refKey, refValue] = refs[0];
    delete obj[refKey];
    switch (refKey) {
        case "tVariableTableId":
            obj["rEntryType"] = "variable-table";
            break;
    }
    return obj;
}

async function checkPermissionUserId(req, res, next: NextFunction) {
    const checkAccount = await permMgr.checkEntryWithUserId(req.params.permId, res.locals.userId);
    if (!checkAccount) {
        res.send(new Message(MessageTypeList.PERMISSION_DENIED));
        return;
    }
    next();
}

permissionRouter.all<{permId: number}, any, any, any, ITokenLocals & {permId: number}>("/:permId",
    checkIdExist("permId"),
    tokenHandlers.EXTRACT_TOKEN,
    tokenHandlers.VERIFY_TOKEN_EXISTED,
    checkPermissionUserId,
)

permissionRouter.get("/:permId",
    async (req, res) => {
        const permission = await permMgr.getPermissionById(+req.params.permId);
        if (!permission) {
            res.send(new Message(MessageTypeList.GENERIC_ERROR));
            return
        }
        res.send(new Message(MessageTypeList.SUCCESS, permission));
    }
);

permissionRouter.put("/:permId",
    async (req, res) => {
        const result = await permMgr.updatePermission(req.body["data"]);
        if (!result) {
            res.send(new Message(MessageTypeList.GENERIC_ERROR));
            return;
        }
        res.send(new Message(MessageTypeList.SUCCESS));
    }
);

permissionRouter.get("/varTable/",
    tokenHandlers.EXTRACT_TOKEN,
    tokenHandlers.VERIFY_TOKEN_EXISTED,
    async (req, res) => {
        const userId = res.locals.userId;
        if (!userId)
            return res.send(new Message(MessageTypeList.PERMISSION_DENIED));

        const myTables = await varTblMgr.listAllTable();
        const tableIds = myTables.filter(v => v.belong_acc == userId).map(v => v.id);
        const entryIdArr = await Promise.all(tableIds.map(v => permMgr.getEntryIdByVarTableId(v)));
        const permissions = await Promise.all(entryIdArr.map(v => permMgr.getPermissionsByEntryId(v)));
        const transformed = permissions.map(v => v.map(vv => transformPermission(vv)));
        // get table related permissions
        res.send(new Message(MessageTypeList.SUCCESS, transformed));
    }
)

permissionRouter.all("/varTable/:variableTableId",
    checkIdExist("variableTableId")
)

permissionRouter.get("/varTable/:variableTableId",
    tokenHandlers.EXTRACT_TOKEN,
    tokenHandlers.VERIFY_TOKEN_EXISTED,
    async (req, res) => {
        const userId = res.locals.userId;
        if (!userId)
            return res.send(new Message(MessageTypeList.PERMISSION_DENIED));

        const tableId = +req.query.variableTableId;

        const entryId = await permMgr.getEntryIdByVarTableId(tableId);

        const checkPerm = await permMgr.checkEntryWithUserId(entryId, userId);
        if(!checkPerm)
            return res.send(new Message(MessageTypeList.PERMISSION_DENIED));

        const permissions = await permMgr.getPermissionsByEntryId(entryId);
        const transformed = permissions.map(v => transformPermission(v));
        // get table related permissions
        res.send(new Message(MessageTypeList.SUCCESS, transformed));
    }
)