import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { TestExecutionService } from './test-execution.service';
import { HttpClientService } from './http-client.service';
import { MutationGeneratorService } from './mutation-generator.service';
import { VulnerabilityDetectorService } from './vulnerability-detector.service';
import { CreateTestConfigDto } from '../dto/test-config.dto';
import { HttpMethod, HttpResponse, Mutation, MutationType } from '@api-mutation-tester/shared';

describe('TestExecutionService', () => {
  let service: TestExecutionService;
  let httpClientService: HttpClientService;
  let mutationGeneratorService: MutationGeneratorService;
  let vulnerabilityDetectorService: VulnerabilityDetectorService;

  const mockHttpClientService = {
    executeRequest: jest.fn(),
  };

  const mockMutationGeneratorService = {
    generateMutations: jest.fn(),
  };

  const mockVulnerabilityDetectorService = {
    detectVulnerability: jest.fn(),
    detectIntegrityIssue: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TestExecutionService,
        {
          provide: HttpClientService,
          useValue: mockHttpClientService,
        },
        {
          provide: MutationGeneratorService,
          useValue: mockMutationGeneratorService,
        },
        {
          provide: VulnerabilityDetectorService,
          useValue: mockVulnerabilityDetectorService,
        },
      ],
    }).compile();

    service = module.get<TestExecutionService>(TestExecutionService);
    httpClientService = module.get<HttpClientService>(HttpClientService);
    mutationGeneratorService = module.get<MutationGeneratorService>(MutationGeneratorService);
    vulnerabilityDetectorService = module.get<VulnerabilityDetectorService>(VulnerabilityDetectorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeTest', () => {
    const validConfig: CreateTestConfigDto = {
      url: 'https://api.example.com/test',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      payload: { test: 'data' },
      timeout: 30000,
    };

    it('should create and start a test execution', async () => {
      const result = await service.executeTest(validConfig);

      expect(result).toHaveProperty('testId');
      expect(typeof result.testId).toBe('string');
      expect(result.testId.length).toBeGreaterThan(0);
    });

    it('should validate URL format', async () => {
      const invalidConfig = { ...validConfig, url: 'invalid-url' };

      await expect(service.executeTest(invalidConfig)).rejects.toThrow(BadRequestException);
    });

    it('should validate URL protocol', async () => {
      const invalidConfig = { ...validConfig, url: 'ftp://example.com/test' };

      await expect(service.executeTest(invalidConfig)).rejects.toThrow(BadRequestException);
    });

    it('should validate timeout range', async () => {
      const invalidConfig = { ...validConfig, timeout: 500 };

      await expect(service.executeTest(invalidConfig)).rejects.toThrow(BadRequestException);
    });

    it('should validate timeout maximum', async () => {
      const invalidConfig = { ...validConfig, timeout: 400000 };

      await expect(service.executeTest(invalidConfig)).rejects.toThrow(BadRequestException);
    });

    it('should validate headers format', async () => {
      const invalidConfig = { ...validConfig, headers: { '': 'value' } };

      await expect(service.executeTest(invalidConfig)).rejects.toThrow(BadRequestException);
    });

    it('should reject when max concurrent tests reached', async () => {
      // Create maximum number of concurrent tests
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(service.executeTest({ ...validConfig, url: `https://api.example.com/test${i}` }));
      }
      await Promise.all(promises);

      // This should fail
      await expect(service.executeTest(validConfig)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTestStatus', () => {
    it('should return test status for existing test', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const status = await service.getTestStatus(testId);

      expect(status).toHaveProperty('id', testId);
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('progress');
      expect(status).toHaveProperty('currentPhase');
      expect(status).toHaveProperty('startTime');
    });

    it('should throw error for non-existent test', async () => {
      await expect(service.getTestStatus('non-existent-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTestResults', () => {
    it('should return test results for existing test', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const results = await service.getTestResults(testId);

      expect(results).toHaveProperty('mutationResults');
      expect(Array.isArray(results.mutationResults)).toBeTruthy();
    });

    it('should throw error for non-existent test', async () => {
      await expect(service.getTestResults('non-existent-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('cancelTest', () => {
    it('should cancel a running test', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      await service.cancelTest(testId);

      const status = await service.getTestStatus(testId);
      expect(status.status).toBe('failed');
    });

    it('should throw error for non-existent test', async () => {
      await expect(service.cancelTest('non-existent-id')).rejects.toThrow(BadRequestException);
    });

    it('should throw error when trying to cancel completed test', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      // Wait for test to complete (mock successful execution)
      mockHttpClientService.executeRequest.mockResolvedValue({
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        headers: {},
      } as HttpResponse);

      mockMutationGeneratorService.generateMutations.mockReturnValue([]);

      // Wait a bit for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to cancel completed test
      await expect(service.cancelTest(testId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('cleanupCompletedTests', () => {
    it('should remove old completed tests', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      // Cancel the test to mark it as completed
      await service.cancelTest(testId);

      // Wait a bit to ensure time difference
      await new Promise(resolve => setTimeout(resolve, 1));
      
      // Clean up with 0 max age (should remove immediately)
      service.cleanupCompletedTests(0);

      // Test should no longer exist
      await expect(service.getTestStatus(testId)).rejects.toThrow(BadRequestException);
    });

    it('should not remove recent completed tests', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      // Cancel the test to mark it as completed
      await service.cancelTest(testId);

      // Clean up with large max age (should not remove)
      service.cleanupCompletedTests(3600000); // 1 hour

      // Test should still exist
      const status = await service.getTestStatus(testId);
      expect(status.id).toBe(testId);
    });
  });

  describe('getActiveTests', () => {
    it('should return list of active tests', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const activeTests = await service.getActiveTests();

      expect(Array.isArray(activeTests)).toBeTruthy();
      expect(activeTests.some(test => test.id === testId)).toBeTruthy();
    });

    it('should return empty array when no active tests', async () => {
      // Clean up all tests
      service.cleanupCompletedTests(0);

      const activeTests = await service.getActiveTests();

      expect(Array.isArray(activeTests)).toBeTruthy();
      expect(activeTests.length).toBe(0);
    });
  });

  describe('getTestStatistics', () => {
    it('should return test statistics', async () => {
      const stats = await service.getTestStatistics();

      expect(stats).toHaveProperty('totalTests');
      expect(stats).toHaveProperty('activeTests');
      expect(stats).toHaveProperty('completedTests');
      expect(stats).toHaveProperty('failedTests');
      expect(stats).toHaveProperty('averageExecutionTime');

      expect(typeof stats.totalTests).toBe('number');
      expect(typeof stats.activeTests).toBe('number');
      expect(typeof stats.completedTests).toBe('number');
      expect(typeof stats.failedTests).toBe('number');
      expect(typeof stats.averageExecutionTime).toBe('number');
    });
  });

  describe('forceCleanupTest', () => {
    it('should force cleanup a specific test', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      await service.forceCleanupTest(testId);

      await expect(service.getTestStatus(testId)).rejects.toThrow(BadRequestException);
    });

    it('should throw error for non-existent test', async () => {
      await expect(service.forceCleanupTest('non-existent-id')).rejects.toThrow(BadRequestException);
    });
  });

  describe('pauseTest and resumeTest', () => {
    it('should throw not implemented error for pause', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      await expect(service.pauseTest(testId)).rejects.toThrow(BadRequestException);
    });

    it('should throw not implemented error for resume', async () => {
      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      await expect(service.resumeTest(testId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('async test execution', () => {
    it('should execute happy path successfully', async () => {
      const mockResponse: HttpResponse = {
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        headers: {},
      };

      mockHttpClientService.executeRequest.mockResolvedValue(mockResponse);
      mockMutationGeneratorService.generateMutations.mockReturnValue([]);

      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      // Wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const results = await service.getTestResults(testId);
      expect(results.happyPathResult).toBeDefined();
      expect(results.happyPathResult?.statusCode).toBe(200);
    });

    it('should handle happy path failure', async () => {
      const mockResponse: HttpResponse = {
        statusCode: 500,
        responseTime: 100,
        responseBody: { error: 'Server error' },
        headers: {},
      };

      mockHttpClientService.executeRequest.mockResolvedValue(mockResponse);

      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      // Wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 200));

      const status = await service.getTestStatus(testId);
      expect(status.status).toBe('failed');
    });

    it('should execute mutations after successful happy path', async () => {
      const mockHappyPathResponse: HttpResponse = {
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        headers: {},
      };

      const mockMutationResponse: HttpResponse = {
        statusCode: 400,
        responseTime: 120,
        responseBody: { error: 'Bad request' },
        headers: {},
      };

      const mockMutation: Mutation = {
        id: 'mut-1',
        type: MutationType.STRING_EMPTY,
        description: 'Empty string test',
        modifiedRequest: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { field: '' },
          timeout: 30000,
        },
        mutationStrategy: 'Test empty string validation',
      };

      mockHttpClientService.executeRequest
        .mockResolvedValueOnce(mockHappyPathResponse)
        .mockResolvedValueOnce(mockMutationResponse);

      mockMutationGeneratorService.generateMutations.mockReturnValue([mockMutation]);
      mockVulnerabilityDetectorService.detectVulnerability.mockReturnValue(false);
      mockVulnerabilityDetectorService.detectIntegrityIssue.mockReturnValue(false);

      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: {},
        payload: { field: 'value' },
        timeout: 30000,
      });

      // Wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const results = await service.getTestResults(testId);
      expect(results.mutationResults.length).toBe(1);
      expect(results.mutationResults[0].mutationId).toBe('mut-1');
    });

    it('should handle mutation execution errors gracefully', async () => {
      const mockHappyPathResponse: HttpResponse = {
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        headers: {},
      };

      const mockMutation: Mutation = {
        id: 'mut-1',
        type: MutationType.STRING_MALICIOUS,
        description: 'Malicious script test',
        modifiedRequest: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { script: '<script>alert(1)</script>' },
          timeout: 30000,
        },
        mutationStrategy: 'Test XSS vulnerability',
      };

      mockHttpClientService.executeRequest
        .mockResolvedValueOnce(mockHappyPathResponse)
        .mockRejectedValueOnce(new Error('Network error'));

      mockMutationGeneratorService.generateMutations.mockReturnValue([mockMutation]);

      const { testId } = await service.executeTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: {},
        payload: { field: 'value' },
        timeout: 30000,
      });

      // Wait for async execution to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const results = await service.getTestResults(testId);
      expect(results.mutationResults.length).toBe(1);
      expect(results.mutationResults[0].error).toBe('Network error');
    });
  });
});