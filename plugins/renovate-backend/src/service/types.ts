import {Config} from "@backstage/config";
import {LoggerService} from "@backstage/backend-plugin-api";

export interface RouterOptions {
    rootConfig: Config;
    logger: LoggerService;
}
