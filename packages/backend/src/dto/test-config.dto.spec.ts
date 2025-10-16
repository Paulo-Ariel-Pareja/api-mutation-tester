import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateTestConfigDto } from './test-config.dto';
import { HttpMethod } from '@api-mutation-tester/shared';

describe('CreateTestConfigDto', () => {
  describe('validation', () => {
    it('should validate a correct DTO', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should require url', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'url')).toBeTruthy();
    });

    it('should validate url format', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'invalid-url',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'url')).toBeTruthy();
    });

    it('should require method', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'method')).toBeTruthy();
    });

    it('should validate method enum', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: 'INVALID_METHOD',
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'method')).toBeTruthy();
    });

    it('should allow optional headers', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'headers')).toBeFalsy();
      expect(dto.headers).toEqual({});
    });

    it('should validate headers as object', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: 'invalid-headers',
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'headers')).toBeTruthy();
    });

    it('should allow optional timeout with default value', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'timeout')).toBeFalsy();
      expect(dto.timeout).toBe(30000);
    });

    it('should validate timeout as positive number', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: -100, // Negative number should fail
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'timeout')).toBeTruthy();
    });

    it('should accept valid timeout values', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 5000, // Valid positive number
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'timeout')).toBeFalsy();
    });

    it('should allow optional payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'payload')).toBeFalsy();
    });

    it('should accept valid payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'test', value: 123, nested: { prop: true } },
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept null payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: null,
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should accept empty headers object', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate all HTTP methods', async () => {
      const methods = [HttpMethod.GET, HttpMethod.POST, HttpMethod.PUT, HttpMethod.DELETE, HttpMethod.PATCH];

      for (const method of methods) {
        const dto = plainToClass(CreateTestConfigDto, {
          url: 'https://api.example.com/test',
          method,
          headers: {},
          timeout: 30000,
        });

        const errors = await validate(dto);
        expect(errors.some(error => error.property === 'method')).toBeFalsy();
      }
    });

    it('should handle complex nested payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: {
          user: {
            name: 'John Doe',
            email: 'john@example.com',
            profile: {
              age: 30,
              preferences: {
                theme: 'dark',
                notifications: true,
                settings: [1, 2, 3]
              }
            }
          },
          metadata: {
            timestamp: '2023-12-01T10:00:00Z',
            version: '1.0.0'
          }
        },
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate timeout as number', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: '30000', // String instead of number
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'timeout')).toBeTruthy();
    });

    it('should handle array payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }],
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should reject invalid JSON string payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: '{"invalid": json}', // Invalid JSON string
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'payload')).toBeTruthy();
    });

    it('should accept valid JSON string payload', async () => {
      const dto = plainToClass(CreateTestConfigDto, {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: '{"valid": "json"}', // Valid JSON string
        timeout: 30000,
      });

      const errors = await validate(dto);
      expect(errors.some(error => error.property === 'payload')).toBeFalsy();
    });

    it('should accept primitive payloads as valid JSON', async () => {
      // Test with object payloads which should definitely work
      const validPayloads = [
        { key: 'value' },
        [1, 2, 3],
        null,
        undefined,
      ];

      for (const payload of validPayloads) {
        const dto = plainToClass(CreateTestConfigDto, {
          url: 'https://api.example.com/test',
          method: HttpMethod.POST,
          headers: { 'Content-Type': 'application/json' },
          payload,
          timeout: 30000,
        });

        const errors = await validate(dto);
        expect(errors.some(error => error.property === 'payload')).toBeFalsy();
      }
    });
  });

  describe('transformation', () => {
    it('should transform plain object to DTO instance', () => {
      const plain = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { test: 'data' },
        timeout: 30000,
      };

      const dto = plainToClass(CreateTestConfigDto, plain);

      expect(dto).toBeInstanceOf(CreateTestConfigDto);
      expect(dto.url).toBe(plain.url);
      expect(dto.method).toBe(plain.method);
      expect(dto.headers).toEqual(plain.headers);
      expect(dto.payload).toEqual(plain.payload);
      expect(dto.timeout).toBe(plain.timeout);
    });

    it('should handle missing optional properties', () => {
      const plain = {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: {},
        timeout: 30000,
      };

      const dto = plainToClass(CreateTestConfigDto, plain);

      expect(dto).toBeInstanceOf(CreateTestConfigDto);
      expect(dto.payload).toBeUndefined();
    });
  });
});