//

// ******************************************************************
// * THIS IS AN AUTOGENERATED FILE. DO NOT EDIT THIS FILE DIRECTLY. *
// ******************************************************************
import { createValidatedOpenApiRouter } from '@backstage/backend-openapi-utils';

export const spec = {
  openapi: '3.0.0',
  info: {
    title: 'renovate',
    description: 'Backstage Renovate API',
    version: '0.1.0',
  },
  servers: [
    {
      description: 'local test setup',
      url: 'http://localhost:7007',
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Get health status of the plugin',
        responses: {
          '200': {
            description: 'health status is green',
            content: {
              'application/json': {
                schema: {
                  type: 'string',
                  example: 'ok',
                },
              },
            },
          },
        },
      },
    },
    '/reports': {
      get: {
        summary: 'Get all reports',
        responses: {
          '200': {
            $ref: '#/components/responses/reports',
          },
        },
      },
      delete: {
        summary: 'Delete reports based on parameters',
        parameters: [
          {
            $ref: '#/components/parameters/keepLatest',
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/deleted-successful',
          },
        },
      },
    },
    '/reports/{host}': {
      get: {
        summary: 'Get reports for host',
        parameters: [
          {
            name: 'host',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              example: 'github.com',
            },
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/reports',
          },
          '404': {
            description: 'unknown host',
          },
        },
      },
      delete: {
        summary: 'Delete reports based on parameters',
        parameters: [
          {
            $ref: '#/components/parameters/keepLatest',
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/deleted-successful',
          },
        },
      },
    },
    '/reports/{host}/{repository}': {
      get: {
        summary: 'Get reports for repository',
        parameters: [
          {
            name: 'host',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              example: 'github.com',
            },
          },
          {
            name: 'repository',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
              example: 'myOrg/myRepository',
            },
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/reports',
          },
          '404': {
            description: 'unknown repository',
          },
        },
      },
      delete: {
        summary: 'Delete reports based on parameters',
        parameters: [
          {
            $ref: '#/components/parameters/keepLatest',
          },
        ],
        responses: {
          '200': {
            $ref: '#/components/responses/deleted-successful',
          },
        },
      },
    },
    '/runs': {
      post: {
        summary: 'Start or get Renovate runs',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['target'],
                properties: {
                  target: {
                    $ref: '#/components/schemas/target',
                  },
                },
              },
            },
          },
        },
        responses: {
          '202': {
            description: 'Run has been scheduled',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    taskID: {
                      description: 'id of the scheduler task',
                      type: 'string',
                      example: '9-d_CO9JlaEmd-OM9QfkI',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Unexpected incoming data',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: {
                      $ref: '#/components/schemas/error',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    parameters: {
      keepLatest: {
        name: 'keepLatest',
        description: 'how many reports of all targets should be kept',
        in: 'query',
        required: false,
        example: 3,
        schema: {
          type: 'number',
        },
      },
    },
    responses: {
      'deleted-successful': {
        description: 'Successful deleted',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                deleted: {
                  type: 'number',
                  example: 15,
                  description: 'Numbers of reports deleted',
                },
              },
            },
          },
        },
      },
      reports: {
        description: 'Returns reports',
        content: {
          'application/json': {
            schema: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: [
                  'taskID',
                  'repository',
                  'host',
                  'timestamp',
                  'report',
                ],
                properties: {
                  taskID: {
                    type: 'string',
                  },
                  timestamp: {
                    type: 'string',
                    format: 'date-time',
                  },
                  host: {
                    type: 'string',
                  },
                  repository: {
                    type: 'string',
                  },
                  report: {
                    $ref: '#/components/schemas/repositoryReport',
                  },
                },
              },
            },
          },
        },
      },
    },
    schemas: {
      error: {
        anyOf: [
          {
            type: 'object',
            example: {
              message: "I'm an error",
              code: 1111,
            },
          },
          {
            type: 'string',
            example: "I'm an error",
          },
        ],
      },
      target: {
        anyOf: [
          {
            type: 'string',
            description: 'URL to an repository',
            example: 'https://github.com/secustor/renovate-test',
          },
          {
            type: 'string',
            description:
              'stringified Entity with SourceLocation URL annotation',
            example: 'component:default/backstage-plugins-example',
          },
          {
            type: 'string',
            description: 'host and path',
            example: 'secustor/backstage-plugins',
          },
        ],
      },
      repositoryReportList: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/repositoryReport',
        },
      },
      repositoryReport: {
        description: 'report for a specific repository',
        type: 'object',
        additionalProperties: false,
        required: ['branches', 'packageFiles', 'problems'],
        properties: {
          branches: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
          packageFiles: {
            type: 'object',
          },
          problems: {
            type: 'array',
            items: {
              type: 'object',
            },
          },
        },
      },
    },
  },
} as const;
export const createOpenApiRouter = async (
  options?: Parameters<typeof createValidatedOpenApiRouter>['1'],
) => createValidatedOpenApiRouter<typeof spec>(spec, options);
