import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { TestStatusDto, TestStatusEnum, TestPhaseEnum } from './test-status.dto';

describe('TestStatusDto', () => {
  it('should create a valid test status', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 45,
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: 100,
      completedMutations: 45,
      startTime: '2023-12-01T10:00:00.000Z',
      endTime: '2023-12-01T10:05:30.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.id).toBe('123e4567-e89b-12d3-a456-426614174000');
    expect(dto.status).toBe(TestStatusEnum.RUNNING);
    expect(dto.progress).toBe(45);
    expect(dto.currentPhase).toBe(TestPhaseEnum.MUTATIONS);
    expect(dto.totalMutations).toBe(100);
    expect(dto.completedMutations).toBe(45);
    expect(dto.startTime).toBeInstanceOf(Date);
    expect(dto.endTime).toBeInstanceOf(Date);
  });

  it('should work without optional endTime', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 45,
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: 100,
      completedMutations: 45,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.endTime).toBeUndefined();
  });

  it('should validate progress range', async () => {
    const invalidDto1 = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: -1, // Invalid - below 0
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: 100,
      completedMutations: 45,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    let errors = await validate(invalidDto1);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('progress');

    const invalidDto2 = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 101, // Invalid - above 100
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: 100,
      completedMutations: 45,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    errors = await validate(invalidDto2);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('progress');
  });

  it('should accept valid progress range', async () => {
    const validProgresses = [0, 25, 50, 75, 100];
    
    for (const progress of validProgresses) {
      const dto = plainToClass(TestStatusDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: TestStatusEnum.RUNNING,
        progress,
        currentPhase: TestPhaseEnum.MUTATIONS,
        totalMutations: 100,
        completedMutations: progress,
        startTime: '2023-12-01T10:00:00.000Z'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should validate mutation counts are non-negative', async () => {
    const invalidDto1 = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 45,
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: -1, // Invalid
      completedMutations: 45,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    let errors = await validate(invalidDto1);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('totalMutations');

    const invalidDto2 = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 45,
      currentPhase: TestPhaseEnum.MUTATIONS,
      totalMutations: 100,
      completedMutations: -5, // Invalid
      startTime: '2023-12-01T10:00:00.000Z'
    });

    errors = await validate(invalidDto2);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('completedMutations');
  });

  it('should accept zero mutation counts', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.PENDING,
      progress: 0,
      currentPhase: TestPhaseEnum.VALIDATION,
      totalMutations: 0,
      completedMutations: 0,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should validate status enum values', async () => {
    const validStatuses = Object.values(TestStatusEnum);
    
    for (const status of validStatuses) {
      const dto = plainToClass(TestStatusDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status,
        progress: 0,
        currentPhase: TestPhaseEnum.VALIDATION,
        totalMutations: 100,
        completedMutations: 0,
        startTime: '2023-12-01T10:00:00.000Z'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject invalid status enum values', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: 'invalid-status' as any,
      progress: 0,
      currentPhase: TestPhaseEnum.VALIDATION,
      totalMutations: 100,
      completedMutations: 0,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('status');
  });

  it('should validate phase enum values', async () => {
    const validPhases = Object.values(TestPhaseEnum);
    
    for (const phase of validPhases) {
      const dto = plainToClass(TestStatusDto, {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: TestStatusEnum.RUNNING,
        progress: 50,
        currentPhase: phase,
        totalMutations: 100,
        completedMutations: 50,
        startTime: '2023-12-01T10:00:00.000Z'
      });

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    }
  });

  it('should reject invalid phase enum values', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.RUNNING,
      progress: 50,
      currentPhase: 'invalid-phase' as any,
      totalMutations: 100,
      completedMutations: 50,
      startTime: '2023-12-01T10:00:00.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('currentPhase');
  });

  it('should require all mandatory fields', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000'
      // Missing required fields
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
    
    const requiredFields = ['status', 'progress', 'currentPhase', 'totalMutations', 'completedMutations', 'startTime'];
    const errorProperties = errors.map(e => e.property);
    
    for (const field of requiredFields) {
      expect(errorProperties).toContain(field);
    }
  });

  it('should transform date strings to Date objects', async () => {
    const dto = plainToClass(TestStatusDto, {
      id: '123e4567-e89b-12d3-a456-426614174000',
      status: TestStatusEnum.COMPLETED,
      progress: 100,
      currentPhase: TestPhaseEnum.REPORT,
      totalMutations: 100,
      completedMutations: 100,
      startTime: '2023-12-01T10:00:00.000Z',
      endTime: '2023-12-01T10:05:30.000Z'
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
    expect(dto.startTime).toBeInstanceOf(Date);
    expect(dto.endTime).toBeInstanceOf(Date);
    expect(dto.startTime.toISOString()).toBe('2023-12-01T10:00:00.000Z');
    expect(dto.endTime.toISOString()).toBe('2023-12-01T10:05:30.000Z');
  });
});

describe('TestStatusEnum', () => {
  it('should have all expected values', () => {
    expect(TestStatusEnum.PENDING).toBe('pending');
    expect(TestStatusEnum.RUNNING).toBe('running');
    expect(TestStatusEnum.COMPLETED).toBe('completed');
    expect(TestStatusEnum.FAILED).toBe('failed');
  });

  it('should have exactly 4 values', () => {
    const values = Object.values(TestStatusEnum);
    expect(values).toHaveLength(4);
  });
});

describe('TestPhaseEnum', () => {
  it('should have all expected values', () => {
    expect(TestPhaseEnum.VALIDATION).toBe('validation');
    expect(TestPhaseEnum.HAPPY_PATH).toBe('happy-path');
    expect(TestPhaseEnum.MUTATIONS).toBe('mutations');
    expect(TestPhaseEnum.REPORT).toBe('report');
  });

  it('should have exactly 4 values', () => {
    const values = Object.values(TestPhaseEnum);
    expect(values).toHaveLength(4);
  });
});