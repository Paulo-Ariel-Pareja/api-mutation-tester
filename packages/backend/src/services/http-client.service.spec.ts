import { Test, TestingModule } from '@nestjs/testing';
import { HttpClientService } from './http-client.service';
import { MetricsService } from './metrics.service';
import { HttpRequest, HttpMethod } from '@api-mutation-tester/shared';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock axios.create to return a mocked instance
const mockAxiosInstance = {
  request: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
    },
    response: {
      use: jest.fn(),
    },
  },
};

mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

describe('HttpClientService', () => {
  let service: HttpClientService;

  const mockMetricsService = {
    recordRequest: jest.fn(),
    getMetrics: jest.fn().mockReturnValue([]),
    getMetricsSummary: jest.fn().mockReturnValue({
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      slowRequests: 0,
      statusCodeDistribution: {},
    }),
    clearMetrics: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpClientService,
        {
          provide: MetricsService,
          useValue: mockMetricsService,
        },
      ],
    }).compile();

    service = module.get<HttpClientService>(HttpClientService);
  });

  describe('executeRequest', () => {
    const mockRequest: HttpRequest = {
      url: 'https://api.example.com/test',
      method: HttpMethod.GET,
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    };

    it('should execute GET request successfully', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: { 'content-type': 'application/json' },
      };

      mockAxiosInstance.request.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 1))
      );

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(200);
      expect(result.responseBody).toEqual({ success: true });
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.error).toBeUndefined();
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: mockRequest.url,
          method: mockRequest.method.toLowerCase(),
          headers: expect.objectContaining(mockRequest.headers),
          data: mockRequest.payload,
          timeout: mockRequest.timeout,
        })
      );
    });

    it('should execute POST request with payload', async () => {
      const postRequest: HttpRequest = {
        ...mockRequest,
        method: HttpMethod.POST,
        payload: { test: 'data' },
      };

      const mockResponse = {
        status: 201,
        data: { id: 1, test: 'data' },
        headers: { 'content-type': 'application/json' },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await service.executeRequest(postRequest);

      expect(result.statusCode).toBe(201);
      expect(result.responseBody).toEqual({ id: 1, test: 'data' });
      expect(mockAxiosInstance.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: postRequest.url,
          method: 'post',
          headers: expect.objectContaining(postRequest.headers),
          data: postRequest.payload,
          timeout: postRequest.timeout,
        })
      );
    });

    it('should handle HTTP error responses', async () => {
      const mockErrorResponse = {
        status: 400,
        data: { error: 'Bad Request' },
        headers: { 'content-type': 'application/json' },
      };

      mockAxiosInstance.request.mockResolvedValue(mockErrorResponse);

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(400);
      expect(result.responseBody).toEqual({ error: 'Bad Request' });
      expect(result.error).toBeUndefined();
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network Error');
      networkError.name = 'AxiosError';
      (networkError as any).code = 'ECONNREFUSED';
      (networkError as any).isAxiosError = true;

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.request.mockImplementation(() => 
        new Promise((resolve, reject) => setTimeout(() => reject(networkError), 1))
      );

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(0);
      expect(result.responseBody).toBeNull();
      expect(result.error).toContain('Connection error');
      expect(result.responseTime).toBeGreaterThan(0);
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('timeout of 5000ms exceeded');
      timeoutError.name = 'AxiosError';
      (timeoutError as any).code = 'ECONNABORTED';
      (timeoutError as any).isAxiosError = true;

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.request.mockRejectedValue(timeoutError);

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(0);
      expect(result.responseBody).toBeNull();
      expect(result.error).toContain('Request timeout');
    });

    it('should handle axios errors with response', async () => {
      const axiosError = {
        name: 'AxiosError',
        message: 'Request failed with status code 500',
        isAxiosError: true,
        response: {
          status: 500,
          statusText: 'Internal Server Error',
          data: { error: 'Internal Server Error' },
          headers: { 'content-type': 'application/json' },
        },
      };

      mockedAxios.isAxiosError.mockReturnValue(true);
      mockAxiosInstance.request.mockRejectedValue(axiosError);

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(500);
      expect(result.responseBody).toEqual({ error: 'Internal Server Error' });
      expect(result.error).toContain('HTTP 500');
    });

    it('should measure response time accurately', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {},
      };

      // Mock a delay
      mockAxiosInstance.request.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockResponse), 100))
      );

      const result = await service.executeRequest(mockRequest);

      expect(result.responseTime).toBeGreaterThanOrEqual(100);
      expect(result.responseTime).toBeLessThan(200); // Allow some margin
    });

    it('should validate status codes correctly', async () => {
      const mockResponse = {
        status: 404,
        data: { error: 'Not Found' },
        headers: {},
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(404);
      expect(result.responseBody).toEqual({ error: 'Not Found' });
    });

    it('should handle different HTTP methods', async () => {
      const methods = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE, HttpMethod.PATCH];
      
      for (const method of methods) {
        const request: HttpRequest = {
          ...mockRequest,
          method,
        };

        const mockResponse = {
          status: 200,
          data: { method },
          headers: {},
        };

        mockAxiosInstance.request.mockResolvedValue(mockResponse);

        const result = await service.executeRequest(request);

        expect(result.statusCode).toBe(200);
        expect(mockAxiosInstance.request).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method.toLowerCase(),
          })
        );
      }
    });

    it('should handle empty response body', async () => {
      const mockResponse = {
        status: 204,
        data: '',
        headers: {},
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await service.executeRequest(mockRequest);

      expect(result.statusCode).toBe(204);
      expect(result.responseBody).toBe('');
    });

    it('should preserve response headers', async () => {
      const mockResponse = {
        status: 200,
        data: { success: true },
        headers: {
          'content-type': 'application/json',
          'x-custom-header': 'custom-value',
        },
      };

      mockAxiosInstance.request.mockResolvedValue(mockResponse);

      const result = await service.executeRequest(mockRequest);

      expect(result.headers).toEqual({
        'content-type': 'application/json',
        'x-custom-header': 'custom-value',
      });
    });
  });
});