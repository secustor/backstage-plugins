import { ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { TargetRepo } from './types';
import gitUrlParse, { GitUrl } from 'git-url-parse';
import is from '@sindresorhus/is';
import { EntityWithAnnotations, targetRepo } from './schema';

export function getTaskID(
  target: string | EntityWithAnnotations | TargetRepo,
): string {
  const repo = getTargetRepo(target);
  return `renovate_run_${repo.host}_${repo.repository}`;
}

export function getTargetRepo(
  target: string | EntityWithAnnotations | TargetRepo | null | undefined,
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
  target: string | EntityWithAnnotations | null | undefined,
): GitUrl {
  let rawTargetUrl = is.string(target)
    ? target
    : target?.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION];

  if (rawTargetUrl?.startsWith('url:')) {
    rawTargetUrl = rawTargetUrl.replace('url:', '');
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
