import { Injectable, Logger } from '@nestjs/common';

export interface RequestMetrics {
  correlationId: string;
  url: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private readonly metrics: RequestMetrics[] = [];
  private readonly maxMetricsHistory = 10000; // Keep last 10k requests

  recordRequest(metrics: RequestMetrics): void {
    // Add to metrics history
    this.metrics.push(metrics);
    
    // Keep only the most recent metrics to prevent memory issues
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics.shift();
    }

    // Log detailed metrics
    this.logger.log(
      `[${metrics.correlationId}] Request metrics: ${metrics.method} ${metrics.url} - ` +
      `Status: ${metrics.statusCode}, Time: ${metrics.responseTime}ms, Success: ${metrics.success}`,
    );

    // Log performance warnings
    if (metrics.responseTime > 5000) {
      this.logger.warn(
        `[${metrics.correlationId}] Slow request detected: ${metrics.responseTime}ms for ${metrics.method} ${metrics.url}`,
      );
    }

    // Log error details
    if (!metrics.success && metrics.error) {
      this.logger.error(
        `[${metrics.correlationId}] Request failed: ${metrics.error}`,
      );
    }
  }

  getMetrics(): RequestMetrics[] {
    return [...this.metrics];
  }

  getMetricsSummary(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    slowRequests: number;
    statusCodeDistribution: Record<number, number>;
  } {
    const total = this.metrics.length;
    const successful = this.metrics.filter(m => m.success).length;
    const failed = total - successful;
    const averageResponseTime = total > 0 
      ? this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / total 
      : 0;
    const slowRequests = this.metrics.filter(m => m.responseTime > 5000).length;
    
    const statusCodeDistribution: Record<number, number> = {};
    this.metrics.forEach(m => {
      statusCodeDistribution[m.statusCode] = (statusCodeDistribution[m.statusCode] || 0) + 1;
    });

    return {
      totalRequests: total,
      successfulRequests: successful,
      failedRequests: failed,
      averageResponseTime: Math.round(averageResponseTime),
      slowRequests,
      statusCodeDistribution,
    };
  }

  clearMetrics(): void {
    this.metrics.length = 0;
    this.logger.log('Metrics history cleared');
  }
}