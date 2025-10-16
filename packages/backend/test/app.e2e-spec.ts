import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpMethod } from '@api-mutation-tester/shared';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same configuration as in main.ts
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/ (GET)', () => {
    it('should return "Hello World!"', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(typeof res.body.timestamp).toBe('string');
        });
    });
  });

  describe('/api/tests (POST)', () => {
    it('should create a test with valid configuration', () => {
      const testConfig = {
        url: 'https://httpbin.org/post',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202)
        .expect((res) => {
          expect(res.body).toHaveProperty('testId');
          expect(typeof res.body.testId).toBe('string');
          expect(res.body.testId.length).toBeGreaterThan(0);
        });
    });

    it('should reject invalid URL', () => {
      const testConfig = {
        url: 'invalid-url',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(400);
    });

    it('should reject invalid method', () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: 'INVALID_METHOD',
        headers: {},
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(400);
    });

    it('should reject invalid timeout', () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: {},
        timeout: 500, // Below minimum
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(400);
    });

    it('should reject missing required fields', () => {
      const testConfig = {
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
        // missing url
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(400);
    });

    it('should accept GET request without payload', () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: { 'User-Agent': 'API-Mutation-Tester' },
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202);
    });

    it('should accept POST request with payload', () => {
      const testConfig = {
        url: 'https://httpbin.org/post',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'test', value: 123, nested: { prop: true } },
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202);
    });
  });

  describe('/api/tests/:id/status (GET)', () => {
    let testId: string;

    beforeEach(async () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202);

      testId = response.body.testId;
    });

    it('should return test status', () => {
      return request(app.getHttpServer())
        .get(`/api/tests/${testId}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testId);
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('progress');
          expect(res.body).toHaveProperty('currentPhase');
          expect(res.body).toHaveProperty('totalMutations');
          expect(res.body).toHaveProperty('completedMutations');
          expect(res.body).toHaveProperty('startTime');
          
          expect(['pending', 'running', 'completed', 'failed']).toContain(res.body.status);
          expect(typeof res.body.progress).toBe('number');
          expect(res.body.progress).toBeGreaterThanOrEqual(0);
          expect(res.body.progress).toBeLessThanOrEqual(100);
        });
    });

    it('should return 404 for non-existent test', () => {
      return request(app.getHttpServer())
        .get('/api/tests/non-existent-id/status')
        .expect(404);
    });
  });

  describe('/api/tests/:id/results (GET)', () => {
    let testId: string;

    beforeEach(async () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      const response = await request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202);

      testId = response.body.testId;

      // Wait a bit for test to start
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    it('should return test results', () => {
      return request(app.getHttpServer())
        .get(`/api/tests/${testId}/results`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('mutationResults');
          expect(Array.isArray(res.body.mutationResults)).toBeTruthy();
          
          // May or may not have happy path result yet
          if (res.body.happyPathResult) {
            expect(res.body.happyPathResult).toHaveProperty('id');
            expect(res.body.happyPathResult).toHaveProperty('isHappyPath', true);
            expect(res.body.happyPathResult).toHaveProperty('statusCode');
            expect(res.body.happyPathResult).toHaveProperty('responseTime');
          }
        });
    });

    it('should return 404 for non-existent test', () => {
      return request(app.getHttpServer())
        .get('/api/tests/non-existent-id/results')
        .expect(404);
    });
  });

  describe('Integration test flow', () => {
    it('should complete full test lifecycle', async () => {
      // 1. Create test
      const testConfig = {
        url: 'https://httpbin.org/post',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'integration' },
        timeout: 30000,
      };

      const createResponse = await request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202);

      const testId = createResponse.body.testId;
      expect(testId).toBeDefined();

      // 2. Check initial status
      const statusResponse = await request(app.getHttpServer())
        .get(`/api/tests/${testId}/status`)
        .expect(200);

      expect(statusResponse.body.id).toBe(testId);
      expect(['pending', 'running']).toContain(statusResponse.body.status);

      // 3. Wait for test to progress and check results
      await new Promise(resolve => setTimeout(resolve, 2000));

      const resultsResponse = await request(app.getHttpServer())
        .get(`/api/tests/${testId}/results`)
        .expect(200);

      expect(resultsResponse.body.mutationResults).toBeDefined();

      // 4. Check final status
      const finalStatusResponse = await request(app.getHttpServer())
        .get(`/api/tests/${testId}/status`)
        .expect(200);

      expect(finalStatusResponse.body.id).toBe(testId);
      // Status should be running or completed by now
      expect(['running', 'completed', 'failed']).toContain(finalStatusResponse.body.status);
    }, 30000); // Increase timeout for integration test

    it('should handle multiple concurrent tests', async () => {
      const testConfigs = [
        {
          url: 'https://httpbin.org/get',
          method: HttpMethod.GET,
          headers: {},
          timeout: 30000,
        },
        {
          url: 'https://httpbin.org/post',
          method: HttpMethod.POST,
          headers: { 'Content-Type': 'application/json' },
          payload: { test: 'concurrent1' },
          timeout: 30000,
        },
        {
          url: 'https://httpbin.org/put',
          method: HttpMethod.PUT,
          headers: { 'Content-Type': 'application/json' },
          payload: { test: 'concurrent2' },
          timeout: 30000,
        },
      ];

      // Create multiple tests concurrently
      const createPromises = testConfigs.map(config =>
        request(app.getHttpServer())
          .post('/api/tests')
          .send(config)
          .expect(202)
      );

      const createResponses = await Promise.all(createPromises);
      const testIds = createResponses.map(res => res.body.testId);

      expect(testIds).toHaveLength(3);
      expect(new Set(testIds).size).toBe(3); // All IDs should be unique

      // Check that all tests have valid status
      const statusPromises = testIds.map(testId =>
        request(app.getHttpServer())
          .get(`/api/tests/${testId}/status`)
          .expect(200)
      );

      const statusResponses = await Promise.all(statusPromises);
      
      statusResponses.forEach((response, index) => {
        expect(response.body.id).toBe(testIds[index]);
        expect(['pending', 'running', 'completed', 'failed']).toContain(response.body.status);
      });
    }, 30000);
  });

  describe('Error handling', () => {
    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/api/tests')
        .send('{"invalid": json}')
        .set('Content-Type', 'application/json')
        .expect(400);
    });

    it('should handle empty request body', () => {
      return request(app.getHttpServer())
        .post('/api/tests')
        .send({})
        .expect(400);
    });

    it('should handle extra fields in request', () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
        extraField: 'should be ignored',
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .expect(202); // Should succeed but ignore extra field
    });

    it('should validate content-type header', () => {
      const testConfig = {
        url: 'https://httpbin.org/get',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      return request(app.getHttpServer())
        .post('/api/tests')
        .send(testConfig)
        .set('Content-Type', 'text/plain')
        .expect(400);
    });
  });

  describe('CORS', () => {
    it('should handle CORS preflight request', () => {
      return request(app.getHttpServer())
        .options('/api/tests')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(204);
    });

    it('should include CORS headers in response', () => {
      return request(app.getHttpServer())
        .get('/health')
        .set('Origin', 'http://localhost:3000')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*');
    });
  });
});