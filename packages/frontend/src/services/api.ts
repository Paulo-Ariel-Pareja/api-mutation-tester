import axios, { AxiosError, AxiosResponse } from 'axios';
import { TestStatus, Report } from '@api-mutation-tester/shared';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3003';

// Create axios instance
const apiClient = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Enhanced error handling
export class ApiError extends Error {
  public status: number;
  public data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Request interceptor for logging and loading state
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(new ApiError('Request failed', 0, error));
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    console.error('API Response Error:', error.response?.data || error.message);
    
    let message = 'An unexpected error occurred';
    let status = 500;
    
    if (error.response) {
      // Server responded with error status
      status = error.response.status;
      const data = error.response.data as any;
      
      if (data?.message) {
        message = data.message;
      } else if (data?.error) {
        message = data.error;
      } else {
        switch (status) {
          case 400:
            message = 'Invalid request data';
            break;
          case 401:
            message = 'Unauthorized access';
            break;
          case 403:
            message = 'Access forbidden';
            break;
          case 404:
            message = 'Resource not found';
            break;
          case 408:
            message = 'Request timeout';
            break;
          case 429:
            message = 'Too many requests';
            break;
          case 500:
            message = 'Internal server error';
            break;
          case 502:
            message = 'Bad gateway';
            break;
          case 503:
            message = 'Service unavailable';
            break;
          default:
            message = `Server error (${status})`;
        }
      }
    } else if (error.request) {
      // Network error
      message = 'Network error - please check your connection';
      status = 0;
    } else if (error.code === 'ECONNABORTED') {
      // Timeout error
      message = 'Request timeout - please try again';
      status = 408;
    }
    
    return Promise.reject(new ApiError(message, status, error.response?.data));
  }
);

export interface CreateTestRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  payload?: any;
  timeout: number;
}

export interface CreateTestResponse {
  testId: string;
  message: string;
}

export const apiService = {
  // Create and start a new test
  createTest: async (config: CreateTestRequest): Promise<CreateTestResponse> => {
    const response = await apiClient.post<CreateTestResponse>('/tests', config);
    return response.data;
  },

  // Get test status
  getTestStatus: async (testId: string): Promise<TestStatus> => {
    const response = await apiClient.get<TestStatus>(`/tests/${testId}/status`);
    return response.data;
  },

  // Get test results
  getTestResults: async (testId: string): Promise<any> => {
    const response = await apiClient.get(`/tests/${testId}/results`);
    return response.data;
  },

  // Get test report
  getTestReport: async (testId: string): Promise<Report> => {
    const response = await apiClient.get<Report>(`/tests/${testId}/report`);
    return response.data;
  },

  // Export test report as JSON
  exportTestReport: async (testId: string): Promise<Blob> => {
    const response = await apiClient.get(`/tests/${testId}/export`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default apiService;