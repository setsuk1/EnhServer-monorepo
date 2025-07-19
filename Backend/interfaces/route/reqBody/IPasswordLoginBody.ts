import { ILoginBody } from './ILoginBody.js';

export interface IPasswordLoginBody extends ILoginBody {
    password: string;
}
