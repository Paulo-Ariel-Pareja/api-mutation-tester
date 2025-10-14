import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
  Logger,
  UsePipes,
  ValidationPipe,
  Res,
  Header,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { TestExecutionService } from '../services/test-execution.service';
import { ReportGeneratorService } from '../services/report-generator.service';
import { 
  CreateTestConfigDto, 
  TestStatusDto, 
  TestResultDto, 
  ReportDto,
  ValidationErrorResponseDto,
  NotFoundErrorResponseDto,
  TooManyRequestsErrorResponseDto,
  InternalServerErrorResponseDto
} from '../dto';
import { TestStatus, TestResult, Report } from '@api-mutation-tester/shared';

@ApiTags('tests')
@Controller('api/tests')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class TestsController {
  private readonly logger = new Logger(TestsController.name);

  constructor(
    private readonly testExecutionService: TestExecutionService,
    private readonly reportGeneratorService: ReportGeneratorService,
  ) {}

  /**
   * Create and execute a new test
   */
  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Create and execute a new API mutation test',
    description: 'Starts a new test execution with the provided configuration. The test will run asynchronously.',
  })
  @ApiBody({
    type: CreateTestConfigDto,
    description: 'Test configuration including URL, method, headers, and payload'
  })
  @ApiResponse({
    status: 202,
    description: 'Test execution started successfully',
    schema: {
      type: 'object',
      properties: {
        testId: {
          type: 'string',
          format: 'uuid',
          description: 'Unique identifier for the test execution'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid test configuration',
    type: ValidationErrorResponseDto
  })
  @ApiResponse({
    status: 429,
    description: 'Too many concurrent tests',
    type: TooManyRequestsErrorResponseDto
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: InternalServerErrorResponseDto
  })
  async createTest(@Body() createTestDto: CreateTestConfigDto): Promise<{ testId: string }> {
    this.logger.log(`Creating new test: ${createTestDto.method} ${createTestDto.url}`);

    try {
      const result = await this.testExecutionService.executeTest(createTestDto);
      
      this.logger.log(`Test created successfully with ID: ${result.testId}`);
      return result;
    } catch (error) {
      this.logger.error('Failed to create test:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to create test execution');
    }
  }

  /**
   * Get test execution status and progress
   */
  @Get(':id/status')
  @ApiOperation({
    summary: 'Get test execution status',
    description: 'Retrieves the current status and progress of a test execution',
  })
  @ApiParam({
    name: 'id',
    description: 'Test execution ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Test status retrieved successfully',
    type: TestStatusDto,
    example: {
      'Running Test': {
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'running',
          progress: 45,
          currentPhase: 'mutations',
          totalMutations: 100,
          completedMutations: 45,
          startTime: '2023-12-01T10:00:00.000Z',
          endTime: null
        }
      },
      'Completed Test': {
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          status: 'completed',
          progress: 100,
          currentPhase: 'report',
          totalMutations: 100,
          completedMutations: 100,
          startTime: '2023-12-01T10:00:00.000Z',
          endTime: '2023-12-01T10:05:30.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
    type: NotFoundErrorResponseDto
  })
  async getTestStatus(@Param('id') testId: string): Promise<TestStatus> {
    this.logger.log(`Getting status for test: ${testId}`);

    try {
      const status = await this.testExecutionService.getTestStatus(testId);
      
      this.logger.log(`Retrieved status for test ${testId}: ${status.status} (${status.progress}%)`);
      return status;
    } catch (error) {
      this.logger.error(`Failed to get status for test ${testId}:`, error);
      
      if (error instanceof BadRequestException) {
        throw new NotFoundException(error.message);
      }
      
      throw new NotFoundException(`Test with ID ${testId} not found`);
    }
  }

  /**
   * Get test execution results
   */
  @Get(':id/results')
  @ApiOperation({
    summary: 'Get test execution results',
    description: 'Retrieves the detailed results of a test execution including happy path and mutation results',
  })
  @ApiParam({
    name: 'id',
    description: 'Test execution ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Test results retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        happyPathResult: {
          $ref: '#/components/schemas/TestResultDto',
          description: 'Result of the happy path execution'
        },
        mutationResults: {
          type: 'array',
          items: { $ref: '#/components/schemas/TestResultDto' },
          description: 'Results of all mutation executions'
        }
      }
    },
    example: {
      'Test Results': {
        value: {
          happyPathResult: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            mutationId: null,
            isHappyPath: true,
            statusCode: 200,
            responseTime: 150,
            responseBody: { success: true, data: [] },
            error: null,
            vulnerabilityDetected: false,
            integrityIssue: false,
            timestamp: '2023-12-01T10:00:30.000Z'
          },
          mutationResults: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              mutationId: 'mut-001',
              isHappyPath: false,
              statusCode: 400,
              responseTime: 120,
              responseBody: { error: 'Invalid input' },
              error: null,
              vulnerabilityDetected: false,
              integrityIssue: false,
              timestamp: '2023-12-01T10:01:00.000Z'
            }
          ]
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
    type: NotFoundErrorResponseDto
  })
  async getTestResults(@Param('id') testId: string): Promise<{ happyPathResult?: TestResult; mutationResults: TestResult[] }> {
    this.logger.log(`Getting results for test: ${testId}`);

    try {
      const results = await this.testExecutionService.getTestResults(testId);
      
      this.logger.log(`Retrieved results for test ${testId}: ${results.mutationResults.length} mutation results`);
      return results;
    } catch (error) {
      this.logger.error(`Failed to get results for test ${testId}:`, error);
      
      if (error instanceof BadRequestException) {
        throw new NotFoundException(error.message);
      }
      
      throw new NotFoundException(`Test with ID ${testId} not found`);
    }
  }

  /**
   * Get test report with analysis
   */
  @Get(':id/report')
  @ApiOperation({
    summary: 'Get test execution report',
    description: 'Retrieves a comprehensive report with analysis and statistics for a completed test',
  })
  @ApiParam({
    name: 'id',
    description: 'Test execution ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Test report retrieved successfully',
    type: ReportDto,
    example: {
      'Test Report': {
        value: {
          testId: '123e4567-e89b-12d3-a456-426614174000',
          summary: {
            totalTests: 101,
            successfulTests: 85,
            failedTests: 16,
            vulnerabilitiesFound: 3,
            integrityIssues: 1,
            averageResponseTime: 145.5
          },
          happyPathResult: {
            id: '123e4567-e89b-12d3-a456-426614174001',
            mutationId: null,
            isHappyPath: true,
            statusCode: 200,
            responseTime: 150,
            responseBody: { success: true },
            error: null,
            vulnerabilityDetected: false,
            integrityIssue: false,
            timestamp: '2023-12-01T10:00:30.000Z'
          },
          mutationResults: [],
          metadata: {
            targetUrl: 'https://api.example.com/users',
            executionDate: '2023-12-01T10:00:00.000Z',
            duration: 330000
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
    type: NotFoundErrorResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Test not completed yet',
    type: ValidationErrorResponseDto
  })
  async getTestReport(@Param('id') testId: string): Promise<Report> {
    this.logger.log(`Getting report for test: ${testId}`);

    try {
      // Get test execution details
      const testExecution = await this.testExecutionService.getTestExecution(testId);
      
      // Check if test is completed
      if (testExecution.status.status !== 'completed') {
        throw new BadRequestException('Test is still running. Report will be available when test completes.');
      }

      // Ensure we have results
      if (!testExecution.results.happyPathResult) {
        throw new BadRequestException('Test results are not available for report generation.');
      }

      // Generate report
      const report = this.reportGeneratorService.generateReport(
        testId,
        testExecution.config,
        testExecution.results.happyPathResult,
        testExecution.results.mutationResults,
        testExecution.status.startTime,
        testExecution.status.endTime!
      );

      this.logger.log(`Generated report for test ${testId}: ${report.summary.totalTests} tests, ${report.summary.vulnerabilitiesFound} vulnerabilities`);
      return report;
    } catch (error) {
      this.logger.error(`Failed to get report for test ${testId}:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new NotFoundException(`Test with ID ${testId} not found`);
    }
  }

  /**
   * Download test report as JSON file
   */
  @Get(':id/export')
  @Header('Content-Type', 'application/json')
  @ApiOperation({
    summary: 'Export test report as JSON file',
    description: 'Downloads the complete test report as a JSON file with detailed analysis',
  })
  @ApiParam({
    name: 'id',
    description: 'Test execution ID',
    type: 'string',
    format: 'uuid'
  })
  @ApiResponse({
    status: 200,
    description: 'Report exported successfully',
    headers: {
      'Content-Type': {
        description: 'MIME type of the response',
        schema: { type: 'string', example: 'application/json' }
      },
      'Content-Disposition': {
        description: 'Attachment filename',
        schema: { type: 'string', example: 'attachment; filename="api-mutation-test-example-com-2023-12-01-10-00-00-123e4567.json"' }
      }
    },
    content: {
      'application/json': {
        schema: {
          type: 'object',
          description: 'Complete test report with analysis in JSON format'
        }
      }
    }
  })
  @ApiResponse({
    status: 404,
    description: 'Test not found',
    type: NotFoundErrorResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Test not completed yet or export failed',
    type: ValidationErrorResponseDto
  })
  async exportTestReport(@Param('id') testId: string, @Res() res: Response): Promise<void> {
    this.logger.log(`Exporting report for test: ${testId}`);

    try {
      // Get the report first
      const report = await this.getTestReport(testId);

      // Validate report for export
      if (!this.reportGeneratorService.validateReportForExport(report)) {
        throw new BadRequestException('Report data is invalid and cannot be exported');
      }

      // Generate JSON export
      const jsonData = this.reportGeneratorService.exportToJson(report);
      
      // Generate filename
      const filename = this.reportGeneratorService.generateExportFilename(report);

      // Set response headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(jsonData, 'utf8'));

      this.logger.log(`Exporting report for test ${testId} as ${filename} (${Buffer.byteLength(jsonData, 'utf8')} bytes)`);

      // Send the JSON data
      res.send(jsonData);
    } catch (error) {
      this.logger.error(`Failed to export report for test ${testId}:`, error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new BadRequestException('Failed to export test report');
    }
  }
}