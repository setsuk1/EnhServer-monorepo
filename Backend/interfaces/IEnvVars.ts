export interface IEnvVars {
    DB_ADDR?: string;
    DB_PORT?: number;
    DB_NAME?: string;
    DB_USER?: string;
    DB_USER_PWD?: string;

    SOCKET_PATH?: string
    SRV_ADDR?: string
    PORT?: number;

    RP_NAME?: string;
    RP_ID?: string;
    PROTOCOL?: string;
    ORIGIN?(): string;

    JWT_SECRET?: string;
}