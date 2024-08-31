import { renovateReport } from '@secustor/backstage-plugin-renovate-common';

describe('src/service/schema', () => {
  describe('renovateReport', () => {
    it('should parse full report', () => {
      expect(
        renovateReport.parse({
          problems: [],
          repositories: {
            'secustor/renovate-meetup': {
              problems: [],
              branches: [
                {
                  branchName: 'renovate/npm-lodash-vulnerability',
                  prNo: 18,
                  prTitle:
                    'fix(deps): update dependency lodash to v4.17.21 [security]',
                  result: 'done',
                  upgrades: [
                    {
                      datasource: 'npm',
                      depName: 'lodash',
                      displayPending: '',
                      fixedVersion: '4.10.0',
                      currentVersion: '4.10.0',
                      currentValue: '4.10.0',
                      newValue: '4.17.21',
                      newVersion: '4.17.21',
                      packageFile: 'demos/npm/package.json',
                      updateType: 'minor',
                      packageName: 'lodash',
                    },
                  ],
                },
              ],
              packageFiles: {
                dockerfile: [
                  {
                    deps: [
                      {
                        depName: 'ghcr.io/google/osv-scanner',
                        currentValue: 'v1.3.1',
                        replaceString: 'ghcr.io/google/osv-scanner:v1.3.1',
                        autoReplaceStringTemplate:
                          '{{depName}}{{#if newValue}}:{{newValue}}{{/if}}{{#if newDigest}}@{{newDigest}}{{/if}}',
                        datasource: 'docker',
                        depType: 'stage',
                        updates: [
                          {
                            bucket: 'non-major',
                            newVersion: 'v1.8.4',
                            newValue: 'v1.8.4',
                            newMajor: 1,
                            newMinor: 8,
                            newPatch: 4,
                            updateType: 'minor',
                            branchName:
                              'renovate/ghcr.io-google-osv-scanner-1.x',
                          },
                        ],
                        packageName: 'ghcr.io/google/osv-scanner',
                        versioning: 'docker',
                        warnings: [],
                        sourceUrl: 'https://github.com/google/osv-scanner',
                        registryUrl: 'https://ghcr.io',
                        lookupName: 'google/osv-scanner',
                        currentVersion: 'v1.3.1',
                        isSingleVersion: true,
                        fixedVersion: 'v1.3.1',
                      },
                      {
                        depName: 'node',
                        currentValue: '20-slim',
                        currentDigest:
                          'sha256:80c3e9753fed11eee3021b96497ba95fe15e5a1dfc16aaf5bc66025f369e00dd',
                        replaceString:
                          'node:20-slim@sha256:80c3e9753fed11eee3021b96497ba95fe15e5a1dfc16aaf5bc66025f369e00dd',
                        autoReplaceStringTemplate:
                          '{{depName}}{{#if newValue}}:{{newValue}}{{/if}}{{#if newDigest}}@{{newDigest}}{{/if}}',
                        datasource: 'docker',
                        depType: 'final',
                        updates: [
                          {
                            updateType: 'digest',
                            newValue: '20-slim',
                            newDigest:
                              'sha256:611c19e435e4948c44936582d543f0e2790bfa0d7688a2a21a380fcd83799d7d',
                            branchName: 'renovate/node-20-slim',
                          },
                        ],
                        packageName: 'node',
                        versioning: 'node',
                        warnings: [],
                        sourceUrl: 'https://github.com/nodejs/node',
                        registryUrl: 'https://index.docker.io',
                        lookupName: 'library/node',
                        currentVersion: '20.17.0',
                        currentVersionTimestamp: '2024-08-22T00:40:59.784Z',
                      },
                    ],
                    packageFile: 'demos/docker/Dockerfile',
                  },
                ],
              },
            },
          },
        }),
      ).toEqual({
        problems: [],
        repositories: {
          'secustor/renovate-meetup': {
            branches: [
              {
                branchName: 'renovate/npm-lodash-vulnerability',
                prNo: 18,
                prTitle:
                  'fix(deps): update dependency lodash to v4.17.21 [security]',
                result: 'done',
                upgrades: [
                  {
                    currentValue: '4.10.0',
                    currentVersion: '4.10.0',
                    datasource: 'npm',
                    depName: 'lodash',
                    displayPending: '',
                    fixedVersion: '4.10.0',
                    newValue: '4.17.21',
                    newVersion: '4.17.21',
                    packageFile: 'demos/npm/package.json',
                    packageName: 'lodash',
                    updateType: 'minor',
                  },
                ],
              },
            ],
            packageFiles: {
              dockerfile: [
                {
                  deps: [
                    {
                      autoReplaceStringTemplate:
                        '{{depName}}{{#if newValue}}:{{newValue}}{{/if}}{{#if newDigest}}@{{newDigest}}{{/if}}',
                      currentValue: 'v1.3.1',
                      currentVersion: 'v1.3.1',
                      datasource: 'docker',
                      depName: 'ghcr.io/google/osv-scanner',
                      depType: 'stage',
                      fixedVersion: 'v1.3.1',
                      isSingleVersion: true,
                      lookupName: 'google/osv-scanner',
                      packageName: 'ghcr.io/google/osv-scanner',
                      registryUrl: 'https://ghcr.io',
                      replaceString: 'ghcr.io/google/osv-scanner:v1.3.1',
                      sourceUrl: 'https://github.com/google/osv-scanner',
                      updates: [
                        {
                          branchName: 'renovate/ghcr.io-google-osv-scanner-1.x',
                          bucket: 'non-major',
                          newMajor: 1,
                          newMinor: 8,
                          newPatch: 4,
                          newValue: 'v1.8.4',
                          newVersion: 'v1.8.4',
                          updateType: 'minor',
                        },
                      ],
                      versioning: 'docker',
                      warnings: [],
                    },
                    {
                      autoReplaceStringTemplate:
                        '{{depName}}{{#if newValue}}:{{newValue}}{{/if}}{{#if newDigest}}@{{newDigest}}{{/if}}',
                      currentDigest:
                        'sha256:80c3e9753fed11eee3021b96497ba95fe15e5a1dfc16aaf5bc66025f369e00dd',
                      currentValue: '20-slim',
                      currentVersion: '20.17.0',
                      currentVersionTimestamp: new Date(
                        '2024-08-22T00:40:59.784Z',
                      ),
                      datasource: 'docker',
                      depName: 'node',
                      depType: 'final',
                      lookupName: 'library/node',
                      packageName: 'node',
                      registryUrl: 'https://index.docker.io',
                      replaceString:
                        'node:20-slim@sha256:80c3e9753fed11eee3021b96497ba95fe15e5a1dfc16aaf5bc66025f369e00dd',
                      sourceUrl: 'https://github.com/nodejs/node',
                      updates: [
                        {
                          branchName: 'renovate/node-20-slim',
                          newDigest:
                            'sha256:611c19e435e4948c44936582d543f0e2790bfa0d7688a2a21a380fcd83799d7d',
                          newValue: '20-slim',
                          updateType: 'digest',
                        },
                      ],
                      versioning: 'node',
                      warnings: [],
                    },
                  ],
                  packageFile: 'demos/docker/Dockerfile',
                },
              ],
            },
            problems: [],
          },
        },
      });
    });

    it('should parse dryRun extract report', () => {
      expect(
        renovateReport.parse({
          problems: [],
          repositories: {
            'secustor/renovate-meetup': {
              problems: [],
              branches: [],
              packageFiles: {
                pep621: [
                  {
                    extractedConstraints: {
                      python: '>=3.7',
                    },
                    deps: [
                      {
                        packageName: 'virtualenv',
                        depName: 'virtualenv',
                        datasource: 'pypi',
                        depType: 'project.dependencies',
                        currentValue: '==20.0.0',
                        currentVersion: '20.0.0',
                      },
                      {
                        packageName: 'pyproject-hooks',
                        depName: 'pyproject-hooks',
                        datasource: 'pypi',
                        depType: 'project.dependencies',
                        skipReason: 'unspecified-version',
                      },
                      {
                        packageName: 'unearth',
                        depName: 'unearth',
                        datasource: 'pypi',
                        depType: 'project.dependencies',
                        currentValue: '>=0.9.0',
                      },
                      {
                        packageName: 'tomlkit',
                        depName: 'tomlkit',
                        datasource: 'pypi',
                        depType: 'project.dependencies',
                        currentValue: '>=0.11.1,<1',
                      },
                    ],
                    packageFile: 'demos/python/pyproject.toml',
                  },
                ],
              },
            },
          },
        }),
      ).toEqual({
        problems: [],
        repositories: {
          'secustor/renovate-meetup': {
            branches: [],
            packageFiles: {
              pep621: [
                {
                  deps: [
                    {
                      currentValue: '==20.0.0',
                      currentVersion: '20.0.0',
                      datasource: 'pypi',
                      depName: 'virtualenv',
                      depType: 'project.dependencies',
                      packageName: 'virtualenv',
                    },
                    {
                      datasource: 'pypi',
                      depName: 'pyproject-hooks',
                      depType: 'project.dependencies',
                      packageName: 'pyproject-hooks',
                      skipReason: 'unspecified-version',
                    },
                    {
                      currentValue: '>=0.9.0',
                      datasource: 'pypi',
                      depName: 'unearth',
                      depType: 'project.dependencies',
                      packageName: 'unearth',
                    },
                    {
                      currentValue: '>=0.11.1,<1',
                      datasource: 'pypi',
                      depName: 'tomlkit',
                      depType: 'project.dependencies',
                      packageName: 'tomlkit',
                    },
                  ],
                  extractedConstraints: {
                    python: '>=3.7',
                  },
                  packageFile: 'demos/python/pyproject.toml',
                },
              ],
            },
            problems: [],
          },
        },
      });
    });
  });
});
