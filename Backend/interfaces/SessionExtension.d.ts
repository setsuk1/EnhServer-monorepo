import type { ISessionAccount } from "./Session/ISessionAccount.ts";

declare module "express-session" {
    interface SessionData {
        account?: ISessionAccount[];
        currentAccount?: number
    }

    interface SessionData {
        registerChallenge?: string;
        authenticateChallenge?: string;
        authenticateOptions: {acc: string};
    }
}