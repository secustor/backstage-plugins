import { mockServices } from '@backstage/backend-test-utils';
import { mockDeep } from 'jest-mock-extended';
import { Config } from '@backstage/config';
import { getS3Config } from './config';

describe('S3 config', () => {
  const mockLogger = mockServices.logger.mock();
  const mockConfig = mockDeep<Config>();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getS3Config', () => {
    it('should return valid S3 config with all required fields', () => {
      mockConfig.getString.mockImplementation((key: string) => {
        if (key === 'bucket') return 'test-bucket';
        if (key === 'region') return 'us-east-1';
        if (key === 'key') return 'path/to/report.json';
        throw new Error(`Unknown key: ${key}`);
      });
      mockConfig.getOptionalString.mockReturnValue(undefined);

      const result = getS3Config(mockConfig, mockLogger);

      expect(result).toMatchObject({
        bucket: 'test-bucket',
        region: 'us-east-1',
        key: 'path/to/report.json',
        endpoint: undefined,
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'S3 configuration loaded successfully',
        {
          bucket: 'test-bucket',
          region: 'us-east-1',
          hasEndpoint: false,
        },
      );
    });

    it('should return valid S3 config with custom endpoint', () => {
      mockConfig.getString.mockImplementation((key: string) => {
        if (key === 'bucket') return 'custom-bucket';
        if (key === 'region') return 'eu-west-1';
        if (key === 'key') return 'reports/renovate.json';
        throw new Error(`Unknown key: ${key}`);
      });
      mockConfig.getOptionalString.mockReturnValue('https://minio.example.com');

      const result = getS3Config(mockConfig, mockLogger);

      expect(result).toMatchObject({
        bucket: 'custom-bucket',
        region: 'eu-west-1',
        key: 'reports/renovate.json',
        endpoint: 'https://minio.example.com',
      });
      expect(mockLogger.debug).toHaveBeenCalledWith(
        'S3 configuration loaded successfully',
        {
          bucket: 'custom-bucket',
          region: 'eu-west-1',
          hasEndpoint: true,
        },
      );
    });

    it.each`
      missingField | mockSetup
      ${'bucket'} | ${() =>
  mockConfig.getString.mockImplementation((key: string) => {
    if (key === 'bucket') throw new Error('Missing bucket');
    return 'test-value';
  })}
      ${'region'} | ${() =>
  mockConfig.getString.mockImplementation((key: string) => {
    if (key === 'region') throw new Error('Missing region');
    return 'test-value';
  })}
      ${'key'} | ${() =>
  mockConfig.getString.mockImplementation((key: string) => {
    if (key === 'key') throw new Error('Missing key');
    return 'test-value';
  })}
    `('should throw error when $missingField is missing', ({ mockSetup }) => {
      // Override the specific field to throw
      mockSetup();
      mockConfig.getOptionalString.mockReturnValue(undefined);

      expect(() => getS3Config(mockConfig, mockLogger)).toThrow(
        /Invalid S3 configuration.*Required fields: bucket, region, key/,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringMatching(
          /Invalid S3 configuration.*Required fields: bucket, region, key/,
        ),
      );
    });

    it('should handle non-Error exceptions', () => {
      mockConfig.getString.mockImplementation(() => {
        throw new Error('String error');
      });

      expect(() => getS3Config(mockConfig, mockLogger)).toThrow(
        'Invalid S3 configuration: String error. Required fields: bucket, region, key',
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Invalid S3 configuration: String error. Required fields: bucket, region, key',
      );
    });

    it('should handle empty string values', () => {
      mockConfig.getString.mockImplementation((key: string) => {
        if (key === 'bucket') return '';
        if (key === 'region') return 'us-east-1';
        if (key === 'key') return 'path/to/report.json';
        throw new Error(`Unknown key: ${key}`);
      });
      mockConfig.getOptionalString.mockReturnValue(undefined);

      const result = getS3Config(mockConfig, mockLogger);

      expect(result.bucket).toBe('');
      expect(mockLogger.debug).toHaveBeenCalled();
    });
  });
});
