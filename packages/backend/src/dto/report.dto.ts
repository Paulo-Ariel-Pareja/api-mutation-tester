import {
  IsString,
  IsNumber,
  IsObject,
  IsNotEmpty,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { TestResultDto } from './test-result.dto';

export class ReportSummaryDto {
  @ApiProperty({
    description: 'Total number of tests executed (including happy path)',
    minimum: 0,
    example: 101
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  totalTests: number;

  @ApiProperty({
    description: 'Number of successful tests',
    minimum: 0,
    example: 85
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  successfulTests: number;

  @ApiProperty({
    description: 'Number of failed tests',
    minimum: 0,
    example: 16
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  failedTests: number;

  @ApiProperty({
    description: 'Number of vulnerabilities detected',
    minimum: 0,
    example: 3
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  vulnerabilitiesFound: number;

  @ApiProperty({
    description: 'Number of integrity issues detected',
    minimum: 0,
    example: 1
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  integrityIssues: number;

  @ApiProperty({
    description: 'Average response time in milliseconds',
    minimum: 0,
    example: 145.5
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  averageResponseTime: number;
}

export class ReportMetadataDto {
  @ApiProperty({
    description: 'Target API URL that was tested',
    format: 'uri',
    example: 'https://api.example.com/users'
  })
  @IsString()
  @IsNotEmpty()
  targetUrl: string;

  @ApiProperty({
    description: 'Test execution start date and time',
    format: 'date-time',
    example: '2023-12-01T10:00:00.000Z'
  })
  @Type(() => Date)
  @IsNotEmpty()
  executionDate: Date;

  @ApiProperty({
    description: 'Total test execution duration in milliseconds',
    minimum: 0,
    example: 330000
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  duration: number;
}

export class ReportDto {
  @ApiProperty({
    description: 'Test execution ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  @IsNotEmpty()
  testId: string;

  @ApiProperty({
    description: 'Test execution summary statistics',
    type: ReportSummaryDto
  })
  @ValidateNested()
  @Type(() => ReportSummaryDto)
  @IsNotEmpty()
  summary: ReportSummaryDto;

  @ApiProperty({
    description: 'Happy path test result',
    type: TestResultDto
  })
  @ValidateNested()
  @Type(() => TestResultDto)
  @IsNotEmpty()
  happyPathResult: TestResultDto;

  @ApiProperty({
    description: 'All mutation test results',
    type: [TestResultDto]
  })
  @ValidateNested({ each: true })
  @Type(() => TestResultDto)
  @IsNotEmpty()
  mutationResults: TestResultDto[];

  @ApiProperty({
    description: 'Test execution metadata',
    type: ReportMetadataDto
  })
  @ValidateNested()
  @Type(() => ReportMetadataDto)
  @IsNotEmpty()
  metadata: ReportMetadataDto;
}