import { ISessionAccount } from "./Session/ISessionAccount.ts";

declare module "express-session" {
    interface SessionData {
        accounts: ISessionAccount[];
    }

    interface SessionData {
        authenticateOptions?: { userId: number, account: string, challenge: string };
    }
}
