import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ReportDto, ReportSummaryDto, ReportMetadataDto } from './report.dto';
import { TestResultDto } from './test-result.dto';

describe('Report DTOs', () => {
  describe('ReportSummaryDto', () => {
    it('should create a valid report summary', async () => {
      const dto = plainToClass(ReportSummaryDto, {
        totalTests: 101,
        successfulTests: 85,
        failedTests: 16,
        vulnerabilitiesFound: 3,
        integrityIssues: 1,
        averageResponseTime: 145.5
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.totalTests).toBe(101);
      expect(dto.successfulTests).toBe(85);
      expect(dto.failedTests).toBe(16);
      expect(dto.vulnerabilitiesFound).toBe(3);
      expect(dto.integrityIssues).toBe(1);
      expect(dto.averageResponseTime).toBe(145.5);
    });

    it('should reject negative values', async () => {
      const dto = plainToClass(ReportSummaryDto, {
        totalTests: -1,
        successfulTests: -5,
        failedTests: 16,
        vulnerabilitiesFound: 3,
        integrityIssues: 1,
        averageResponseTime: -10
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(3); // totalTests, successfulTests, averageResponseTime
      expect(errors.some(e => e.property === 'totalTests')).toBe(true);
      expect(errors.some(e => e.property === 'successfulTests')).toBe(true);
      expect(errors.some(e => e.property === 'averageResponseTime')).toBe(true);
    });

    it('should accept zero values', async () => {
      const dto = plainToClass(ReportSummaryDto, {
        totalTests: 0,
        successfulTests: 0,
        failedTests: 0,
        vulnerabilitiesFound: 0,
        integrityIssues: 0,
        averageResponseTime: 0
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should require all fields', async () => {
      const dto = plainToClass(ReportSummaryDto, {
        totalTests: 10
        // Missing other required fields
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ReportMetadataDto', () => {
    it('should create valid report metadata', async () => {
      const dto = plainToClass(ReportMetadataDto, {
        targetUrl: 'https://api.example.com/users',
        executionDate: '2023-12-01T10:00:00.000Z',
        duration: 330000
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.targetUrl).toBe('https://api.example.com/users');
      expect(dto.executionDate).toBeInstanceOf(Date);
      expect(dto.duration).toBe(330000);
    });

    it('should reject negative duration', async () => {
      const dto = plainToClass(ReportMetadataDto, {
        targetUrl: 'https://api.example.com/users',
        executionDate: '2023-12-01T10:00:00.000Z',
        duration: -1000
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('duration');
    });

    it('should accept zero duration', async () => {
      const dto = plainToClass(ReportMetadataDto, {
        targetUrl: 'https://api.example.com/users',
        executionDate: '2023-12-01T10:00:00.000Z',
        duration: 0
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should require all fields', async () => {
      const dto = plainToClass(ReportMetadataDto, {
        targetUrl: 'https://api.example.com/users'
        // Missing executionDate and duration
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('ReportDto', () => {
    const createValidTestResult = (overrides = {}): any => ({
      id: '123e4567-e89b-12d3-a456-426614174001',
      mutationId: 'mut-001',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 120,
      responseBody: { success: true },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z',
      ...overrides
    });

    const createValidHappyPathResult = (): any => 
      createValidTestResult({
        mutationId: null,
        isHappyPath: true
      });

    it('should create a valid report', async () => {
      const dto = plainToClass(ReportDto, {
        testId: '123e4567-e89b-12d3-a456-426614174000',
        summary: {
          totalTests: 101,
          successfulTests: 85,
          failedTests: 16,
          vulnerabilitiesFound: 3,
          integrityIssues: 1,
          averageResponseTime: 145.5
        },
        happyPathResult: createValidHappyPathResult(),
        mutationResults: [
          createValidTestResult({ id: 'result-1' }),
          createValidTestResult({ id: 'result-2' })
        ],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: '2023-12-01T10:00:00.000Z',
          duration: 330000
        }
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.testId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(dto.summary).toBeInstanceOf(ReportSummaryDto);
      expect(dto.happyPathResult).toBeInstanceOf(TestResultDto);
      expect(dto.mutationResults).toHaveLength(2);
      expect(dto.mutationResults[0]).toBeInstanceOf(TestResultDto);
      expect(dto.metadata).toBeInstanceOf(ReportMetadataDto);
    });

    it('should validate nested objects', async () => {
      const dto = plainToClass(ReportDto, {
        testId: '123e4567-e89b-12d3-a456-426614174000',
        summary: {
          totalTests: -1, // Invalid
          successfulTests: 85,
          failedTests: 16,
          vulnerabilitiesFound: 3,
          integrityIssues: 1,
          averageResponseTime: 145.5
        },
        happyPathResult: createValidHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: '2023-12-01T10:00:00.000Z',
          duration: -1000 // Invalid
        }
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      // Should have validation errors for nested objects
    });

    it('should accept empty mutation results', async () => {
      const dto = plainToClass(ReportDto, {
        testId: '123e4567-e89b-12d3-a456-426614174000',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100
        },
        happyPathResult: createValidHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: '2023-12-01T10:00:00.000Z',
          duration: 1000
        }
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.mutationResults).toHaveLength(0);
    });

    it('should require all fields', async () => {
      const dto = plainToClass(ReportDto, {
        testId: '123e4567-e89b-12d3-a456-426614174000'
        // Missing other required fields
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});