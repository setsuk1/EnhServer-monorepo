export interface IEnvVars {
    DB_ADDR?: string;
    DB_PORT?: number;
    DB_NAME?: string;
    DB_USER?: string;
    DB_USER_PWD?: string;

    SOCKET_PATH?: string
    SRV_ADDR?: string
    SRV_PORT?: number;
    SESSION_SECRET?: string;

    RP_NAME?: string;
    RP_ID?: string;
    PROTOCOL?: string;

    JWT_SECRET?: string;

    JWT_ISSUER?: string;
    JWT_AUDIENCE?: string;
    REDIS_ADDRESS?: string;
    REDIS_PORT?: number;

    LOG_LEVEL?: number;
}