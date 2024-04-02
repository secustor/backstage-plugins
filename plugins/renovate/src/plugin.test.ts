import { renovatePlugin } from './plugin';

describe('renovate', () => {
  it('should export plugin', () => {
    expect(renovatePlugin).toBeDefined();
  });
});
