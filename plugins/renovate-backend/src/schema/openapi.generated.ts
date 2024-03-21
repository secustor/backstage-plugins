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
                },
              },
            },
          },
        },
      },
    },
    '/reports': {
      get: {
        summary: 'Get reports for repositories',
        responses: {
          '200': {
            description: 'Returns reports',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
      },
    },
    '/runs': {
      post: {
        summary: 'Schedule a Renovate run for a specific repository or entity',
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
                  callBackURL: {
                    type: 'string',
                    example: 'https://localhost:8080/my-webhook-endpoint',
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
                    runID: {
                      description: 'unique ID for the run',
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
            type: 'object',
            description: 'Entity with SourceLocation URL annotation',
            properties: {
              metadata: {
                type: 'object',
                properties: {
                  annotations: {
                    type: 'object',
                    required: ['backstage.io/source-location'],
                    properties: {
                      'backstage.io/source-location': {
                        type: 'string',
                        example:
                          'https://github.com/secustor/renovate-meetup/blob/master/renovate.json',
                      },
                    },
                  },
                },
              },
            },
          },
        ],
      },
    },
  },
} as const;
export const createOpenApiRouter = async (
  options?: Parameters<typeof createValidatedOpenApiRouter>['1'],
) => createValidatedOpenApiRouter<typeof spec>(spec, options);
