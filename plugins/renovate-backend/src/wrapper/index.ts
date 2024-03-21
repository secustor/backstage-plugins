/***/
/**
 * Node.js library for the renovate-wrapper plugin.
 *
 * @packageDocumentation
 */

import {ANNOTATION_SOURCE_LOCATION} from '@backstage/catalog-model';
import is from '@sindresorhus/is';
import {ScmIntegrations} from '@backstage/integration';
import {Context, Report} from '../types';
import {EntityWithAnnotations} from '../service/schema';
import {api} from './runtimes';
import GitUrlParse from 'git-url-parse'
/**
 * Renovates a repository and returns the report for this run
 *
 * @public
 */
export async function renovateRepository(
    target: string | EntityWithAnnotations,
    ctx: Context,
): Promise<Report> {
    const {rootConfig, runtime = 'direct'} = ctx;
    // get URL as string or source location URL
    const targetUrl = is.string(target)
        ? target
        : target.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION];
    if (is.nullOrUndefined(targetUrl)) {
        throw new Error(
            `Could not identify platform url via ${JSON.stringify(target)}`,
        );
    }

    const wrapperRuntime = api.get(runtime);
    if (is.nullOrUndefined(wrapperRuntime)) {
        throw new Error(`Unknown runtime type '${runtime}'`);
    }

    const env: Record<string, string> = {
        // setup logging
        LOG_FORMAT: 'json',
        LOG_LEVEL: 'debug',
        LOG_CONTEXT: ctx.runID,
        RENOVATE_REPORT_TYPE: 'logging',
        // setup platform specifics
        ...getPlatformEnvs(targetUrl, ctx),
    };

    // read out renovate.config and write out to json file for consumption by Renovate
    const renovateConfig = rootConfig.getOptional('config') ?? {};
    const runLogger = ctx.logger.child({runID: ctx.runID, })
    runLogger.info("starting wrapper")
    const child = await wrapperRuntime.run({logger: runLogger, env, renovateConfig});
    runLogger.info("finished wrapper")

    return new Promise((resolve) => {
        let uncompleteText = ""
        child.stdout?.on('data', (chunk: Buffer) => {
            const text = uncompleteText.concat(chunk.toString())
            const logLines = text.split('\n')

            // if the last element is an empty string, then we have a complete json line so we reset it.
            // else we save it to
            uncompleteText = logLines.pop() ?? ""

            for (const logLine of logLines) {
                const log = JSON.parse(logLine)
                if (log.report) {
                    // TODO use schema and reject if report does not fit expectation
                    const report = log.report as Report
                    // do not forward the report to logging
                    resolve(report)
                }
                const msg = log.msg
                delete log.msg
                // delete logContext as it is the same as runID
                delete log.logContext
                runLogger.debug(msg, log)
            }
        })
    });

    const databaseClient = await ctx.database.getClient()
    promise.then(async (value) => {
        databaseClient.insert({
            time: Date.now(),
            runID: ctx.runID,
            // TODO replace with dynamic values
            host: "github.com",
            repository: "secustor/renovate-meetup",
            report: value
        }).into('reports')

    })

    return promise
}

/*
    Returns record of Renovate environment variables specific for the platform of targetUrl
 */
function getPlatformEnvs(
    targetUrl: string,
    {rootConfig, logger}: Context,
): Record<string, string> {
    const env: Record<string, string> = {};
    // add Renovate platform and tokens
    const integrations = ScmIntegrations.fromConfig(rootConfig);
    const integration = integrations.byUrl(targetUrl);
    if (is.nullOrUndefined(integration)) {
        throw new Error(`Could not identify platform of target`);
    }

    const parsed = GitUrlParse(targetUrl)
    const errMsg = `Could no integration found for url and '${integration.type}' type ${targetUrl}`;
    switch (integration.type) {
        case 'github':
            env.RENOVATE_PLATFORM = integration.type;
            env.RENOVATE_TOKEN = requireConfigVariable(
                integrations.github.byUrl(targetUrl)?.config.token,
                errMsg,
            );
            env.RENOVATE_REPOSITORIES = parsed.full_name

            break;
        case 'gitlab':
            env.RENOVATE_PLATFORM = integration.type;
            env.RENOVATE_TOKEN = requireConfigVariable(
                integrations.gitlab.byUrl(targetUrl)?.config.token,
                errMsg,
            );
            env.RENOVATE_REPOSITORIES = parsed.full_name
            break;
        default:
            throw new Error(`Unsupported platform type ${integration.type}`);
    }

    const githubComIntegration = integrations.github.byHost('github.com');
    if (is.nullOrUndefined(githubComIntegration)) {
        logger.warn(`No Github.com integration has been found`);
    } else {
        env.RENOVATE_GITHUB_COM = requireConfigVariable(
            integrations.github.byHost('github.com')?.config.token,
            'Could not get token for Github.com token in the defined integration',
        );
    }

    return env;
}

function requireConfigVariable(
    input: string | undefined | null,
    errMessage: string,
): string {
    if (is.nullOrUndefined(input)) {
        throw new Error(errMessage);
    }
    return input;
}
