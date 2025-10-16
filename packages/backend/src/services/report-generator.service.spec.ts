import { Test, TestingModule } from '@nestjs/testing';
import { ReportGeneratorService } from './report-generator.service';
import { TestConfig, TestResult, Report, HttpMethod } from '@api-mutation-tester/shared';

describe('ReportGeneratorService', () => {
  let service: ReportGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReportGeneratorService],
    }).compile();

    service = module.get<ReportGeneratorService>(ReportGeneratorService);
  });

  const createMockTestConfig = (): TestConfig => ({
    id: 'test-123',
    url: 'https://api.example.com/users',
    method: HttpMethod.POST,
    headers: { 'Content-Type': 'application/json' },
    payload: { name: 'John', email: 'john@example.com' },
    timeout: 30000,
    createdAt: new Date('2023-12-01T10:00:00Z'),
  });

  const createMockHappyPathResult = (): TestResult => ({
    id: 'result-happy',
    isHappyPath: true,
    statusCode: 201,
    responseTime: 150,
    responseBody: { id: 1, name: 'John', email: 'john@example.com' },
    vulnerabilityDetected: false,
    integrityIssue: false,
    timestamp: new Date('2023-12-01T10:00:30Z'),
  });

  const createMockMutationResults = (): TestResult[] => [
    {
      id: 'result-1',
      mutationId: 'mut-1',
      isHappyPath: false,
      statusCode: 400,
      responseTime: 120,
      responseBody: { error: 'Invalid input' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date('2023-12-01T10:01:00Z'),
    },
    {
      id: 'result-2',
      mutationId: 'mut-2',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 180,
      responseBody: { success: true },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date('2023-12-01T10:01:30Z'),
    },
    {
      id: 'result-3',
      mutationId: 'mut-3',
      isHappyPath: false,
      statusCode: 500,
      responseTime: 5000,
      responseBody: null,
      error: 'Internal server error',
      vulnerabilityDetected: false,
      integrityIssue: true,
      timestamp: new Date('2023-12-01T10:02:00Z'),
    },
  ];

  describe('generateReport', () => {
    it('should generate a complete report', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults = createMockMutationResults();
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:05:00Z');

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.testId).toBe(testId);
      expect(report.happyPathResult).toEqual(happyPathResult);
      expect(report.mutationResults).toEqual(mutationResults);
      expect(report.metadata.targetUrl).toBe(config.url);
      expect(report.metadata.executionDate).toEqual(startTime);
      expect(report.metadata.duration).toBe(300000); // 5 minutes
    });

    it('should calculate summary statistics correctly', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults = createMockMutationResults();
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:05:00Z');

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.summary.totalTests).toBe(4); // 1 happy path + 3 mutations
      expect(report.summary.successfulTests).toBe(2); // Happy path + 1 successful mutation
      expect(report.summary.failedTests).toBe(2); // 1 error + 1 server error
      expect(report.summary.vulnerabilitiesFound).toBe(1);
      expect(report.summary.integrityIssues).toBe(1);
      expect(report.summary.averageResponseTime).toBe(1362.5); // (150+120+180+5000)/4
    });

    it('should handle empty mutation results', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults: TestResult[] = [];
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:01:00Z');

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.summary.totalTests).toBe(1);
      expect(report.summary.successfulTests).toBe(1);
      expect(report.summary.failedTests).toBe(0);
      expect(report.summary.vulnerabilitiesFound).toBe(0);
      expect(report.summary.integrityIssues).toBe(0);
      expect(report.summary.averageResponseTime).toBe(150);
    });

    it('should handle failed happy path result', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult: TestResult = {
        ...createMockHappyPathResult(),
        statusCode: 500,
        error: 'Server error',
      };
      const mutationResults = createMockMutationResults();
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:05:00Z');

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.summary.successfulTests).toBe(1); // Only 1 successful mutation
      expect(report.summary.failedTests).toBe(3); // Happy path + 2 failed mutations
    });
  });

  describe('validateReportForExport', () => {
    it('should validate a complete report', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 4,
          successfulTests: 2,
          failedTests: 2,
          vulnerabilitiesFound: 1,
          integrityIssues: 1,
          averageResponseTime: 1000,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: createMockMutationResults(),
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date(),
          duration: 300000,
        },
      };

      const isValid = service.validateReportForExport(report);

      expect(isValid).toBeTruthy();
    });

    it('should reject report without testId', () => {
      const report: Report = {
        testId: '',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date(),
          duration: 60000,
        },
      };

      const isValid = service.validateReportForExport(report);

      expect(isValid).toBeFalsy();
    });

    it('should reject report without happy path result', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100,
        },
        happyPathResult: null as any,
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date(),
          duration: 60000,
        },
      };

      const isValid = service.validateReportForExport(report);

      expect(isValid).toBeFalsy();
    });

    it('should reject report with invalid summary', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: -1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date(),
          duration: 60000,
        },
      };

      const isValid = service.validateReportForExport(report);

      expect(isValid).toBeFalsy();
    });

    it('should reject report with invalid metadata', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: '',
          executionDate: new Date(),
          duration: -1,
        },
      };

      const isValid = service.validateReportForExport(report);

      expect(isValid).toBeFalsy();
    });
  });

  describe('exportToJson', () => {
    it('should export report to JSON string', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date('2023-12-01T10:00:00Z'),
          duration: 60000,
        },
      };

      const jsonString = service.exportToJson(report);

      expect(typeof jsonString).toBe('string');
      
      const parsed = JSON.parse(jsonString);
      expect(parsed.testId).toBe('test-123');
      expect(parsed.summary.totalTests).toBe(1);
      expect(parsed.happyPathResult.statusCode).toBe(201);
    });

    it('should handle circular references gracefully', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date('2023-12-01T10:00:00Z'),
          duration: 60000,
        },
      };

      // Add circular reference
      (report as any).circular = report;

      expect(() => service.exportToJson(report)).not.toThrow();
    });
  });

  describe('generateExportFilename', () => {
    it('should generate filename with test details', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/users',
          executionDate: new Date('2023-12-01T10:00:00Z'),
          duration: 60000,
        },
      };

      const filename = service.generateExportFilename(report);

      expect(filename).toContain('api-mutation-test');
      expect(filename).toContain('example-com');
      expect(filename).toContain('2023-12-01');
      expect(filename).toContain('test-123');
      expect(filename.endsWith('.json')).toBeTruthy();
    });

    it('should handle special characters in URL', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api-test.example.com:8080/users?param=value',
          executionDate: new Date('2023-12-01T10:00:00Z'),
          duration: 60000,
        },
      };

      const filename = service.generateExportFilename(report);

      expect(filename).not.toContain(':');
      expect(filename).not.toContain('?');
      expect(filename).not.toContain('=');
      expect(filename).toContain('api-test-example-com');
    });

    it('should handle invalid URLs gracefully', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: createMockHappyPathResult(),
        mutationResults: [],
        metadata: {
          targetUrl: 'invalid-url',
          executionDate: new Date('2023-12-01T10:00:00Z'),
          duration: 60000,
        },
      };

      const filename = service.generateExportFilename(report);

      expect(filename).toContain('api-mutation-test');
      expect(filename).toContain('test-123');
      expect(filename.endsWith('.json')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('should handle zero duration', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults: TestResult[] = [];
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:00:00Z'); // Same time

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.metadata.duration).toBe(0);
    });

    it('should handle very large numbers in response times', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults: TestResult[] = [
        {
          id: 'result-1',
          mutationId: 'mut-1',
          isHappyPath: false,
          statusCode: 200,
          responseTime: Number.MAX_SAFE_INTEGER,
          responseBody: {},
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        },
      ];
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:05:00Z');

      const report = service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      );

      expect(report.summary.averageResponseTime).toBeGreaterThan(0);
      expect(isFinite(report.summary.averageResponseTime)).toBeTruthy();
    });

    it('should handle null/undefined values in test results', () => {
      const testId = 'test-123';
      const config = createMockTestConfig();
      const happyPathResult = createMockHappyPathResult();
      const mutationResults: TestResult[] = [
        {
          id: 'result-1',
          mutationId: 'mut-1',
          isHappyPath: false,
          statusCode: 0,
          responseTime: 0,
          responseBody: null,
          error: undefined,
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        },
      ];
      const startTime = new Date('2023-12-01T10:00:00Z');
      const endTime = new Date('2023-12-01T10:05:00Z');

      expect(() => service.generateReport(
        testId,
        config,
        happyPathResult,
        mutationResults,
        startTime,
        endTime
      )).not.toThrow();
    });
  });
});