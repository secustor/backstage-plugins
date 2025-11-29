import {
  RenovateRunOptions,
  RenovateRunResult,
  RenovateWrapper,
  RenovateReport,
} from '@secustor/backstage-plugin-renovate-common';
import { LoggerService } from '@backstage/backend-plugin-api';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { getS3Config, S3Config } from './config';

class ReportReader {
  private readonly s3Client: S3Client;

  constructor(
    private readonly logger: LoggerService,
    private readonly config: S3Config,
  ) {
    const clientConfig = {
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      ...(config.endpoint && { endpoint: config.endpoint }),
    };

    this.s3Client = new S3Client(clientConfig);
    this.logger.debug('Initialized S3 client', {
      bucket: config.bucket,
      region: config.region,
      forcePathStyle: config.forcePathStyle,
      usingEndpoint: !!config.endpoint,
    });
  }

  async readReport(): Promise<RenovateReport> {
    const objectKey = this.config.key;
    if (!objectKey) {
      throw new Error('S3 key is required');
    }
    this.logger.debug(
      `Reading report from S3: ${this.config.bucket}/${objectKey}`,
    );

    try {
      const response = await this.s3Client.send(
        new GetObjectCommand({
          Bucket: this.config.bucket,
          Key: objectKey,
        }),
      );

      if (!response.Body) {
        throw new Error('Empty response from S3');
      }

      const fileContent = await response.Body.transformToString();
      return this.parseReport(fileContent, objectKey);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.warn(`Error reading report from S3: ${errorMessage}`);
      throw error;
    }
  }

  private parseReport(fileContent: string, key: string): RenovateReport {
    try {
      const report = JSON.parse(fileContent);
      return {
        problems: report.problems || [],
        repositories: Object.fromEntries(
          Object.entries(report.repositories || {}).map(
            ([repoKey, value]: [string, any]) => [
              repoKey,
              {
                problems: value?.problems || [],
                branches: value?.branches || [],
                packageFiles: value?.packageFiles || {},
                libYears: value?.libYears,
              },
            ],
          ),
        ),
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Invalid JSON in ${key}: ${errorMessage}`);
      throw new Error(`Invalid JSON in renovate report: ${errorMessage}`);
    }
  }
}

class ReportFormatter {
  static formatResponse(
    targetRepo: string,
    data?: unknown,
    error?: string,
  ): RenovateRunResult {
    const response = {
      msg: error
        ? `Error reading report: ${error}`
        : 'Renovate report extracted from file',
      logContext: targetRepo || 'unknown',
      report: {
        problems: [],
        repositories: data
          ? {
              [targetRepo]: {
                problems: (data as any)?.problems || [],
                branches: (data as any)?.branches || [],
                packageFiles: (data as any)?.packageFiles || {},
                libYears: (data as any)?.libYears,
              },
            }
          : {},
      },
    };
    return {
      stdout: Readable.from(`${JSON.stringify(response)}\n`),
    };
  }
}

export class S3 implements RenovateWrapper {
  async run({
    runtimeConfig,
    env,
    logger,
  }: RenovateRunOptions): Promise<RenovateRunResult> {
    if (!runtimeConfig) {
      throw new Error('S3 runtime configuration is required');
    }

    const config = getS3Config(runtimeConfig, logger);
    const targetRepo = env.RENOVATE_REPOSITORIES;
    logger.debug(`Target repository: ${targetRepo}`);

    try {
      const reader = new ReportReader(logger, config);
      const report = await reader.readReport();
      const repositoryData = report.repositories[targetRepo];

      if (!repositoryData) {
        logger.warn(`No data found for repository: ${targetRepo}`);
        return ReportFormatter.formatResponse(
          targetRepo,
          undefined,
          'no report found for this repository',
        );
      }

      logger.debug(`Found data for repository: ${targetRepo}`);
      return ReportFormatter.formatResponse(targetRepo, repositoryData);
    } catch (error) {
      return ReportFormatter.formatResponse(
        targetRepo,
        undefined,
        String(error),
      );
    }
  }
}
