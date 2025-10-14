import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message or array of validation errors',
    oneOf: [
      { type: 'string', example: 'URL must be a valid HTTP or HTTPS URL' },
      { 
        type: 'array', 
        items: { type: 'string' },
        example: ['URL must be a valid HTTP or HTTPS URL', 'Method must be one of: GET, POST, PUT, DELETE, PATCH']
      }
    ]
  })
  message: string | string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request'
  })
  error: string;

  @ApiPropertyOptional({
    description: 'Request timestamp',
    format: 'date-time',
    example: '2023-12-01T10:00:00.000Z'
  })
  timestamp?: string;

  @ApiPropertyOptional({
    description: 'Request path',
    example: '/api/tests'
  })
  path?: string;
}

export class ValidationErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Validation error messages',
    type: [String],
    example: [
      'URL must be a valid HTTP or HTTPS URL',
      'Method must be one of: GET, POST, PUT, DELETE, PATCH',
      'Timeout must be positive'
    ]
  })
  message: string[];

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request'
  })
  error: 'Bad Request';

  @ApiProperty({
    description: 'HTTP status code',
    example: 400
  })
  statusCode: 400;
}

export class NotFoundErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Not found error message',
    example: 'Test with ID 123e4567-e89b-12d3-a456-426614174000 not found'
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Not Found'
  })
  error: 'Not Found';

  @ApiProperty({
    description: 'HTTP status code',
    example: 404
  })
  statusCode: 404;
}

export class TooManyRequestsErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Rate limit error message',
    example: 'Maximum concurrent tests limit reached. Please try again later.'
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Too Many Requests'
  })
  error: 'Too Many Requests';

  @ApiProperty({
    description: 'HTTP status code',
    example: 429
  })
  statusCode: 429;
}

export class InternalServerErrorResponseDto extends ErrorResponseDto {
  @ApiProperty({
    description: 'Internal server error message',
    example: 'An unexpected error occurred while processing your request'
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Internal Server Error'
  })
  error: 'Internal Server Error';

  @ApiProperty({
    description: 'HTTP status code',
    example: 500
  })
  statusCode: 500;
}