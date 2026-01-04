import { Entity } from '@backstage/catalog-model';
import {
  getTaskID,
  getTargetRepo,
  getTargetRepoSafe,
  parseUrl,
  parseGitUrl,
  isEntityRef,
} from './utils';
import { TargetRepo } from './types';

describe('utils', () => {
  describe('parseUrl', () => {
    it.each`
      input
      ${'https://github.com/owner/repo'}
      ${'http://example.com'}
      ${'not://a/valid/protocol'}
    `('should parse valid URL "$input"', ({ input }) => {
      const result = parseUrl(input);
      expect(result).toBeInstanceOf(URL);
      expect(result?.href).toContain(input);
    });

    it.each`
      input
      ${''}
      ${null}
      ${undefined}
      ${'invalid-url'}
    `('should return null for invalid URL "$input"', ({ input }) => {
      const result = parseUrl(input);
      expect(result).toBeNull();
    });
  });

  describe('parseGitUrl', () => {
    it.each`
      input                              | expectedResource | expectedFullName
      ${'https://github.com/owner/repo'} | ${'github.com'}  | ${'owner/repo'}
      ${'git@github.com:owner/repo.git'} | ${'github.com'}  | ${'owner/repo'}
    `(
      'should parse valid git URL "$input"',
      ({ input, expectedResource, expectedFullName }) => {
        const result = parseGitUrl(input);
        expect(result).toMatchObject({
          resource: expectedResource,
          full_name: expectedFullName,
        });
      },
    );

    it.each`
      input
      ${''}
      ${null}
      ${undefined}
    `('should return null for invalid git URL "$input"', ({ input }) => {
      const result = parseGitUrl(input);
      expect(result).toBeNull();
    });
  });

  describe('isEntityRef', () => {
    it.each`
      input                       | expected
      ${'component:default/test'} | ${true}
      ${'user:default/john'}      | ${true}
      ${'group:default/team-a'}   | ${true}
      ${'invalid-ref'}            | ${false}
      ${''}                       | ${false}
      ${'component:'}             | ${false}
      ${':default/test'}          | ${false}
    `(
      'should validate entity ref "$input" as $expected',
      ({ input, expected }) => {
        expect(isEntityRef(input)).toBe(expected);
      },
    );
  });

  describe('getTargetRepo', () => {
    it('should return TargetRepo when input is already TargetRepo', () => {
      const targetRepo: TargetRepo = {
        host: 'github.com',
        repository: 'owner/repo',
      };

      expect(getTargetRepo(targetRepo)).toEqual(targetRepo);
    });

    it('should extract repo from string URL', () => {
      const result = getTargetRepo('https://github.com/owner/repo');

      expect(result).toMatchObject({
        host: 'github.com',
        repository: 'owner/repo',
      });
    });

    it('should extract repo from string URL without protocol', () => {
      const result = getTargetRepo('github.com/owner/repo');

      expect(result).toMatchObject({
        host: 'github.com',
        repository: 'owner/repo',
      });
    });

    it('should extract ADO repo format', () => {
      const result = getTargetRepo('dev.azure.com/project/_git/repo');

      expect(result).toMatchObject({
        host: 'dev.azure.com',
        repository: 'project/repo',
      });
    });

    it('should extract repo from Entity with source location annotation', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test',
          annotations: {
            'backstage.io/source-location': 'url:https://github.com/owner/repo',
          },
        },
      };

      const result = getTargetRepo(entity);

      expect(result).toMatchObject({
        host: 'github.com',
        repository: 'owner/repo',
      });
    });

    it('should handle Entity with source location without url: prefix', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test',
          annotations: {
            'backstage.io/source-location': 'https://github.com/owner/repo',
          },
        },
      };

      const result = getTargetRepo(entity);

      expect(result).toMatchObject({
        host: 'github.com',
        repository: 'owner/repo',
      });
    });

    it('should handle strings that git-url-parse accepts', () => {
      // git-url-parse is quite permissive, so test with what actually throws
      const result = getTargetRepo('invalid-url');

      expect(result).toMatchObject({
        host: 'invalid-url',
        repository: '',
      });
    });

    it('should handle Entity without source location', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test',
        },
      };

      // git-url-parse accepts undefined and creates a result with host "undefined"
      const result = getTargetRepo(entity);
      expect(result).toMatchObject({
        host: 'undefined',
        repository: '',
      });
    });
  });

  describe('getTargetRepoSafe', () => {
    it('should return TargetRepo for valid input', () => {
      const result = getTargetRepoSafe('https://github.com/owner/repo');

      expect(result).toMatchObject({
        host: 'github.com',
        repository: 'owner/repo',
      });
    });

    it('should return TargetRepo for git-url-parse accepted input', () => {
      const result = getTargetRepoSafe('invalid-url');

      expect(result).toMatchObject({
        host: 'invalid-url',
        repository: '',
      });
    });

    it('should handle entities same as getTargetRepo', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test',
        },
      };

      // getTargetRepoSafe wraps getTargetRepo in try-catch, but getTargetRepo doesn't throw for this case
      expect(getTargetRepoSafe(entity)).toMatchObject({
        host: 'undefined',
        repository: '',
      });
    });

    it('should handle null and undefined input gracefully', () => {
      expect(getTargetRepoSafe(null)).toMatchObject({
        host: 'undefined',
        repository: '',
      });
      expect(getTargetRepoSafe(undefined)).toMatchObject({
        host: 'undefined',
        repository: '',
      });
    });
  });

  describe('getTaskID', () => {
    it('should generate task ID from string URL', () => {
      const result = getTaskID('https://github.com/owner/repo');

      expect(result).toBe('renovate_run_github.com_owner/repo');
    });

    it('should generate task ID from TargetRepo', () => {
      const targetRepo: TargetRepo = {
        host: 'gitlab.com',
        repository: 'group/project',
      };

      const result = getTaskID(targetRepo);

      expect(result).toBe('renovate_run_gitlab.com_group/project');
    });

    it('should generate task ID from Entity', () => {
      const entity: Entity = {
        apiVersion: 'backstage.io/v1alpha1',
        kind: 'Component',
        metadata: {
          name: 'test',
          annotations: {
            'backstage.io/source-location':
              'https://bitbucket.org/team/service',
          },
        },
      };

      const result = getTaskID(entity);

      expect(result).toBe('renovate_run_bitbucket.org_team/service');
    });
  });
});
