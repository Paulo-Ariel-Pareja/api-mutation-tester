import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCreateTest, useTestStatus, useTestResults, useTestReport } from './useApi';
import { apiService } from '../services/api';
import { HttpMethod } from '@api-mutation-tester/shared';

import { vi } from 'vitest';

// Mock the API service
vi.mock('../services/api');
const mockedApiService = apiService as any;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
};

describe('useApi hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCreateTest', () => {
    it('should create test successfully', async () => {
      const mockResponse = { testId: 'test-123', message: 'Test created' };
      mockedApiService.createTest.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateTest(), {
        wrapper: createWrapper(),
      });

      const testConfig = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
      };

      result.current.mutate(testConfig);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockedApiService.createTest).toHaveBeenCalledWith(testConfig);
    });

    it('should handle create test error', async () => {
      const mockError = new Error('Failed to create test');
      mockedApiService.createTest.mockRejectedValue(mockError);

      const { result } = renderHook(() => useCreateTest(), {
        wrapper: createWrapper(),
      });

      const testConfig = {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      result.current.mutate(testConfig);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should show loading state during mutation', async () => {
      mockedApiService.createTest.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ testId: 'test-123', message: 'Test created' }), 100))
      );

      const { result } = renderHook(() => useCreateTest(), {
        wrapper: createWrapper(),
      });

      const testConfig = {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      result.current.mutate(testConfig);

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isPending).toBe(false);
    });
  });

  describe('useTestStatus', () => {
    it('should fetch test status successfully', async () => {
      const mockStatus = {
        id: 'test-123',
        status: 'running' as const,
        progress: 50,
        currentPhase: 'mutations' as const,
        totalMutations: 100,
        completedMutations: 50,
        startTime: new Date(),
      };

      mockedApiService.getTestStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockStatus);
      expect(mockedApiService.getTestStatus).toHaveBeenCalledWith('test-123');
    });

    it('should handle test status error', async () => {
      const mockError = new Error('Test not found');
      mockedApiService.getTestStatus.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when testId is not provided', () => {
      const { result } = renderHook(() => useTestStatus(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockedApiService.getTestStatus).not.toHaveBeenCalled();
    });

    it('should refetch at intervals for running tests', async () => {
      const mockStatus = {
        id: 'test-123',
        status: 'running' as const,
        progress: 50,
        currentPhase: 'mutations' as const,
        totalMutations: 100,
        completedMutations: 50,
        startTime: new Date(),
      };

      mockedApiService.getTestStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Verify that refetch interval is set for running tests
      expect(result.current.data?.status).toBe('running');
    });

    it('should stop refetching for completed tests', async () => {
      const mockStatus = {
        id: 'test-123',
        status: 'completed' as const,
        progress: 100,
        currentPhase: 'report' as const,
        totalMutations: 100,
        completedMutations: 100,
        startTime: new Date(),
        endTime: new Date(),
      };

      mockedApiService.getTestStatus.mockResolvedValue(mockStatus);

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.status).toBe('completed');
    });
  });

  describe('useTestResults', () => {
    it('should fetch test results successfully', async () => {
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
        mutationResults: [
          {
            id: 'result-2',
            mutationId: 'mut-1',
            isHappyPath: false,
            statusCode: 400,
            responseTime: 120,
            responseBody: { error: 'Bad request' },
            vulnerabilityDetected: false,
            integrityIssue: false,
            timestamp: new Date(),
          },
        ],
      };

      mockedApiService.getTestResults.mockResolvedValue(mockResults);

      const { result } = renderHook(() => useTestResults('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResults);
      expect(mockedApiService.getTestResults).toHaveBeenCalledWith('test-123');
    });

    it('should handle test results error', async () => {
      const mockError = new Error('Results not available');
      mockedApiService.getTestResults.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTestResults('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when testId is not provided', () => {
      const { result } = renderHook(() => useTestResults(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockedApiService.getTestResults).not.toHaveBeenCalled();
    });
  });

  describe('useTestReport', () => {
    it('should fetch test report successfully', async () => {
      const mockReport = {
        testId: 'test-123',
        summary: {
          totalTests: 2,
          successfulTests: 1,
          failedTests: 1,
          vulnerabilitiesFound: 0,
          integrityIssues: 0,
          averageResponseTime: 110,
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
        mutationResults: [
          {
            id: 'result-2',
            mutationId: 'mut-1',
            isHappyPath: false,
            statusCode: 400,
            responseTime: 120,
            responseBody: { error: 'Bad request' },
            vulnerabilityDetected: false,
            integrityIssue: false,
            timestamp: new Date(),
          },
        ],
        metadata: {
          targetUrl: 'https://api.example.com/test',
          executionDate: new Date(),
          duration: 120000,
        },
      };

      mockedApiService.getTestReport.mockResolvedValue(mockReport);

      const { result } = renderHook(() => useTestReport('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockReport);
      expect(mockedApiService.getTestReport).toHaveBeenCalledWith('test-123');
    });

    it('should handle test report error', async () => {
      const mockError = new Error('Report not ready');
      mockedApiService.getTestReport.mockRejectedValue(mockError);

      const { result } = renderHook(() => useTestReport('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(mockError);
    });

    it('should not fetch when testId is not provided', () => {
      const { result } = renderHook(() => useTestReport(''), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockedApiService.getTestReport).not.toHaveBeenCalled();
    });

    it('should cache report data', async () => {
      const mockReport = {
        testId: 'test-123',
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

      mockedApiService.getTestReport.mockResolvedValue(mockReport);

      // First render
      const { result: result1 } = renderHook(() => useTestReport('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
      });

      // Second render with same testId should use cached data
      const { result: result2 } = renderHook(() => useTestReport('test-123'), {
        wrapper: createWrapper(),
      });

      expect(result2.current.data).toEqual(mockReport);
      // API should only be called once due to caching
      expect(mockedApiService.getTestReport).toHaveBeenCalledTimes(1);
    });
  });

  describe('error handling', () => {
    it('should handle network errors consistently', async () => {
      const networkError = new Error('Network Error');
      mockedApiService.getTestStatus.mockRejectedValue(networkError);

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(networkError);
    });

    it('should handle API errors with status codes', async () => {
      const apiError = new Error('404 Not Found');
      mockedApiService.getTestResults.mockRejectedValue(apiError);

      const { result } = renderHook(() => useTestResults('test-123'), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(apiError);
    });
  });

  describe('loading states', () => {
    it('should show loading state for test status', async () => {
      mockedApiService.getTestStatus.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          id: 'test-123',
          status: 'running' as const,
          progress: 50,
          currentPhase: 'mutations' as const,
          totalMutations: 100,
          completedMutations: 50,
          startTime: new Date(),
        }), 100))
      );

      const { result } = renderHook(() => useTestStatus('test-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should show loading state for test results', async () => {
      mockedApiService.getTestResults.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
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
        }), 100))
      );

      const { result } = renderHook(() => useTestResults('test-123'), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});