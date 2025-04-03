import { renovatePlugin } from './plugin.ts';

describe('renovate', () => {
  it('should export plugin', () => {
    expect(renovatePlugin).toBeDefined();
  });
});
