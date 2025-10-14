import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { 
  TestConfig, 
  HttpRequest, 
  TestResult, 
  TestStatus, 
  Mutation,
  Report 
} from '@api-mutation-tester/shared';
import { CreateTestConfigDto } from '../dto/test-config.dto';
import { TestStatusEnum, TestPhaseEnum } from '../dto/test-status.dto';
import { HttpClientService } from './http-client.service';
import { MutationGeneratorService } from './mutation-generator.service';
import { VulnerabilityDetectorService } from './vulnerability-detector.service';

interface TestExecution {
  id: string;
  config: TestConfig;
  status: TestStatusEnum;
  progress: number;
  currentPhase: TestPhaseEnum;
  totalMutations: number;
  completedMutations: number;
  startTime: Date;
  endTime?: Date;
  happyPathResult?: TestResult;
  mutationResults: TestResult[];
  cancelled: boolean;
}

@Injectable()
export class TestExecutionService {
  private readonly logger = new Logger(TestExecutionService.name);
  private readonly activeTests = new Map<string, TestExecution>();
  private readonly maxConcurrentTests = 10;

  constructor(
    private readonly httpClientService: HttpClientService,
    private readonly mutationGeneratorService: MutationGeneratorService,
    private readonly vulnerabilityDetectorService: VulnerabilityDetectorService,
  ) {}

  /**
   * Execute a complete test including happy path and mutations
   */
  async executeTest(configDto: CreateTestConfigDto): Promise<{ testId: string }> {
    // Validate configuration
    this.validateTestConfiguration(configDto);

    // Check concurrent test limits
    if (this.activeTests.size >= this.maxConcurrentTests) {
      throw new BadRequestException('Maximum concurrent tests limit reached. Please try again later.');
    }

    // Create test configuration
    const testConfig: TestConfig = {
      id: uuidv4(),
      url: configDto.url,
      method: configDto.method,
      headers: configDto.headers,
      payload: configDto.payload,
      timeout: configDto.timeout,
      createdAt: new Date(),
    };

    // Initialize test execution
    const testExecution: TestExecution = {
      id: testConfig.id,
      config: testConfig,
      status: TestStatusEnum.PENDING,
      progress: 0,
      currentPhase: TestPhaseEnum.VALIDATION,
      totalMutations: 0,
      completedMutations: 0,
      startTime: new Date(),
      mutationResults: [],
      cancelled: false,
    };

    this.activeTests.set(testConfig.id, testExecution);

    this.logger.log(`Starting test execution for ${testConfig.id}: ${testConfig.method} ${testConfig.url}`);

    // Execute test asynchronously
    this.executeTestAsync(testExecution).catch((error) => {
      this.logger.error(`Test execution failed for ${testConfig.id}:`, error);
      testExecution.status = TestStatusEnum.FAILED;
      testExecution.endTime = new Date();
    });

    return { testId: testConfig.id };
  }

  /**
   * Get the current status of a test execution
   */
  async getTestStatus(testId: string): Promise<TestStatus> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    return {
      id: testExecution.id,
      status: testExecution.status,
      progress: testExecution.progress,
      currentPhase: testExecution.currentPhase,
      totalMutations: testExecution.totalMutations,
      completedMutations: testExecution.completedMutations,
      startTime: testExecution.startTime,
      endTime: testExecution.endTime,
    };
  }

  /**
   * Cancel a running test
   */
  async cancelTest(testId: string): Promise<void> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    if (testExecution.status === TestStatusEnum.COMPLETED || testExecution.status === TestStatusEnum.FAILED) {
      throw new BadRequestException(`Test ${testId} is already completed and cannot be cancelled`);
    }

    this.logger.log(`Cancelling test execution ${testId}`);
    testExecution.cancelled = true;
    testExecution.status = TestStatusEnum.FAILED;
    testExecution.endTime = new Date();
  }

  /**
   * Get test results
   */
  async getTestResults(testId: string): Promise<{ happyPathResult?: TestResult; mutationResults: TestResult[] }> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    return {
      happyPathResult: testExecution.happyPathResult,
      mutationResults: testExecution.mutationResults,
    };
  }

  /**
   * Clean up completed tests (remove from memory after some time)
   */
  cleanupCompletedTests(maxAge: number = 3600000): void { // 1 hour default
    const now = Date.now();
    const toRemove: string[] = [];

    for (const [testId, testExecution] of this.activeTests.entries()) {
      if (
        (testExecution.status === TestStatusEnum.COMPLETED || testExecution.status === TestStatusEnum.FAILED) &&
        testExecution.endTime &&
        now - testExecution.endTime.getTime() > maxAge
      ) {
        toRemove.push(testId);
      }
    }

    toRemove.forEach(testId => {
      this.activeTests.delete(testId);
      this.logger.log(`Cleaned up completed test ${testId}`);
    });
  }

  /**
   * Validate test configuration
   */
  private validateTestConfiguration(config: CreateTestConfigDto): void {
    // URL validation
    try {
      const url = new URL(config.url);
      if (!['http:', 'https:'].includes(url.protocol)) {
        throw new BadRequestException('URL must use HTTP or HTTPS protocol');
      }
    } catch (error) {
      throw new BadRequestException('Invalid URL format');
    }

    // Timeout validation
    if (config.timeout < 1000 || config.timeout > 300000) {
      throw new BadRequestException('Timeout must be between 1000ms and 300000ms (5 minutes)');
    }

    // Payload validation for methods that support it
    const methodsWithPayload = ['POST', 'PUT', 'PATCH'];
    if (methodsWithPayload.includes(config.method) && config.payload === undefined) {
      this.logger.warn(`${config.method} request without payload - this may be intentional`);
    }

    // Headers validation
    if (config.headers) {
      for (const [key, value] of Object.entries(config.headers)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          throw new BadRequestException('All headers must be string key-value pairs');
        }
        if (key.trim() === '') {
          throw new BadRequestException('Header names cannot be empty');
        }
      }
    }
  }

  /**
   * Execute the test asynchronously
   */
  private async executeTestAsync(testExecution: TestExecution): Promise<void> {
    try {
      testExecution.status = TestStatusEnum.RUNNING;
      testExecution.currentPhase = TestPhaseEnum.HAPPY_PATH;
      testExecution.progress = 10;

      this.logger.log(`Executing happy path for test ${testExecution.id}`);

      // Execute happy path
      const happyPathResult = await this.executeHappyPath(testExecution);
      
      if (testExecution.cancelled) {
        return;
      }

      // If happy path failed, stop execution
      if (!happyPathResult || happyPathResult.error || happyPathResult.statusCode >= 400) {
        const errorMessage = happyPathResult?.error || `Happy path failed with status ${happyPathResult?.statusCode}`;
        this.logger.error(`Happy path failed for test ${testExecution.id}: ${errorMessage}`);
        testExecution.status = TestStatusEnum.FAILED;
        testExecution.endTime = new Date();
        return;
      }

      testExecution.happyPathResult = happyPathResult;
      testExecution.progress = 20;

      this.logger.log(`Happy path successful for test ${testExecution.id}, proceeding with mutations`);

      // Generate mutations
      testExecution.currentPhase = TestPhaseEnum.MUTATIONS;
      testExecution.progress = 25;

      const mutations = await this.generateMutations(testExecution);
      testExecution.totalMutations = mutations.length;

      if (testExecution.cancelled) {
        return;
      }

      // Execute mutations
      await this.executeMutations(testExecution, mutations);

      if (testExecution.cancelled) {
        return;
      }

      // Complete test
      testExecution.status = TestStatusEnum.COMPLETED;
      testExecution.endTime = new Date();
      testExecution.progress = 100;

      this.logger.log(`Test execution completed for ${testExecution.id}: ${testExecution.mutationResults.length} mutations executed`);

    } catch (error) {
      this.logger.error(`Test execution error for ${testExecution.id}:`, error);
      testExecution.status = TestStatusEnum.FAILED;
      testExecution.endTime = new Date();
      throw error;
    }
  }

  /**
   * Execute the happy path test
   */
  private async executeHappyPath(testExecution: TestExecution): Promise<TestResult> {
    const { config } = testExecution;
    
    this.logger.log(`Executing happy path: ${config.method} ${config.url}`);

    // Create HTTP request from test configuration
    const httpRequest: HttpRequest = {
      url: config.url,
      method: config.method,
      headers: config.headers,
      payload: config.payload,
      timeout: config.timeout,
    };

    try {
      // Execute the request
      const httpResponse = await this.httpClientService.executeRequest(httpRequest);

      // Create test result
      const testResult: TestResult = {
        id: uuidv4(),
        mutationId: undefined,
        isHappyPath: true,
        statusCode: httpResponse.statusCode,
        responseTime: httpResponse.responseTime,
        responseBody: httpResponse.responseBody,
        error: httpResponse.error,
        vulnerabilityDetected: false, // Happy path doesn't check for vulnerabilities
        integrityIssue: false, // Happy path doesn't check for integrity issues
        timestamp: new Date(),
        requestDetails: {
          url: httpRequest.url,
          method: httpRequest.method,
          headers: httpRequest.headers,
          payload: httpRequest.payload,
          mutationType: undefined, // Happy path doesn't have mutations
          mutationDescription: 'Original request (happy path)',
        },
      };

      this.logger.log(
        `Happy path completed for test ${testExecution.id}: ${httpResponse.statusCode} in ${httpResponse.responseTime}ms`
      );

      return testResult;

    } catch (error) {
      this.logger.error(`Happy path execution failed for test ${testExecution.id}:`, error);

      // Create error test result
      const testResult: TestResult = {
        id: uuidv4(),
        mutationId: undefined,
        isHappyPath: true,
        statusCode: 0,
        responseTime: 0,
        responseBody: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
        requestDetails: {
          url: httpRequest.url,
          method: httpRequest.method,
          headers: httpRequest.headers,
          payload: httpRequest.payload,
          mutationType: undefined,
          mutationDescription: 'Original request (happy path) - Failed',
        },
      };

      return testResult;
    }
  }

  /**
   * Generate mutations for the test configuration
   */
  private async generateMutations(testExecution: TestExecution): Promise<Mutation[]> {
    const { config } = testExecution;
    
    this.logger.log(`Generating mutations for test ${testExecution.id}`);

    // Create HTTP request from test configuration
    const httpRequest: HttpRequest = {
      url: config.url,
      method: config.method,
      headers: config.headers,
      payload: config.payload,
      timeout: config.timeout,
    };

    try {
      const mutations = this.mutationGeneratorService.generateMutations(httpRequest);
      
      this.logger.log(`Generated ${mutations.length} mutations for test ${testExecution.id}`);
      
      return mutations;
    } catch (error) {
      this.logger.error(`Failed to generate mutations for test ${testExecution.id}:`, error);
      throw error;
    }
  }

  /**
   * Execute mutations with concurrency control and progress tracking
   */
  private async executeMutations(testExecution: TestExecution, mutations: Mutation[]): Promise<void> {
    const maxConcurrentMutations = 5; // Limit concurrent mutations to prevent overwhelming the target API
    const batchSize = Math.min(maxConcurrentMutations, mutations.length);
    
    this.logger.log(`Executing ${mutations.length} mutations for test ${testExecution.id} with concurrency ${batchSize}`);

    // Execute mutations in batches
    for (let i = 0; i < mutations.length; i += batchSize) {
      if (testExecution.cancelled) {
        this.logger.log(`Test ${testExecution.id} was cancelled, stopping mutation execution`);
        break;
      }

      const batch = mutations.slice(i, i + batchSize);
      const batchPromises = batch.map(mutation => this.executeSingleMutation(testExecution, mutation));

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        // Process batch results
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value) {
            testExecution.mutationResults.push(result.value);
          } else if (result.status === 'rejected') {
            this.logger.error(`Mutation ${batch[index].id} failed:`, result.reason);
            // Create error result for failed mutation
            const errorResult: TestResult = {
              id: uuidv4(),
              mutationId: batch[index].id,
              isHappyPath: false,
              statusCode: 0,
              responseTime: 0,
              responseBody: null,
              error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
              vulnerabilityDetected: false,
              integrityIssue: false,
              timestamp: new Date(),
              requestDetails: {
                url: batch[index].modifiedRequest.url,
                method: batch[index].modifiedRequest.method,
                headers: batch[index].modifiedRequest.headers,
                payload: batch[index].modifiedRequest.payload,
                mutationType: batch[index].type,
                mutationDescription: `${batch[index].description} - Batch execution failed`,
              },
            };
            testExecution.mutationResults.push(errorResult);
          }
        });

        // Update progress
        testExecution.completedMutations = Math.min(i + batchSize, mutations.length);
        const mutationProgress = (testExecution.completedMutations / testExecution.totalMutations) * 70; // 70% of total progress for mutations
        testExecution.progress = 25 + mutationProgress; // Start from 25% (after happy path)

        this.logger.log(
          `Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(mutations.length / batchSize)} for test ${testExecution.id} ` +
          `(${testExecution.completedMutations}/${testExecution.totalMutations} mutations)`
        );

        // Add delay between batches to be respectful to the target API
        if (i + batchSize < mutations.length && !testExecution.cancelled) {
          await this.delay(100); // 100ms delay between batches
        }

      } catch (error) {
        this.logger.error(`Batch execution failed for test ${testExecution.id}:`, error);
        // Continue with next batch instead of failing the entire test
      }
    }

    this.logger.log(`Mutation execution completed for test ${testExecution.id}: ${testExecution.mutationResults.length} results`);
  }

  /**
   * Execute a single mutation
   */
  private async executeSingleMutation(testExecution: TestExecution, mutation: Mutation): Promise<TestResult | null> {
    if (testExecution.cancelled) {
      return null;
    }

    const startTime = Date.now();
    
    try {
      this.logger.debug(`Executing mutation ${mutation.id} for test ${testExecution.id}: ${mutation.description}`);

      // Execute the mutated request
      const httpResponse = await this.httpClientService.executeRequest(mutation.modifiedRequest);
      const executionTime = Date.now() - startTime;

      // Detect vulnerabilities and integrity issues
      const tempResult: TestResult = {
        id: uuidv4(),
        mutationId: mutation.id,
        isHappyPath: false,
        statusCode: httpResponse.statusCode,
        responseTime: httpResponse.responseTime,
        responseBody: httpResponse.responseBody,
        error: httpResponse.error,
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
        requestDetails: {
          url: mutation.modifiedRequest.url,
          method: mutation.modifiedRequest.method,
          headers: mutation.modifiedRequest.headers,
          payload: mutation.modifiedRequest.payload,
          mutationType: mutation.type,
          mutationDescription: mutation.description,
        },
      };

      const vulnerabilityDetected = this.vulnerabilityDetectorService.detectVulnerability(mutation, tempResult);
      const integrityIssue = this.vulnerabilityDetectorService.detectIntegrityIssue(mutation, tempResult, testExecution.happyPathResult);

      // Create test result
      const testResult: TestResult = {
        id: uuidv4(),
        mutationId: mutation.id,
        isHappyPath: false,
        statusCode: httpResponse.statusCode,
        responseTime: httpResponse.responseTime,
        responseBody: httpResponse.responseBody,
        error: httpResponse.error,
        vulnerabilityDetected,
        integrityIssue,
        timestamp: new Date(),
        requestDetails: {
          url: mutation.modifiedRequest.url,
          method: mutation.modifiedRequest.method,
          headers: mutation.modifiedRequest.headers,
          payload: mutation.modifiedRequest.payload,
          mutationType: mutation.type,
          mutationDescription: mutation.description,
        },
      };

      if (vulnerabilityDetected) {
        this.logger.warn(`Vulnerability detected in mutation ${mutation.id} for test ${testExecution.id}`);
      }

      if (integrityIssue) {
        this.logger.warn(`Integrity issue detected in mutation ${mutation.id} for test ${testExecution.id}`);
      }

      this.logger.debug(
        `Mutation ${mutation.id} completed: ${httpResponse.statusCode} in ${httpResponse.responseTime}ms ` +
        `(vulnerability: ${vulnerabilityDetected}, integrity: ${integrityIssue})`
      );

      return testResult;

    } catch (error) {
      const executionTime = Date.now() - startTime;
      this.logger.error(`Mutation ${mutation.id} execution failed after ${executionTime}ms:`, error);

      // Create error test result
      const testResult: TestResult = {
        id: uuidv4(),
        mutationId: mutation.id,
        isHappyPath: false,
        statusCode: 0,
        responseTime: executionTime,
        responseBody: null,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date(),
        requestDetails: {
          url: mutation.modifiedRequest.url,
          method: mutation.modifiedRequest.method,
          headers: mutation.modifiedRequest.headers,
          payload: mutation.modifiedRequest.payload,
          mutationType: mutation.type,
          mutationDescription: `${mutation.description} - Failed`,
        },
      };

      return testResult;
    }
  }

  /**
   * Utility method to add delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get all active tests
   */
  async getActiveTests(): Promise<TestStatus[]> {
    const activeTests: TestStatus[] = [];
    
    for (const testExecution of this.activeTests.values()) {
      activeTests.push({
        id: testExecution.id,
        status: testExecution.status,
        progress: testExecution.progress,
        currentPhase: testExecution.currentPhase,
        totalMutations: testExecution.totalMutations,
        completedMutations: testExecution.completedMutations,
        startTime: testExecution.startTime,
        endTime: testExecution.endTime,
      });
    }

    return activeTests;
  }

  /**
   * Get test configuration
   */
  async getTestConfig(testId: string): Promise<TestConfig> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    return testExecution.config;
  }

  /**
   * Get detailed test execution information
   */
  async getTestExecution(testId: string): Promise<{
    config: TestConfig;
    status: TestStatus;
    results: { happyPathResult?: TestResult; mutationResults: TestResult[] };
  }> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    return {
      config: testExecution.config,
      status: {
        id: testExecution.id,
        status: testExecution.status,
        progress: testExecution.progress,
        currentPhase: testExecution.currentPhase,
        totalMutations: testExecution.totalMutations,
        completedMutations: testExecution.completedMutations,
        startTime: testExecution.startTime,
        endTime: testExecution.endTime,
      },
      results: {
        happyPathResult: testExecution.happyPathResult,
        mutationResults: testExecution.mutationResults,
      },
    };
  }

  /**
   * Get test statistics
   */
  async getTestStatistics(): Promise<{
    totalTests: number;
    activeTests: number;
    completedTests: number;
    failedTests: number;
    averageExecutionTime: number;
  }> {
    let completedCount = 0;
    let failedCount = 0;
    let totalExecutionTime = 0;
    let executionTimeCount = 0;

    for (const testExecution of this.activeTests.values()) {
      if (testExecution.status === TestStatusEnum.COMPLETED) {
        completedCount++;
        if (testExecution.endTime) {
          totalExecutionTime += testExecution.endTime.getTime() - testExecution.startTime.getTime();
          executionTimeCount++;
        }
      } else if (testExecution.status === TestStatusEnum.FAILED) {
        failedCount++;
        if (testExecution.endTime) {
          totalExecutionTime += testExecution.endTime.getTime() - testExecution.startTime.getTime();
          executionTimeCount++;
        }
      }
    }

    const activeCount = this.activeTests.size - completedCount - failedCount;
    const averageExecutionTime = executionTimeCount > 0 ? totalExecutionTime / executionTimeCount : 0;

    return {
      totalTests: this.activeTests.size,
      activeTests: activeCount,
      completedTests: completedCount,
      failedTests: failedCount,
      averageExecutionTime,
    };
  }

  /**
   * Force cleanup of a specific test
   */
  async forceCleanupTest(testId: string): Promise<void> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    if (testExecution.status === TestStatusEnum.RUNNING) {
      this.logger.warn(`Force cleaning up running test ${testId}`);
      testExecution.cancelled = true;
      testExecution.status = TestStatusEnum.FAILED;
      testExecution.endTime = new Date();
    }

    this.activeTests.delete(testId);
    this.logger.log(`Force cleaned up test ${testId}`);
  }



  /**
   * Pause a running test (if supported)
   */
  async pauseTest(testId: string): Promise<void> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    if (testExecution.status !== TestStatusEnum.RUNNING) {
      throw new BadRequestException(`Test ${testId} is not currently running and cannot be paused`);
    }

    // For now, we'll just log the pause request
    // In a more advanced implementation, you could implement actual pause/resume functionality
    this.logger.log(`Pause requested for test ${testId} (not implemented - use cancel instead)`);
    throw new BadRequestException('Pause functionality not implemented. Use cancel instead.');
  }

  /**
   * Resume a paused test (if supported)
   */
  async resumeTest(testId: string): Promise<void> {
    const testExecution = this.activeTests.get(testId);
    
    if (!testExecution) {
      throw new BadRequestException(`Test with ID ${testId} not found`);
    }

    // For now, we'll just log the resume request
    this.logger.log(`Resume requested for test ${testId} (not implemented)`);
    throw new BadRequestException('Resume functionality not implemented.');
  }
}