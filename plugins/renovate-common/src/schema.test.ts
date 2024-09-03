import { dependency } from './schema';

describe('schema', () => {
  describe('dependency', () => {
    it('should validate a dependency', () => {
      expect(
        dependency.parse({
          depName: 'foo',
          packageName: 'bar',
          depType: 'prod',
          currentValue: '1.0.0',
          currentVersion: '1.0.0',
        }),
      ).toEqual({
        currentValue: '1.0.0',
        currentVersion: '1.0.0',
        depName: 'foo',
        packageName: 'bar',
        depType: 'prod',
      });
    });

    it('should allow additional keys', () => {
      expect(
        dependency.parse({
          depName: 'foo',
          packageName: 'bar',
          depType: 'prod',
          currentValue: '1.0.0',
          currentVersion: '1.0.0',
          foo: 'bar',
        }),
      ).toEqual({
        currentValue: '1.0.0',
        currentVersion: '1.0.0',
        depName: 'foo',
        packageName: 'bar',
        depType: 'prod',
        foo: 'bar',
      });
    });

    it('should not throw if depName and packageName are missing', () => {
      expect(
        dependency.parse({
          depType: 'prod',
          currentValue: '1.0.0',
          currentVersion: '1.0.0',
          skipReason: 'foo',
        }),
      ).toEqual({
        depType: 'prod',
        currentValue: '1.0.0',
        currentVersion: '1.0.0',
        skipReason: 'foo',
      });
    });
  });
});
