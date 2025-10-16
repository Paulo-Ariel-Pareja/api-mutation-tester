import {
  IsString,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  IsDate,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TestResultDto {
  @ApiProperty({
    description: 'Test result ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174001'
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiPropertyOptional({
    description: 'Mutation ID (null for happy path)',
    format: 'uuid',
    example: 'mut-001-string-empty'
  })
  @IsOptional()
  @IsString()
  mutationId?: string;

  @ApiProperty({
    description: 'Whether this is the happy path test',
    example: false
  })
  @IsBoolean()
  @IsNotEmpty()
  isHappyPath: boolean;

  @ApiProperty({
    description: 'HTTP response status code',
    minimum: 100,
    maximum: 599,
    example: 400
  })
  @IsNumber()
  @Min(100)
  @Max(599)
  @IsNotEmpty()
  statusCode: number;

  @ApiProperty({
    description: 'Response time in milliseconds',
    minimum: 0,
    example: 120
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  responseTime: number;

  @ApiPropertyOptional({
    description: 'HTTP response body',
    example: { error: 'Invalid input', code: 'VALIDATION_ERROR' }
  })
  @IsOptional()
  responseBody: any;

  @ApiPropertyOptional({
    description: 'Error message if request failed',
    example: 'Connection timeout'
  })
  @IsOptional()
  @IsString()
  error?: string;

  @ApiProperty({
    description: 'Whether a vulnerability was detected',
    example: false
  })
  @IsBoolean()
  @IsNotEmpty()
  vulnerabilityDetected: boolean;

  @ApiProperty({
    description: 'Whether an integrity issue was detected',
    example: false
  })
  @IsBoolean()
  @IsNotEmpty()
  integrityIssue: boolean;

  @ApiProperty({
    description: 'Test execution timestamp',
    format: 'date-time',
    example: '2023-12-01T10:01:00.000Z'
  })
  @Type(() => Date)
  @IsDate()
  @IsNotEmpty()
  timestamp: Date;
}