import { RedisClientOptions, RedisClientType, RedisModules } from "@redis/client";
import { RedisFunctions, RedisScripts, RespVersions, TypeMapping } from "@redis/client/dist/lib/RESP/types.js";
import { createClient, type RedisDefaultModules } from "redis";
import { loggerPool } from "../../instanceExport.js";
import { Logger } from "../Console/Logger.js";

const logger = loggerPool.getInstance();
logger.setPrefix(Logger.PREFIX.REDIS_CLIENT);

export class RedisClient {
    public pubClient: RedisClientType<RedisDefaultModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>;
    public redisConnectProm: Promise<any>;

    constructor(options?: RedisClientOptions<RedisModules, RedisFunctions, RedisScripts, RespVersions, TypeMapping>) {
        logger.println("Redis client initializing...");
        this.pubClient = createClient(options);
        this.redisConnectProm = Promise.all([this.pubClient.connect()]);
    }
}