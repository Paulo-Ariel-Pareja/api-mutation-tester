import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosInstance, AxiosResponse, AxiosError } from "axios";
import { HttpRequest, HttpResponse } from "@api-mutation-tester/shared";
import { MetricsService, RequestMetrics } from "./metrics.service";

@Injectable()
export class HttpClientService {
  private readonly logger = new Logger(HttpClientService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(private readonly metricsService: MetricsService) {
    this.axiosInstance = axios.create({
      timeout: 30000, // Default 30 second timeout
      validateStatus: () => true, // Accept all status codes
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        const correlationId = this.generateCorrelationId();
        (config as any).metadata = { correlationId, startTime: Date.now() };

        this.logger.log(
          `[${correlationId}] Outgoing request: ${config.method?.toUpperCase()} ${config.url}`
        );

        return config;
      },
      (error) => {
        this.logger.error("Request interceptor error:", error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and metrics
    this.axiosInstance.interceptors.response.use(
      (response) => {
        const { correlationId, startTime } = (response.config as any).metadata || {};
        const responseTime = Date.now() - (startTime || Date.now());

        this.logger.log(
          `[${correlationId}] Response received: ${response.status} in ${responseTime}ms`
        );

        return response;
      },
      (error) => {
        const { correlationId, startTime } = error.config?.metadata || {};
        const responseTime = Date.now() - (startTime || Date.now());

        this.logger.error(
          `[${correlationId}] Request failed in ${responseTime}ms:`,
          error.message
        );

        return Promise.reject(error);
      }
    );
  }

  private generateCorrelationId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getMetrics() {
    return this.metricsService.getMetrics();
  }

  getMetricsSummary() {
    return this.metricsService.getMetricsSummary();
  }

  clearMetrics() {
    this.metricsService.clearMetrics();
  }

  async executeRequest(request: HttpRequest): Promise<HttpResponse> {
    const startTime = Date.now();
    const correlationId = this.generateCorrelationId();

    try {
      this.logger.log(
        `[${correlationId}] Executing ${request.method} request to ${request.url}`
      );

      const axiosConfig = {
        method: request.method.toLowerCase(),
        url: request.url,
        headers: {
          ...request.headers,
          "X-Correlation-ID": correlationId,
        },
        timeout: request.timeout || 30000,
        data: request.payload,
        metadata: { correlationId, startTime },
      };

      const response: AxiosResponse =
        await this.axiosInstance.request(axiosConfig);
      const responseTime = Date.now() - startTime;

      const httpResponse: HttpResponse = {
        statusCode: response.status,
        responseTime,
        responseBody: response.data,
        headers: response.headers as Record<string, string>,
      };

      // Record metrics
      const metrics: RequestMetrics = {
        correlationId,
        url: request.url,
        method: request.method,
        statusCode: response.status,
        responseTime,
        timestamp: new Date(),
        success: response.status < 400,
      };
      this.metricsService.recordRequest(metrics);

      this.logger.log(
        `[${correlationId}] Request completed successfully: ${response.status} in ${responseTime}ms`
      );

      return httpResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        this.logger.error(
          `[${correlationId}] Axios error after ${responseTime}ms:`,
          {
            message: axiosError.message,
            code: axiosError.code,
            status: axiosError.response?.status,
            url: request.url,
          }
        );

        // Handle timeout errors
        if (
          axiosError.code === "ECONNABORTED" ||
          axiosError.message.includes("timeout")
        ) {
          const errorMessage = `Request timeout after ${request.timeout || 30000}ms`;
          const metrics: RequestMetrics = {
            correlationId,
            url: request.url,
            method: request.method,
            statusCode: 0,
            responseTime,
            timestamp: new Date(),
            success: false,
            error: errorMessage,
          };
          this.metricsService.recordRequest(metrics);

          return {
            statusCode: 0,
            responseTime,
            responseBody: null,
            headers: {},
            error: errorMessage,
          };
        }

        // Handle connection errors
        if (
          axiosError.code === "ECONNREFUSED" ||
          axiosError.code === "ENOTFOUND"
        ) {
          const errorMessage = `Connection error: ${axiosError.message}`;
          const metrics: RequestMetrics = {
            correlationId,
            url: request.url,
            method: request.method,
            statusCode: 0,
            responseTime,
            timestamp: new Date(),
            success: false,
            error: errorMessage,
          };
          this.metricsService.recordRequest(metrics);

          return {
            statusCode: 0,
            responseTime,
            responseBody: null,
            headers: {},
            error: errorMessage,
          };
        }

        // Handle HTTP error responses
        if (axiosError.response) {
          const errorMessage = `HTTP ${axiosError.response.status}: ${axiosError.response.statusText}`;
          const metrics: RequestMetrics = {
            correlationId,
            url: request.url,
            method: request.method,
            statusCode: axiosError.response.status,
            responseTime,
            timestamp: new Date(),
            success: false,
            error: errorMessage,
          };
          this.metricsService.recordRequest(metrics);

          return {
            statusCode: axiosError.response.status,
            responseTime,
            responseBody: axiosError.response.data,
            headers: axiosError.response.headers as Record<string, string>,
            error: errorMessage,
          };
        }
      }

      // Handle other types of errors
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      const metrics: RequestMetrics = {
        correlationId,
        url: request.url,
        method: request.method,
        statusCode: 0,
        responseTime,
        timestamp: new Date(),
        success: false,
        error: errorMessage,
      };
      this.metricsService.recordRequest(metrics);

      this.logger.error(
        `[${correlationId}] Unexpected error after ${responseTime}ms:`,
        error
      );

      return {
        statusCode: 0,
        responseTime,
        responseBody: null,
        headers: {},
        error: errorMessage,
      };
    }
  }
}
