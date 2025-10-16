import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { TestsController } from './tests.controller';
import { TestExecutionService } from '../services/test-execution.service';
import { ReportGeneratorService } from '../services/report-generator.service';
import { CreateTestConfigDto } from '../dto/test-config.dto';
import { HttpMethod, TestStatus, TestResult, Report } from '@api-mutation-tester/shared';

describe('TestsController', () => {
  let controller: TestsController;
  let testExecutionService: TestExecutionService;
  let reportGeneratorService: ReportGeneratorService;

  const mockTestExecutionService = {
    executeTest: jest.fn(),
    getTestStatus: jest.fn(),
    getTestResults: jest.fn(),
    getTestExecution: jest.fn(),
  };

  const mockReportGeneratorService = {
    generateReport: jest.fn(),
    validateReportForExport: jest.fn(),
    exportToJson: jest.fn(),
    generateExportFilename: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TestsController],
      providers: [
        {
          provide: TestExecutionService,
          useValue: mockTestExecutionService,
        },
        {
          provide: ReportGeneratorService,
          useValue: mockReportGeneratorService,
        },
      ],
    }).compile();

    controller = module.get<TestsController>(TestsController);
    testExecutionService = module.get<TestExecutionService>(TestExecutionService);
    reportGeneratorService = module.get<ReportGeneratorService>(ReportGeneratorService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTest', () => {
    const validTestConfig: CreateTestConfigDto = {
      url: 'https://api.example.com/test',
      method: HttpMethod.POST,
      headers: { 'Content-Type': 'application/json' },
      payload: { test: 'data' },
      timeout: 30000,
    };

    it('should create a test successfully', async () => {
      const expectedResult = { testId: 'test-123' };
      mockTestExecutionService.executeTest.mockResolvedValue(expectedResult);

      const result = await controller.createTest(validTestConfig);

      expect(result).toEqual(expectedResult);
      expect(mockTestExecutionService.executeTest).toHaveBeenCalledWith(validTestConfig);
    });

    it('should handle BadRequestException from service', async () => {
      const error = new BadRequestException('Invalid configuration');
      mockTestExecutionService.executeTest.mockRejectedValue(error);

      await expect(controller.createTest(validTestConfig)).rejects.toThrow(BadRequestException);
    });

    it('should wrap other errors in BadRequestException', async () => {
      const error = new Error('Unexpected error');
      mockTestExecutionService.executeTest.mockRejectedValue(error);

      await expect(controller.createTest(validTestConfig)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getTestStatus', () => {
    const testId = 'test-123';
    const mockStatus: TestStatus = {
      id: testId,
      status: 'running',
      progress: 50,
      currentPhase: 'mutations',
      totalMutations: 100,
      completedMutations: 50,
      startTime: new Date(),
    };

    it('should return test status successfully', async () => {
      mockTestExecutionService.getTestStatus.mockResolvedValue(mockStatus);

      const result = await controller.getTestStatus(testId);

      expect(result).toEqual(mockStatus);
      expect(mockTestExecutionService.getTestStatus).toHaveBeenCalledWith(testId);
    });

    it('should handle test not found', async () => {
      const error = new BadRequestException('Test not found');
      mockTestExecutionService.getTestStatus.mockRejectedValue(error);

      await expect(controller.getTestStatus(testId)).rejects.toThrow(NotFoundException);
    });

    it('should wrap other errors in NotFoundException', async () => {
      const error = new Error('Unexpected error');
      mockTestExecutionService.getTestStatus.mockRejectedValue(error);

      await expect(controller.getTestStatus(testId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTestResults', () => {
    const testId = 'test-123';
    const mockResults = {
      happyPathResult: {
        id: 'result-1',
        isHappyPath: true,
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
      } as TestResult,
      mutationResults: [
        {
          id: 'result-2',
          mutationId: 'mut-1',
          isHappyPath: false,
          statusCode: 400,
          responseTime: 120,
          responseBody: { error: 'Bad request' },
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        } as TestResult,
      ],
    };

    it('should return test results successfully', async () => {
      mockTestExecutionService.getTestResults.mockResolvedValue(mockResults);

      const result = await controller.getTestResults(testId);

      expect(result).toEqual(mockResults);
      expect(mockTestExecutionService.getTestResults).toHaveBeenCalledWith(testId);
    });

    it('should handle test not found', async () => {
      const error = new BadRequestException('Test not found');
      mockTestExecutionService.getTestResults.mockRejectedValue(error);

      await expect(controller.getTestResults(testId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTestReport', () => {
    const testId = 'test-123';
    const mockTestExecution = {
      status: { status: 'completed', startTime: new Date(), endTime: new Date() },
      config: { url: 'https://api.example.com', method: HttpMethod.GET },
      results: {
        happyPathResult: {
          id: 'result-1',
          isHappyPath: true,
          statusCode: 200,
          responseTime: 100,
          responseBody: { success: true },
          vulnerabilityDetected: false,
          integrityIssue: false,
          timestamp: new Date(),
        } as TestResult,
        mutationResults: [],
      },
    };

    const mockReport: Report = {
      testId,
      summary: {
        totalTests: 1,
        successfulTests: 1,
        failedTests: 0,
        vulnerabilitiesFound: 0,
        integrityIssues: 0,
        averageResponseTime: 100,
      },
      happyPathResult: mockTestExecution.results.happyPathResult,
      mutationResults: [],
      metadata: {
        targetUrl: 'https://api.example.com',
        executionDate: new Date(),
        duration: 1000,
      },
    };

    it('should return test report successfully', async () => {
      mockTestExecutionService.getTestExecution.mockResolvedValue(mockTestExecution);
      mockReportGeneratorService.generateReport.mockReturnValue(mockReport);

      const result = await controller.getTestReport(testId);

      expect(result).toEqual(mockReport);
      expect(mockTestExecutionService.getTestExecution).toHaveBeenCalledWith(testId);
      expect(mockReportGeneratorService.generateReport).toHaveBeenCalled();
    });

    it('should throw BadRequestException if test is not completed', async () => {
      const incompleteExecution = {
        ...mockTestExecution,
        status: { status: 'running' },
      };
      mockTestExecutionService.getTestExecution.mockResolvedValue(incompleteExecution);

      await expect(controller.getTestReport(testId)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no happy path result', async () => {
      const executionWithoutResults = {
        ...mockTestExecution,
        results: { happyPathResult: null, mutationResults: [] },
      };
      mockTestExecutionService.getTestExecution.mockResolvedValue(executionWithoutResults);

      await expect(controller.getTestReport(testId)).rejects.toThrow(BadRequestException);
    });
  });

  describe('exportTestReport', () => {
    const testId = 'test-123';
    const mockReport: Report = {
      testId,
      summary: {
        totalTests: 1,
        successfulTests: 1,
        failedTests: 0,
        vulnerabilitiesFound: 0,
        integrityIssues: 0,
        averageResponseTime: 100,
      },
      happyPathResult: {
        id: 'result-1',
        isHappyPath: true,
        statusCode: 200,
        responseTime: 100,
        responseBody: { success: true },
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
      } as TestResult,
      mutationResults: [],
      metadata: {
        targetUrl: 'https://api.example.com',
        executionDate: new Date(),
        duration: 1000,
      },
    };

    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
      // Mock the getTestReport method
      jest.spyOn(controller, 'getTestReport').mockResolvedValue(mockReport);
    });

    it('should export test report successfully', async () => {
      const jsonData = JSON.stringify(mockReport);
      const filename = 'test-report.json';

      mockReportGeneratorService.validateReportForExport.mockReturnValue(true);
      mockReportGeneratorService.exportToJson.mockReturnValue(jsonData);
      mockReportGeneratorService.generateExportFilename.mockReturnValue(filename);

      await controller.exportTestReport(testId, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Disposition', `attachment; filename="${filename}"`);
      expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Length', Buffer.byteLength(jsonData, 'utf8'));
      expect(mockResponse.send).toHaveBeenCalledWith(jsonData);
    });

    it('should throw BadRequestException if report validation fails', async () => {
      mockReportGeneratorService.validateReportForExport.mockReturnValue(false);

      await expect(controller.exportTestReport(testId, mockResponse)).rejects.toThrow(BadRequestException);
    });

    it('should handle errors during export', async () => {
      mockReportGeneratorService.validateReportForExport.mockReturnValue(true);
      mockReportGeneratorService.exportToJson.mockImplementation(() => {
        throw new Error('Export failed');
      });

      await expect(controller.exportTestReport(testId, mockResponse)).rejects.toThrow(BadRequestException);
    });
  });
});