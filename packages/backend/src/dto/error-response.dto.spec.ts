import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import {
  ErrorResponseDto,
  ValidationErrorResponseDto,
  NotFoundErrorResponseDto,
  TooManyRequestsErrorResponseDto,
  InternalServerErrorResponseDto
} from './error-response.dto';

// Simple test class since the DTOs don't have validation decorators
class TestErrorDto {
  statusCode: number;
  message: string | string[];
  error: string;
  timestamp?: string;
  path?: string;
}

describe('Error Response DTOs', () => {
  describe('ErrorResponseDto', () => {
    it('should create a valid error response with string message', () => {
      const dto = plainToClass(ErrorResponseDto, {
        statusCode: 400,
        message: 'Bad request',
        error: 'Bad Request',
        timestamp: '2023-12-01T10:00:00.000Z',
        path: '/api/tests'
      });

      expect(dto.statusCode).toBe(400);
      expect(dto.message).toBe('Bad request');
      expect(dto.error).toBe('Bad Request');
      expect(dto.timestamp).toBe('2023-12-01T10:00:00.000Z');
      expect(dto.path).toBe('/api/tests');
    });

    it('should create a valid error response with array message', () => {
      const dto = plainToClass(ErrorResponseDto, {
        statusCode: 400,
        message: ['Error 1', 'Error 2'],
        error: 'Bad Request'
      });

      expect(dto.message).toEqual(['Error 1', 'Error 2']);
    });

    it('should work without optional fields', () => {
      const dto = plainToClass(ErrorResponseDto, {
        statusCode: 500,
        message: 'Internal error',
        error: 'Internal Server Error'
      });

      expect(dto.timestamp).toBeUndefined();
      expect(dto.path).toBeUndefined();
    });
  });

  describe('ValidationErrorResponseDto', () => {
    it('should create a valid validation error response', () => {
      const dto = plainToClass(ValidationErrorResponseDto, {
        statusCode: 400,
        message: ['URL is required', 'Method must be valid'],
        error: 'Bad Request',
        timestamp: '2023-12-01T10:00:00.000Z',
        path: '/api/tests'
      });

      expect(dto.statusCode).toBe(400);
      expect(dto.message).toEqual(['URL is required', 'Method must be valid']);
      expect(dto.error).toBe('Bad Request');
    });

    it('should inherit from ErrorResponseDto', () => {
      const dto = new ValidationErrorResponseDto();
      expect(dto).toBeInstanceOf(ErrorResponseDto);
    });
  });

  describe('NotFoundErrorResponseDto', () => {
    it('should create a valid not found error response', () => {
      const dto = plainToClass(NotFoundErrorResponseDto, {
        statusCode: 404,
        message: 'Test not found',
        error: 'Not Found',
        timestamp: '2023-12-01T10:00:00.000Z',
        path: '/api/tests/123'
      });

      expect(dto.statusCode).toBe(404);
      expect(dto.message).toBe('Test not found');
      expect(dto.error).toBe('Not Found');
    });

    it('should inherit from ErrorResponseDto', () => {
      const dto = new NotFoundErrorResponseDto();
      expect(dto).toBeInstanceOf(ErrorResponseDto);
    });
  });

  describe('TooManyRequestsErrorResponseDto', () => {
    it('should create a valid rate limit error response', () => {
      const dto = plainToClass(TooManyRequestsErrorResponseDto, {
        statusCode: 429,
        message: 'Rate limit exceeded',
        error: 'Too Many Requests',
        timestamp: '2023-12-01T10:00:00.000Z',
        path: '/api/tests'
      });

      expect(dto.statusCode).toBe(429);
      expect(dto.message).toBe('Rate limit exceeded');
      expect(dto.error).toBe('Too Many Requests');
    });

    it('should inherit from ErrorResponseDto', () => {
      const dto = new TooManyRequestsErrorResponseDto();
      expect(dto).toBeInstanceOf(ErrorResponseDto);
    });
  });

  describe('InternalServerErrorResponseDto', () => {
    it('should create a valid internal server error response', () => {
      const dto = plainToClass(InternalServerErrorResponseDto, {
        statusCode: 500,
        message: 'Internal server error',
        error: 'Internal Server Error',
        timestamp: '2023-12-01T10:00:00.000Z',
        path: '/api/tests'
      });

      expect(dto.statusCode).toBe(500);
      expect(dto.message).toBe('Internal server error');
      expect(dto.error).toBe('Internal Server Error');
    });

    it('should inherit from ErrorResponseDto', () => {
      const dto = new InternalServerErrorResponseDto();
      expect(dto).toBeInstanceOf(ErrorResponseDto);
    });
  });
});