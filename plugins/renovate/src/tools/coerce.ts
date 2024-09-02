export function coerceFilter(filter: string | string[] | undefined) {
  if (typeof filter === 'string') {
    return [filter];
  }
  return filter;
}
