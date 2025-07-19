import { IVarTablePermission } from "./IVarTablePermission.js";

export interface IVarTableSetValue extends IVarTablePermission {
    key: string;
    value: any;
}