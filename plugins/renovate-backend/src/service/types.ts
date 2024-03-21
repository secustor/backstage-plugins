import {Config} from "@backstage/config";
import {DatabaseService, LoggerService} from "@backstage/backend-plugin-api";

export interface RouterOptions {
    rootConfig: Config;
    logger: LoggerService;
    database: DatabaseService
}
