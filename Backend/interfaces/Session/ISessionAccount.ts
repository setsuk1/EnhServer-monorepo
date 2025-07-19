export interface ISessionAccount {
    id: number;
    account: string;
    isLoggedIn: boolean;

    registerChallenge?: string;
}
