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
