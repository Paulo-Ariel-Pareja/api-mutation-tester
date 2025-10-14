import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TestStatusEnum {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum TestPhaseEnum {
  VALIDATION = 'validation',
  HAPPY_PATH = 'happy-path',
  MUTATIONS = 'mutations',
  REPORT = 'report',
}

export class TestStatusDto {
  @ApiProperty({
    description: 'Test execution ID',
    format: 'uuid',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsString()
  id: string;

  @ApiProperty({
    description: 'Current test execution status',
    enum: TestStatusEnum,
    example: TestStatusEnum.RUNNING
  })
  @IsEnum(TestStatusEnum)
  status: TestStatusEnum;

  @ApiProperty({
    description: 'Test execution progress percentage',
    minimum: 0,
    maximum: 100,
    example: 45
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  progress: number;

  @ApiProperty({
    description: 'Current execution phase',
    enum: TestPhaseEnum,
    example: TestPhaseEnum.MUTATIONS
  })
  @IsEnum(TestPhaseEnum)
  currentPhase: TestPhaseEnum;

  @ApiProperty({
    description: 'Total number of mutations to execute',
    minimum: 0,
    example: 100
  })
  @IsNumber()
  @Min(0)
  totalMutations: number;

  @ApiProperty({
    description: 'Number of completed mutations',
    minimum: 0,
    example: 45
  })
  @IsNumber()
  @Min(0)
  completedMutations: number;

  @ApiProperty({
    description: 'Test execution start time',
    format: 'date-time',
    example: '2023-12-01T10:00:00.000Z'
  })
  @Type(() => Date)
  startTime: Date;

  @ApiPropertyOptional({
    description: 'Test execution end time (null if still running)',
    format: 'date-time',
    example: '2023-12-01T10:05:30.000Z'
  })
  @IsOptional()
  @Type(() => Date)
  endTime?: Date;
}