/**
 * Extracts the directory portion from a file path.
 * For files at root (no '/'), returns undefined.
 * For files in subdirectories, returns the directory path.
 *
 * @example
 * getDirectoryFromPath('catalog.yaml') // undefined
 * getDirectoryFromPath('subdir/catalog.yaml') // 'subdir'
 * getDirectoryFromPath('a/b/c/file.yaml') // 'a/b/c'
 * getDirectoryFromPath('') // undefined
 * getDirectoryFromPath(undefined) // undefined
 */
export function getDirectoryFromPath(
  filepath: string | undefined,
): string | undefined {
  if (!filepath || !filepath.includes('/')) {
    return undefined;
  }
  return filepath.substring(0, filepath.lastIndexOf('/'));
}
