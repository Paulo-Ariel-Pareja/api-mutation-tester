import {
  IsString,
  IsUrl,
  IsEnum,
  IsObject,
  IsOptional,
  IsNumber,
  IsPositive,
  ValidateNested,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HttpMethod } from '@api-mutation-tester/shared';
import { IsValidUrl, IsValidJson, IsValidHeaders } from '../validators/custom-validators';

export class CreateTestConfigDto {
  @ApiProperty({
    description: 'Target API endpoint URL',
    example: 'https://api.example.com/users',
    format: 'uri'
  })
  @IsValidUrl({ message: 'URL must be a valid HTTP or HTTPS URL' })
  @IsNotEmpty({ message: 'URL is required' })
  url: string;

  @ApiProperty({
    description: 'HTTP method for the request',
    enum: HttpMethod,
    example: HttpMethod.POST
  })
  @IsEnum(HttpMethod, { message: 'Method must be one of: GET, POST, PUT, DELETE, PATCH' })
  method: HttpMethod;

  @ApiPropertyOptional({
    description: 'HTTP headers to include in the request',
    example: {
      'Authorization': 'Bearer token123',
      'Content-Type': 'application/json',
      'X-API-Key': 'your-api-key'
    }
  })
  @IsValidHeaders({ message: 'Headers must be an object with valid header names and string values' })
  @IsOptional()
  @Transform(({ value }) => value || {})
  headers: Record<string, string> = {};

  @ApiPropertyOptional({
    description: 'Request payload (for POST, PUT, PATCH methods)',
    example: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    }
  })
  @IsValidJson({ message: 'Payload must be valid JSON' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return value; // Let the validator handle the error
      }
    }
    return value;
  })
  payload?: any;

  @ApiPropertyOptional({
    description: 'Request timeout in milliseconds',
    minimum: 1000,
    maximum: 300000,
    default: 30000,
    example: 30000
  })
  @IsNumber({}, { message: 'Timeout must be a number' })
  @IsPositive({ message: 'Timeout must be positive' })
  @IsOptional()
  @Transform(({ value }) => value || 30000)
  timeout: number = 30000;
}

export class TestConfigResponseDto {
  @ApiProperty({
    description: 'Unique test configuration ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Target API endpoint URL',
    format: 'uri',
    example: 'https://api.example.com/users'
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'HTTP method',
    enum: HttpMethod,
    example: HttpMethod.POST
  })
  @IsEnum(HttpMethod)
  method: HttpMethod;

  @ApiProperty({
    description: 'HTTP headers',
    example: { 'Content-Type': 'application/json' }
  })
  @IsObject()
  headers: Record<string, string>;

  @ApiPropertyOptional({
    description: 'Request payload'
  })
  @IsOptional()
  payload?: any;

  @ApiProperty({
    description: 'Request timeout in milliseconds',
    example: 30000
  })
  @IsNumber()
  @IsPositive()
  timeout: number;

  @ApiProperty({
    description: 'Configuration creation timestamp',
    format: 'date-time',
    example: '2023-12-01T10:00:00.000Z'
  })
  @Type(() => Date)
  createdAt: Date;
}