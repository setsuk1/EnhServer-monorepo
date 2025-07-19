import { ITokenLocals } from './ITokenLocals.js';
import { IUserRelatedLocals } from './IUserRelatedLocals.js';

export type IWithTokenLocals = IUserRelatedLocals & Partial<ITokenLocals>;
