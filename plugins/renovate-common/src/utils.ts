import {
  ANNOTATION_SOURCE_LOCATION,
  Entity,
  parseEntityRef,
} from '@backstage/catalog-model';
import { TargetRepo } from './types';
import gitUrlParse, { GitUrl } from 'git-url-parse';
import is from '@sindresorhus/is';
import { targetRepo } from './schema';

export function getTaskID(target: string | Entity | TargetRepo): string {
  const repo = getTargetRepo(target);
  return `renovate_run_${repo.host}_${repo.repository}`;
}

export function getTargetRepo(
  target: string | Entity | TargetRepo | null | undefined,
): TargetRepo {
  if (isTargetRepo(target)) {
    return target;
  }
  const url = getTargetURL(target);
  return {
    host: url.resource,
    repository: url.full_name,
  };
}

export function getTargetRepoSafe(
  target: string | Entity | TargetRepo | null | undefined,
): TargetRepo | null {
  try {
    return getTargetRepo(target);
  } catch (e) {
    return null;
  }
}

export function parseUrl(url: string | undefined | null): URL | null {
  if (!url) {
    return null;
  }

  try {
    return new URL(url);
  } catch (err) {
    return null;
  }
}

export function parseGitUrl(
  url: string | undefined | null,
): gitUrlParse.GitUrl | null {
  if (!url) {
    return null;
  }

  try {
    return gitUrlParse(url);
  } catch (err) {
    return null;
  }
}

export function getTargetURL(
  target: string | Entity | null | undefined,
): GitUrl {
  let rawTargetUrl = is.string(target)
    ? target
    : target?.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION];

  if (rawTargetUrl?.startsWith('url:')) {
    rawTargetUrl = rawTargetUrl.replace('url:', '');
  }

  if (!rawTargetUrl?.includes('://')) {
    rawTargetUrl = `https://${rawTargetUrl}`;
  }

  const targetUrl = parseGitUrl(rawTargetUrl);
  if (is.nullOrUndefined(targetUrl)) {
    throw new Error(
      `Could not identify platform url via ${JSON.stringify(target)}`,
    );
  }
  return targetUrl;
}

function isTargetRepo(value: unknown): value is TargetRepo {
  return targetRepo.safeParse(value).success;
}

// TODO replace with https://github.com/backstage/backstage/pull/24066 when it lands
export function isEntityRef(ref: string): boolean {
  try {
    parseEntityRef(ref);
    return true;
  } catch (e) {
    return false;
  }
}
