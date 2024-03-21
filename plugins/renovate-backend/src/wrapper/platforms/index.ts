import { ScmIntegrations } from '@backstage/integration';
import is from '@sindresorhus/is';
import { TargetRepo } from '../types';
import { Context } from '../../service/types';

/*
    Returns record of Renovate environment variables specific for the platform of targetUrl
 */
export function getPlatformEnvs(
  target: TargetRepo,
  context: Context,
): Record<string, string> {
  const { rootConfig, logger } = context;

  const env: Record<string, string> = {};
  // add Renovate platform and tokens
  const integrations = ScmIntegrations.fromConfig(rootConfig);
  const integration = integrations.byHost(target.host);
  if (is.nullOrUndefined(integration)) {
    throw new Error(`Could not identify platform of target`);
  }

  const errMsg = `Could no integration found for url and '${integration.type}' type for host ${target.host}`;
  switch (integration.type) {
    case 'github':
      env.RENOVATE_PLATFORM = integration.type;
      env.RENOVATE_TOKEN = requireConfigVariable(
        integrations.github.byHost(target.host)?.config.token,
        errMsg,
      );
      env.RENOVATE_REPOSITORIES = target.repository;

      break;
    case 'gitlab':
      env.RENOVATE_PLATFORM = integration.type;
      env.RENOVATE_TOKEN = requireConfigVariable(
        integrations.gitlab.byHost(target.host)?.config.token,
        errMsg,
      );
      env.RENOVATE_REPOSITORIES = target.repository;
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
