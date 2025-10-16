import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { TestResultDto } from './test-result.dto';

describe('TestResultDto', () => {
  it('should create a valid test result', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      mutationId: 'mut-001-string-empty',
      isHappyPath: false,
      statusCode: 400,
      responseTime: 120,
      responseBody: { error: 'Invalid input', code: 'VALIDATION_ERROR' },
      error: 'Connection timeout',
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174001');
    expect(dto.mutationId).toBe('mut-001-string-empty');
    expect(dto.isHappyPath).toBe(false);
    expect(dto.statusCode).toBe(400);
    expect(dto.responseTime).toBe(120);
    expect(dto.responseBody).toEqual({ error: 'Invalid input', code: 'VALIDATION_ERROR' });
    expect(dto.error).toBe('Connection timeout');
    expect(dto.vulnerabilityDetected).toBe(false);
    expect(dto.integrityIssue).toBe(false);
    expect(dto.timestamp).toBeInstanceOf(Date);
  });

  it('should create a valid happy path result', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: true,
      statusCode: 200,
      responseTime: 95,
      responseBody: { success: true, data: [] },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.isHappyPath).toBe(true);
    expect(dto.mutationId).toBeUndefined();
    expect(dto.error).toBeUndefined();
  });

  it('should validate status code range', async () => {
    const invalidDto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: false,
      statusCode: 99, // Invalid - below 100
      responseTime: 120,
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    let errors = await validate(invalidDto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('statusCode');

    const invalidDto2 = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: false,
      statusCode: 600, // Invalid - above 599
      responseTime: 120,
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    errors = await validate(invalidDto2);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('statusCode');
  });

  it('should accept valid status code range', async () => {
    const validCodes = [100, 200, 404, 500, 599];
    
    for (const code of validCodes) {
      const dto = plainToClass(TestResultDto, {
        id: '123e4567-e89b-12d3-a456-426614174001',
        isHappyPath: false,
        statusCode: code,
        responseTime: 120,
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: '2023-12-01T10:01:00.000Z'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should validate response time is non-negative', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: false,
      statusCode: 200,
      responseTime: -10, // Invalid
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('responseTime');
  });

  it('should accept zero response time', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 0,
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should handle different response body types', async () => {
    const testCases = [
      { responseBody: null },
      { responseBody: undefined },
      { responseBody: 'string response' },
      { responseBody: 42 },
      { responseBody: true },
      { responseBody: { complex: { nested: 'object' } } },
      { responseBody: [1, 2, 3] }
    ];

    for (const testCase of testCases) {
      const dto = plainToClass(TestResultDto, {
        id: '123e4567-e89b-12d3-a456-426614174001',
        isHappyPath: false,
        statusCode: 200,
        responseTime: 100,
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: '2023-12-01T10:01:00.000Z',
        ...testCase
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should require all mandatory fields', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001'
      // Missing required fields
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    
    const requiredFields = ['isHappyPath', 'statusCode', 'responseTime', 'vulnerabilityDetected', 'integrityIssue', 'timestamp'];
    const errorProperties = errors.map(e => e.property);
    
    for (const field of requiredFields) {
      expect(errorProperties).toContain(field);
    }
  });

  it('should handle boolean fields correctly', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: true,
      statusCode: 200,
      responseTime: 100,
      vulnerabilityDetected: true,
      integrityIssue: true,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.isHappyPath).toBe(true);
    expect(dto.vulnerabilityDetected).toBe(true);
    expect(dto.integrityIssue).toBe(true);
  });

  it('should transform timestamp to Date object', async () => {
    const dto = plainToClass(TestResultDto, {
      id: '123e4567-e89b-12d3-a456-426614174001',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 100,
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: '2023-12-01T10:01:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.timestamp).toBeInstanceOf(Date);
    expect(dto.timestamp.toISOString()).toBe('2023-12-01T10:01:00.000Z');
  });
});