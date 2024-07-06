import { Update } from '@secustor/backstage-plugin-renovate-common';
import is from '@sindresorhus/is';

export function getBiggestUpdate(updates: Update[]): Update | null {
  if (updates.length === 0) {
    return null;
  }
  return updates.reduce(pickUpdate);
}

function coerceNumber(value: unknown): number {
  if (!is.number(value)) {
    return 0;
  }
  return value;
}

function pickUpdate(a: Update, b: Update): Update {
  const aPrio = getPriority(a.updateType);
  const bPrio = getPriority(b.updateType);
  // if the update type is different, pick the higher update directly
  if (aPrio > bPrio) {
    return a;
  }
  if (aPrio < bPrio) {
    return b;
  }

  const aUpdate = coerceNumber(a?.[`new${a.updateType.toUpperCase()}`]);
  const bUpdate = coerceNumber(b?.[`new${a.updateType.toUpperCase()}`]);
  if (aUpdate > bUpdate) {
    return a;
  }
  if (aUpdate < bUpdate) {
    return b;
  }
  return a;
}

function getPriority(value: string): number {
  switch (value) {
    case 'major':
      return 2;
    case 'minor':
      return 1;
    case 'patch':
      return 0;
    default:
      return -1; // ignore replacement updates and such
  }
}
