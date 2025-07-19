import { IPermissionResult } from "./IPermissionResult.js";

export interface IPermissionQueryResult extends IPermissionResult {
    tUserId: number;
    tDomain: string;
    tGroupId: number;
    tTokenId: number;
}