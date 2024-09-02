import {
  DefaultGitlabCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import is from '@sindresorhus/is';
import { PlatformEnvsOptions } from './types';
import { TargetRepo } from '@secustor/backstage-plugin-renovate-common';
import { getGithubToken } from './github';

/*
    Returns record of Renovate environment variables specific for the platform of targetUrl
 */
export async function getPlatformEnvs(
  target: TargetRepo,
  context: PlatformEnvsOptions,
): Promise<Record<string, string>> {
  const { rootConfig, logger } = context;

  const env: Record<string, string> = {};
  // add Renovate platform and tokens
  const integrations = ScmIntegrations.fromConfig(rootConfig);
  const integration = integrations.byHost(target.host);
  if (is.nullOrUndefined(integration)) {
    throw new Error(
      `Could not identify platform for target ${target.host}/${target.repository}`,
    );
  }

  const errMsg = `No credentials could be found for url and '${integration.type}' type for host ${target.host}`;
  const url = `https://${target.host}/${target.repository}`;
  switch (integration.type) {
    case 'github': {
      env.RENOVATE_PLATFORM = integration.type;
      const token = await getGithubToken(integrations, url);
      env.RENOVATE_TOKEN = requireConfigVariable(token, errMsg);
      env.RENOVATE_REPOSITORIES = target.repository;
      break;
    }
    case 'gitlab':
      {
        const cred = await DefaultGitlabCredentialsProvider.fromIntegrations(
          integrations,
        ).getCredentials({ url });
        const gitLabIntegrationConfig = requireConfigVariable(
          integrations.gitlab.byHost(target.host)?.config,
          errMsg,
        );
        env.RENOVATE_PLATFORM = integration.type;
        env.RENOVATE_ENDPOINT =
          gitLabIntegrationConfig.apiBaseUrl ?? `https://${target.host}/api/v4`;
        env.RENOVATE_TOKEN = requireConfigVariable(cred.token, errMsg);
        env.RENOVATE_REPOSITORIES = target.repository;
      }
      break;
    default:
      throw new Error(`Unsupported platform type ${integration.type}`);
  }

  const githubComURL = 'https://github.com';
  const githubComIntegration = integrations.github.byUrl(githubComURL);
  if (is.nullOrUndefined(githubComIntegration)) {
    logger.warn(`No Github.com integration has been found`);
  } else {
    const githubComToken = await getGithubToken(integrations, githubComURL);
    if (githubComToken) {
      env.RENOVATE_GITHUB_COM = githubComToken;
    } else {
      logger.warn(
        `Could not get token for Github.com token in the defined integrations`,
      );
    }
  }

  return env;
}

function requireConfigVariable<T>(
  input: T | undefined | null,
  errMessage: string,
): T {
  if (is.nullOrUndefined(input)) {
    throw new Error(errMessage);
  }
  return input;
}

export function getFileUrl(options: {
  packageFile: string;
  host: string;
  repository: string;
}): string | null {
  if (options.host.includes('github')) {
    return `https://${options.host}/${options.repository}/blob/HEAD/${options.packageFile}`;
  }
  return null;
}
