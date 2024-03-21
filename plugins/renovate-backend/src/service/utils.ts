import GitUrlParse, { GitUrl } from 'git-url-parse';
import is from '@sindresorhus/is';
import { ANNOTATION_SOURCE_LOCATION } from '@backstage/catalog-model';
import { EntityWithAnnotations } from './schema';

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
): GitUrlParse.GitUrl | null {
  if (!url) {
    return null;
  }

  try {
    return GitUrlParse(url);
  } catch (err) {
    return null;
  }
}

export function getTargetURL(
  target: string | EntityWithAnnotations | null | undefined,
): GitUrl {
  const rawTargetUrl = is.string(target)
    ? target
    : target?.metadata.annotations?.[ANNOTATION_SOURCE_LOCATION];
  const targetUrl = parseGitUrl(rawTargetUrl);
  if (is.nullOrUndefined(targetUrl)) {
    throw new Error(
      `Could not identify platform url via ${JSON.stringify(target)}`,
    );
  }
  return targetUrl;
}
