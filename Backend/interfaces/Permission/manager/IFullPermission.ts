import { IPermissionQueryResult } from "./IPermissionQueryResult.js";

export interface IPermissionFullResult extends IPermissionQueryResult {
    id?: number;
    rEntryId: number;
}