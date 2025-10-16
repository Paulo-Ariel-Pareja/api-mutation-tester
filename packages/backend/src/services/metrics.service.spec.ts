import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService, RequestMetrics } from './metrics.service';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MetricsService],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordRequest', () => {
    it('should record request metrics', () => {
      const metrics: RequestMetrics = {
        correlationId: 'test-123',
        url: 'https://api.example.com/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(metrics);
      
      const allMetrics = service.getMetrics();
      expect(allMetrics).toHaveLength(1);
      expect(allMetrics[0]).toEqual(metrics);
    });

    it('should record multiple requests', () => {
      const metrics1: RequestMetrics = {
        correlationId: 'test-1',
        url: 'https://api.example.com/test1',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
        success: true,
      };

      const metrics2: RequestMetrics = {
        correlationId: 'test-2',
        url: 'https://api.example.com/test2',
        method: 'POST',
        statusCode: 400,
        responseTime: 200,
        timestamp: new Date(),
        success: false,
        error: 'Bad request',
      };
      
      service.recordRequest(metrics1);
      service.recordRequest(metrics2);
      
      const allMetrics = service.getMetrics();
      expect(allMetrics).toHaveLength(2);
      expect(allMetrics[0]).toEqual(metrics1);
      expect(allMetrics[1]).toEqual(metrics2);
    });

    it('should limit metrics history', () => {
      // Record more than the max limit (10000)
      for (let i = 0; i < 10002; i++) {
        const metrics: RequestMetrics = {
          correlationId: `test-${i}`,
          url: 'https://api.example.com/test',
          method: 'GET',
          statusCode: 200,
          responseTime: 100,
          timestamp: new Date(),
          success: true,
        };
        service.recordRequest(metrics);
      }
      
      const allMetrics = service.getMetrics();
      expect(allMetrics).toHaveLength(10000);
    });
  });

  describe('getMetrics', () => {
    it('should return empty array initially', () => {
      const metrics = service.getMetrics();
      expect(metrics).toEqual([]);
    });

    it('should return copy of metrics array', () => {
      const requestMetrics: RequestMetrics = {
        correlationId: 'test-123',
        url: 'https://api.example.com/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(requestMetrics);
      
      const metrics1 = service.getMetrics();
      const metrics2 = service.getMetrics();
      
      expect(metrics1).not.toBe(metrics2); // Different array instances
      expect(metrics1).toEqual(metrics2); // Same content
    });
  });

  describe('getMetricsSummary', () => {
    it('should return empty summary initially', () => {
      const summary = service.getMetricsSummary();
      
      expect(summary.totalRequests).toBe(0);
      expect(summary.successfulRequests).toBe(0);
      expect(summary.failedRequests).toBe(0);
      expect(summary.averageResponseTime).toBe(0);
      expect(summary.slowRequests).toBe(0);
      expect(summary.statusCodeDistribution).toEqual({});
    });

    it('should calculate summary correctly', () => {
      const metrics1: RequestMetrics = {
        correlationId: 'test-1',
        url: 'https://api.example.com/test1',
        method: 'GET',
        statusCode: 200,
        responseTime: 100,
        timestamp: new Date(),
        success: true,
      };

      const metrics2: RequestMetrics = {
        correlationId: 'test-2',
        url: 'https://api.example.com/test2',
        method: 'POST',
        statusCode: 400,
        responseTime: 200,
        timestamp: new Date(),
        success: false,
      };

      const metrics3: RequestMetrics = {
        correlationId: 'test-3',
        url: 'https://api.example.com/test3',
        method: 'GET',
        statusCode: 200,
        responseTime: 6000, // Slow request
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(metrics1);
      service.recordRequest(metrics2);
      service.recordRequest(metrics3);
      
      const summary = service.getMetricsSummary();
      
      expect(summary.totalRequests).toBe(3);
      expect(summary.successfulRequests).toBe(2);
      expect(summary.failedRequests).toBe(1);
      expect(summary.averageResponseTime).toBe(2100); // (100 + 200 + 6000) / 3
      expect(summary.slowRequests).toBe(1);
      expect(summary.statusCodeDistribution).toEqual({
        200: 2,
        400: 1,
      });
    });

    it('should handle slow requests correctly', () => {
      const slowMetrics: RequestMetrics = {
        correlationId: 'test-slow',
        url: 'https://api.example.com/slow',
        method: 'GET',
        statusCode: 200,
        responseTime: 7000, // > 5000ms
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(slowMetrics);
      
      const summary = service.getMetricsSummary();
      expect(summary.slowRequests).toBe(1);
    });
  });

  describe('clearMetrics', () => {
    it('should clear all metrics', () => {
      const metrics: RequestMetrics = {
        correlationId: 'test-123',
        url: 'https://api.example.com/test',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(metrics);
      expect(service.getMetrics()).toHaveLength(1);
      
      service.clearMetrics();
      expect(service.getMetrics()).toHaveLength(0);
      
      const summary = service.getMetricsSummary();
      expect(summary.totalRequests).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle metrics with errors', () => {
      const errorMetrics: RequestMetrics = {
        correlationId: 'test-error',
        url: 'https://api.example.com/error',
        method: 'POST',
        statusCode: 500,
        responseTime: 1000,
        timestamp: new Date(),
        success: false,
        error: 'Internal server error',
      };
      
      service.recordRequest(errorMetrics);
      
      const allMetrics = service.getMetrics();
      expect(allMetrics[0].error).toBe('Internal server error');
      
      const summary = service.getMetricsSummary();
      expect(summary.failedRequests).toBe(1);
    });

    it('should handle zero response times', () => {
      const zeroTimeMetrics: RequestMetrics = {
        correlationId: 'test-zero',
        url: 'https://api.example.com/zero',
        method: 'GET',
        statusCode: 200,
        responseTime: 0,
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(zeroTimeMetrics);
      
      const summary = service.getMetricsSummary();
      expect(summary.averageResponseTime).toBe(0);
      expect(summary.slowRequests).toBe(0);
    });

    it('should handle very large response times', () => {
      const largeTimeMetrics: RequestMetrics = {
        correlationId: 'test-large',
        url: 'https://api.example.com/large',
        method: 'GET',
        statusCode: 200,
        responseTime: Number.MAX_SAFE_INTEGER,
        timestamp: new Date(),
        success: true,
      };
      
      service.recordRequest(largeTimeMetrics);
      
      const summary = service.getMetricsSummary();
      expect(summary.averageResponseTime).toBe(Number.MAX_SAFE_INTEGER);
      expect(summary.slowRequests).toBe(1);
    });

    it('should handle unusual status codes', () => {
      const unusualMetrics: RequestMetrics = {
        correlationId: 'test-unusual',
        url: 'https://api.example.com/unusual',
        method: 'GET',
        statusCode: 999,
        responseTime: 100,
        timestamp: new Date(),
        success: false,
      };
      
      service.recordRequest(unusualMetrics);
      
      const summary = service.getMetricsSummary();
      expect(summary.statusCodeDistribution[999]).toBe(1);
    });
  });
});