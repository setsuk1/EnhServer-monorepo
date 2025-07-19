import { Router } from "express";
import { Message } from "../other/Message.js";
import { MessageTypeList } from '../other/MessageTypeList.js';
import { permissionRouter } from "./permission/permission.js";
import { userRouter } from "./user/user.js";
import { variableTableRouter } from "./variableTable/variableTable.js";

export const apiRouter = Router();

apiRouter.get("/", (req, res, next) => {
    res.send(new Message(MessageTypeList.SUCCESS, 'Hello Beater!'));
});

apiRouter.use("/user", userRouter);

apiRouter.use("/variable-table", variableTableRouter);
apiRouter.use("/permission", permissionRouter);
