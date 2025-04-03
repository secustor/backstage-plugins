import { renovatePlugin } from './plugin.tsx';

describe('renovate', () => {
  it('should export plugin', () => {
    expect(renovatePlugin).toBeDefined();
  });
});
