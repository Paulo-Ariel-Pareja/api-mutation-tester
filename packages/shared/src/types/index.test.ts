import {
  HttpMethod,
  MutationType,
  TestConfig,
  HttpRequest,
  HttpResponse,
  Mutation,
  TestResult,
  TestStatus,
  Report,
} from './index';

describe('Shared Types', () => {
  describe('HttpMethod enum', () => {
    it('should have all HTTP methods', () => {
      expect(HttpMethod.GET).toBe('GET');
      expect(HttpMethod.POST).toBe('POST');
      expect(HttpMethod.PUT).toBe('PUT');
      expect(HttpMethod.DELETE).toBe('DELETE');
      expect(HttpMethod.PATCH).toBe('PATCH');
    });

    it('should have exactly 5 methods', () => {
      const methods = Object.values(HttpMethod);
      expect(methods).toHaveLength(5);
    });

    it('should be string enum', () => {
      Object.values(HttpMethod).forEach(method => {
        expect(typeof method).toBe('string');
      });
    });
  });

  describe('MutationType enum', () => {
    it('should have all mutation types', () => {
      expect(MutationType.STRING_EMPTY).toBe('STRING_EMPTY');
      expect(MutationType.STRING_LONG).toBe('STRING_LONG');
      expect(MutationType.STRING_MALICIOUS).toBe('STRING_MALICIOUS');
      expect(MutationType.TYPE_BOOLEAN).toBe('TYPE_BOOLEAN');
      expect(MutationType.TYPE_ARRAY).toBe('TYPE_ARRAY');
      expect(MutationType.TYPE_NULL).toBe('TYPE_NULL');
      expect(MutationType.TYPE_UNDEFINED).toBe('TYPE_UNDEFINED');
      expect(MutationType.NUMERIC_LARGE).toBe('NUMERIC_LARGE');
      expect(MutationType.NUMERIC_NEGATIVE).toBe('NUMERIC_NEGATIVE');
      expect(MutationType.NUMERIC_ZERO).toBe('NUMERIC_ZERO');
      expect(MutationType.SPECIAL_CHARACTERS).toBe('SPECIAL_CHARACTERS');
      expect(MutationType.UNICODE_CHARACTERS).toBe('UNICODE_CHARACTERS');
      expect(MutationType.MISSING_FIELD).toBe('MISSING_FIELD');
      expect(MutationType.EXTRA_FIELD).toBe('EXTRA_FIELD');
      expect(MutationType.INVALID_TYPE).toBe('INVALID_TYPE');
    });

    it('should have exactly 15 mutation types', () => {
      const types = Object.values(MutationType);
      expect(types).toHaveLength(15);
    });

    it('should be string enum', () => {
      Object.values(MutationType).forEach(type => {
        expect(typeof type).toBe('string');
      });
    });

    it('should have descriptive names', () => {
      Object.values(MutationType).forEach(type => {
        expect(type.length).toBeGreaterThan(3);
        expect(type).toMatch(/^[A-Z_]+$/);
      });
    });
  });

  describe('TestConfig interface', () => {
    it('should create valid TestConfig object', () => {
      const testConfig: TestConfig = {
        id: 'test-123',
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
        createdAt: new Date(),
      };

      expect(testConfig.id).toBe('test-123');
      expect(testConfig.url).toBe('https://api.example.com/test');
      expect(testConfig.method).toBe(HttpMethod.POST);
      expect(testConfig.headers).toEqual({ 'Content-Type': 'application/json' });
      expect(testConfig.payload).toEqual({ test: 'data' });
      expect(testConfig.timeout).toBe(30000);
      expect(testConfig.createdAt).toBeInstanceOf(Date);
    });

    it('should allow optional payload', () => {
      const testConfig: TestConfig = {
        id: 'test-123',
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
        createdAt: new Date(),
      };

      expect(testConfig.payload).toBeUndefined();
    });

    it('should allow different payload types', () => {
      const configs: TestConfig[] = [
        {
          id: 'test-1',
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { object: 'payload' },
          timeout: 30000,
          createdAt: new Date(),
        },
        {
          id: 'test-2',
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: 'string payload',
          timeout: 30000,
          createdAt: new Date(),
        },
        {
          id: 'test-3',
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: [1, 2, 3],
          timeout: 30000,
          createdAt: new Date(),
        },
      ];

      configs.forEach(config => {
        expect(config).toBeDefined();
        expect(config.payload).toBeDefined();
      });
    });
  });

  describe('HttpRequest interface', () => {
    it('should create valid HttpRequest object', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Authorization': 'Bearer token' },
        payload: { data: 'test' },
        timeout: 5000,
      };

      expect(request.url).toBe('https://api.example.com/test');
      expect(request.method).toBe(HttpMethod.POST);
      expect(request.headers).toEqual({ 'Authorization': 'Bearer token' });
      expect(request.payload).toEqual({ data: 'test' });
      expect(request.timeout).toBe(5000);
    });

    it('should allow optional payload', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 5000,
      };

      expect(request.payload).toBeUndefined();
    });
  });

  describe('HttpResponse interface', () => {
    it('should create valid HttpResponse object', () => {
      const response: HttpResponse = {
        statusCode: 200,
        responseTime: 150,
        responseBody: { success: true },
        headers: { 'Content-Type': 'application/json' },
      };

      expect(response.statusCode).toBe(200);
      expect(response.responseTime).toBe(150);
      expect(response.responseBody).toEqual({ success: true });
      expect(response.headers).toEqual({ 'Content-Type': 'application/json' });
    });

    it('should allow optional error', () => {
      const response: HttpResponse = {
        statusCode: 500,
        responseTime: 100,
        responseBody: null,
        headers: {},
        error: 'Internal server error',
      };

      expect(response.error).toBe('Internal server error');
    });

    it('should handle different response body types', () => {
      const responses: HttpResponse[] = [
        {
          statusCode: 200,
          responseTime: 100,
          responseBody: { object: true },
          headers: {},
        },
        {
          statusCode: 200,
          responseTime: 100,
          responseBody: 'string response',
          headers: {},
        },
        {
          statusCode: 200,
          responseTime: 100,
          responseBody: [1, 2, 3],
          headers: {},
        },
        {
          statusCode: 204,
          responseTime: 100,
          responseBody: null,
          headers: {},
        },
      ];

      responses.forEach(response => {
        expect(response).toBeDefined();
        expect(response.statusCode).toBeGreaterThan(0);
      });
    });
  });

  describe('Mutation interface', () => {
    it('should create valid Mutation object', () => {
      const mutation: Mutation = {
        id: 'mut-123',
        type: MutationType.STRING_EMPTY,
        description: 'Empty string mutation',
        modifiedRequest: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { field: '' },
          timeout: 5000,
        },
        originalField: 'field',
        mutationStrategy: 'Replace field with empty string',
      };

      expect(mutation.id).toBe('mut-123');
      expect(mutation.type).toBe(MutationType.STRING_EMPTY);
      expect(mutation.description).toBe('Empty string mutation');
      expect(mutation.modifiedRequest).toBeDefined();
      expect(mutation.originalField).toBe('field');
      expect(mutation.mutationStrategy).toBe('Replace field with empty string');
    });

    it('should allow optional originalField', () => {
      const mutation: Mutation = {
        id: 'mut-123',
        type: MutationType.EXTRA_FIELD,
        description: 'Add extra field',
        modifiedRequest: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          timeout: 5000,
        },
        mutationStrategy: 'Add unexpected field',
      };

      expect(mutation.originalField).toBeUndefined();
    });
  });

  describe('TestResult interface', () => {
    it('should create valid TestResult object', () => {
      const result: TestResult = {
        id: 'result-123',
        mutationId: 'mut-123',
        isHappyPath: false,
        statusCode: 400,
        responseTime: 120,
        responseBody: { error: 'Bad request' },
        error: undefined,
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
      };

      expect(result.id).toBe('result-123');
      expect(result.mutationId).toBe('mut-123');
      expect(result.isHappyPath).toBe(false);
      expect(result.statusCode).toBe(400);
      expect(result.responseTime).toBe(120);
      expect(result.responseBody).toEqual({ error: 'Bad request' });
      expect(result.vulnerabilityDetected).toBe(false);
      expect(result.integrityIssue).toBe(false);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create valid happy path result', () => {
      const result: TestResult = {
        id: 'result-happy',
        isHappyPath: true,
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
      };

      expect(result.isHappyPath).toBe(true);
      expect(result.mutationId).toBeUndefined();
    });

    it('should allow optional requestDetails', () => {
      const result: TestResult = {
        id: 'result-123',
        isHappyPath: false,
        statusCode: 200,
        responseTime: 100,
        responseBody: {},
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
        requestDetails: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { test: 'data' },
          mutationType: MutationType.STRING_EMPTY,
          mutationDescription: 'Empty string test',
        },
      };

      expect(result.requestDetails).toBeDefined();
      expect(result.requestDetails?.mutationType).toBe(MutationType.STRING_EMPTY);
    });
  });

  describe('TestStatus interface', () => {
    it('should create valid TestStatus object', () => {
      const status: TestStatus = {
        id: 'test-123',
        status: 'running',
        progress: 50,
        currentPhase: 'mutations',
        totalMutations: 100,
        completedMutations: 50,
        startTime: new Date(),
      };

      expect(status.id).toBe('test-123');
      expect(status.status).toBe('running');
      expect(status.progress).toBe(50);
      expect(status.currentPhase).toBe('mutations');
      expect(status.totalMutations).toBe(100);
      expect(status.completedMutations).toBe(50);
      expect(status.startTime).toBeInstanceOf(Date);
    });

    it('should allow optional endTime', () => {
      const status: TestStatus = {
        id: 'test-123',
        status: 'completed',
        progress: 100,
        currentPhase: 'report',
        totalMutations: 100,
        completedMutations: 100,
        startTime: new Date(),
        endTime: new Date(),
      };

      expect(status.endTime).toBeInstanceOf(Date);
    });

    it('should have valid status values', () => {
      const validStatuses = ['pending', 'running', 'completed', 'failed'];
      
      validStatuses.forEach(statusValue => {
        const status: TestStatus = {
          id: 'test-123',
          status: statusValue as any,
          progress: 0,
          currentPhase: 'validation',
          totalMutations: 0,
          completedMutations: 0,
          startTime: new Date(),
        };

        expect(status.status).toBe(statusValue);
      });
    });

    it('should have valid phase values', () => {
      const validPhases = ['validation', 'happy-path', 'mutations', 'report'];
      
      validPhases.forEach(phase => {
        const status: TestStatus = {
          id: 'test-123',
          status: 'running',
          progress: 0,
          currentPhase: phase as any,
          totalMutations: 0,
          completedMutations: 0,
          startTime: new Date(),
        };

        expect(status.currentPhase).toBe(phase);
      });
    });
  });

  describe('Report interface', () => {
    it('should create valid Report object', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 10,
          successfulTests: 8,
          failedTests: 2,
          vulnerabilitiesFound: 1,
          integrityIssues: 0,
          averageResponseTime: 150,
        },
        happyPathResult: {
          id: 'result-happy',
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
            id: 'result-1',
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

      expect(report.testId).toBe('test-123');
      expect(report.summary.totalTests).toBe(10);
      expect(report.happyPathResult.isHappyPath).toBe(true);
      expect(report.mutationResults).toHaveLength(1);
      expect(report.metadata.targetUrl).toBe('https://api.example.com/test');
    });

    it('should have consistent summary calculations', () => {
      const report: Report = {
        testId: 'test-123',
        summary: {
          totalTests: 3,
          successfulTests: 2,
          failedTests: 1,
          vulnerabilitiesFound: 1,
          integrityIssues: 0,
          averageResponseTime: 110,
        },
        happyPathResult: {
          id: 'result-happy',
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
            id: 'result-1',
            mutationId: 'mut-1',
            isHappyPath: false,
            statusCode: 200,
            responseTime: 120,
            responseBody: { success: true },
            vulnerabilityDetected: true,
            integrityIssue: false,
            timestamp: new Date(),
          },
          {
            id: 'result-2',
            mutationId: 'mut-2',
            isHappyPath: false,
            statusCode: 500,
            responseTime: 110,
            responseBody: null,
            error: 'Server error',
            vulnerabilityDetected: false,
            integrityIssue: false,
            timestamp: new Date(),
          },
        ],
        metadata: {
          targetUrl: 'https://api.example.com/test',
          executionDate: new Date(),
          duration: 180000,
        },
      };

      // Verify summary matches actual results
      const totalTests = 1 + report.mutationResults.length; // happy path + mutations
      expect(report.summary.totalTests).toBe(totalTests);

      const vulnerabilities = report.mutationResults.filter(r => r.vulnerabilityDetected).length;
      expect(report.summary.vulnerabilitiesFound).toBe(vulnerabilities);
    });
  });

  describe('Type compatibility', () => {
    it('should allow HttpRequest to be created from TestConfig', () => {
      const testConfig: TestConfig = {
        id: 'test-123',
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
        createdAt: new Date(),
      };

      const httpRequest: HttpRequest = {
        url: testConfig.url,
        method: testConfig.method,
        headers: testConfig.headers,
        payload: testConfig.payload,
        timeout: testConfig.timeout,
      };

      expect(httpRequest.url).toBe(testConfig.url);
      expect(httpRequest.method).toBe(testConfig.method);
      expect(httpRequest.headers).toEqual(testConfig.headers);
      expect(httpRequest.payload).toEqual(testConfig.payload);
      expect(httpRequest.timeout).toBe(testConfig.timeout);
    });

    it('should allow TestResult to reference Mutation', () => {
      const mutation: Mutation = {
        id: 'mut-123',
        type: MutationType.STRING_EMPTY,
        description: 'Empty string test',
        modifiedRequest: {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: {},
          payload: { field: '' },
          timeout: 5000,
        },
        mutationStrategy: 'Test empty string validation',
      };

      const testResult: TestResult = {
        id: 'result-123',
        mutationId: mutation.id,
        isHappyPath: false,
        statusCode: 400,
        responseTime: 120,
        responseBody: { error: 'Field is required' },
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
        requestDetails: {
          url: mutation.modifiedRequest.url,
          method: mutation.modifiedRequest.method,
          headers: mutation.modifiedRequest.headers,
          payload: mutation.modifiedRequest.payload,
          mutationType: mutation.type,
          mutationDescription: mutation.description,
        },
      };

      expect(testResult.mutationId).toBe(mutation.id);
      expect(testResult.requestDetails?.mutationType).toBe(mutation.type);
    });
  });
});