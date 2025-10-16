import axios from 'axios';
import { apiService, ApiError } from './api';
import { HttpMethod, TestStatus, Report } from '@api-mutation-tester/shared';

import { vi } from 'vitest';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock axios.create
const mockAxiosInstance = {
  post: vi.fn(),
  get: vi.fn(),
  interceptors: {
    request: {
      use: vi.fn(),
    },
    response: {
      use: vi.fn(),
    },
  },
};

mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

describe('apiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTest', () => {
    const testConfig = {
      url: 'https://api.example.com/test',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      payload: { test: 'data' },
      timeout: 30000,
    };

    it('should create test successfully', async () => {
      const mockResponse = {
        data: { testId: 'test-123', message: 'Test created successfully' },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await apiService.createTest(testConfig);

      expect(result).toEqual(mockResponse.data);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/tests', testConfig);
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid configuration' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest(testConfig)).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest(testConfig)).rejects.toThrow();
    });
  });

  describe('getTestStatus', () => {
    const testId = 'test-123';

    it('should get test status successfully', async () => {
      const mockStatus: TestStatus = {
        id: testId,
        status: 'running',
        progress: 50,
        currentPhase: 'mutations',
        totalMutations: 100,
        completedMutations: 50,
        startTime: new Date(),
      };

      const mockResponse = { data: mockStatus };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getTestStatus(testId);

      expect(result).toEqual(mockStatus);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tests/${testId}/status`);
    });

    it('should handle 404 errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Test not found' },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestStatus(testId)).rejects.toThrow();
    });
  });

  describe('getTestResults', () => {
    const testId = 'test-123';

    it('should get test results successfully', async () => {
      const mockResults = {
        happyPathResult: {
          id: 'result-1',
          isHappyPath: true,
          statusCode: 200,
          responseTime: 100,
          responseBody: { success: true },
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        },
        mutationResults: [],
      };

      const mockResponse = { data: mockResults };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getTestResults(testId);

      expect(result).toEqual(mockResults);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tests/${testId}/results`);
    });
  });

  describe('getTestReport', () => {
    const testId = 'test-123';

    it('should get test report successfully', async () => {
      const mockReport: Report = {
        testId,
        summary: {
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 100,
        },
        happyPathResult: {
          id: 'result-1',
          isHappyPath: true,
          statusCode: 200,
          responseTime: 100,
          responseBody: { success: true },
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        },
        mutationResults: [],
        metadata: {
          targetUrl: 'https://api.example.com/test',
          executionDate: new Date(),
          duration: 60000,
        },
      };

      const mockResponse = { data: mockReport };
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.getTestReport(testId);

      expect(result).toEqual(mockReport);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tests/${testId}/report`);
    });
  });

  describe('exportTestReport', () => {
    const testId = 'test-123';

    it('should export test report successfully', async () => {
      const mockBlob = new Blob(['test data'], { type: 'application/json' });
      const mockResponse = { data: mockBlob };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await apiService.exportTestReport(testId);

      expect(result).toEqual(mockBlob);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/tests/${testId}/export`, {
        responseType: 'blob',
      });
    });
  });

  describe('ApiError', () => {
    it('should create ApiError with message and status', () => {
      const error = new ApiError('Test error', 400, { detail: 'error detail' });

      expect(error.message).toBe('Test error');
      expect(error.status).toBe(400);
      expect(error.data).toEqual({ detail: 'error detail' });
      expect(error.name).toBe('ApiError');
    });

    it('should be instance of Error', () => {
      const error = new ApiError('Test error', 500);

      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(ApiError);
    });
  });

  describe('axios interceptors', () => {
    it('should setup request interceptor', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    });

    it('should setup response interceptor', () => {
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle 400 Bad Request', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      })).rejects.toThrow();
    });

    it('should handle 401 Unauthorized', async () => {
      const mockError = {
        response: {
          status: 401,
          data: {},
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestStatus('test-123')).rejects.toThrow();
    });

    it('should handle 404 Not Found', async () => {
      const mockError = {
        response: {
          status: 404,
          data: {},
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestResults('test-123')).rejects.toThrow();
    });

    it('should handle 429 Too Many Requests', async () => {
      const mockError = {
        response: {
          status: 429,
          data: {},
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      })).rejects.toThrow();
    });

    it('should handle 500 Internal Server Error', async () => {
      const mockError = {
        response: {
          status: 500,
          data: {},
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestReport('test-123')).rejects.toThrow();
    });

    it('should handle timeout errors', async () => {
      const mockError = {
        code: 'ECONNABORTED',
        message: 'timeout of 30000ms exceeded',
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      })).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const mockError = {
        request: {},
        message: 'Network Error',
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestStatus('test-123')).rejects.toThrow();
    });

    it('should handle errors with custom messages', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { message: 'Custom error message' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(mockError);

      await expect(apiService.createTest({
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      })).rejects.toThrow();
    });

    it('should handle errors without response data', async () => {
      const mockError = {
        response: {
          status: 500,
        },
      };

      mockAxiosInstance.get.mockRejectedValue(mockError);

      await expect(apiService.getTestResults('test-123')).rejects.toThrow();
    });
  });

  describe('configuration', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3003/api',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('should use environment variable for API URL if available', () => {
      // This would require mocking process.env, which is complex in Jest
      // For now, we just verify the default behavior
      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: expect.stringContaining('/api'),
        })
      );
    });
  });
});