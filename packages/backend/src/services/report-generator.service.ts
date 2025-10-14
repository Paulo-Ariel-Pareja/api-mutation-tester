import { Injectable, Logger } from '@nestjs/common';
import { TestResult, TestConfig, Report } from '@api-mutation-tester/shared';

@Injectable()
export class ReportGeneratorService {
  private readonly logger = new Logger(ReportGeneratorService.name);

  /**
   * Generate a comprehensive report from test results
   */
  generateReport(
    testId: string,
    testConfig: TestConfig,
    happyPathResult: TestResult,
    mutationResults: TestResult[],
    startTime: Date,
    endTime: Date
  ): Report {
    this.logger.log(`Generating report for test ${testId} with ${mutationResults.length} mutation results`);

    try {
      // Calculate summary statistics
      const summary = this.calculateSummaryStatistics(happyPathResult, mutationResults);

      // Calculate test duration
      const duration = endTime.getTime() - startTime.getTime();

      // Create report
      const report: Report = {
        testId,
        summary,
        happyPathResult,
        mutationResults,
        metadata: {
          targetUrl: testConfig.url,
          executionDate: startTime,
          duration,
        },
      };

      this.logger.log(
        `Report generated for test ${testId}: ${summary.totalTests} total tests, ` +
        `${summary.vulnerabilitiesFound} vulnerabilities, ${summary.integrityIssues} integrity issues`
      );

      return report;
    } catch (error) {
      this.logger.error(`Failed to generate report for test ${testId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate summary statistics from test results
   */
  private calculateSummaryStatistics(
    happyPathResult: TestResult,
    mutationResults: TestResult[]
  ): Report['summary'] {
    // Include happy path in total count
    const allResults = [happyPathResult, ...mutationResults];
    const totalTests = allResults.length;

    // Categorize results
    let successfulTests = 0;
    let failedTests = 0;
    let vulnerabilitiesFound = 0;
    let integrityIssues = 0;
    let totalResponseTime = 0;

    for (const result of allResults) {
      // Count successful vs failed tests
      if (result.error || result.statusCode >= 400) {
        failedTests++;
      } else {
        successfulTests++;
      }

      // Count vulnerabilities and integrity issues
      if (result.vulnerabilityDetected) {
        vulnerabilitiesFound++;
      }

      if (result.integrityIssue) {
        integrityIssues++;
      }

      // Sum response times for average calculation
      totalResponseTime += result.responseTime;
    }

    // Calculate average response time
    const averageResponseTime = totalTests > 0 ? totalResponseTime / totalTests : 0;

    return {
      totalTests,
      successfulTests,
      failedTests,
      vulnerabilitiesFound,
      integrityIssues,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100, // Round to 2 decimal places
    };
  }

  /**
   * Get categorized results for detailed analysis
   */
  getCategorizedResults(mutationResults: TestResult[]): {
    successful: TestResult[];
    failed: TestResult[];
    vulnerabilities: TestResult[];
    integrityIssues: TestResult[];
  } {
    const successful: TestResult[] = [];
    const failed: TestResult[] = [];
    const vulnerabilities: TestResult[] = [];
    const integrityIssues: TestResult[] = [];

    for (const result of mutationResults) {
      // Categorize by success/failure
      if (result.error || result.statusCode >= 400) {
        failed.push(result);
      } else {
        successful.push(result);
      }

      // Categorize by security issues
      if (result.vulnerabilityDetected) {
        vulnerabilities.push(result);
      }

      if (result.integrityIssue) {
        integrityIssues.push(result);
      }
    }

    return {
      successful,
      failed,
      vulnerabilities,
      integrityIssues,
    };
  }

  /**
   * Get response time statistics
   */
  getResponseTimeStatistics(results: TestResult[]): {
    min: number;
    max: number;
    average: number;
    median: number;
    percentile95: number;
  } {
    if (results.length === 0) {
      return {
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        percentile95: 0,
      };
    }

    const responseTimes = results.map(r => r.responseTime).sort((a, b) => a - b);
    const total = responseTimes.reduce((sum, time) => sum + time, 0);

    const min = responseTimes[0];
    const max = responseTimes[responseTimes.length - 1];
    const average = total / responseTimes.length;
    
    // Calculate median
    const midIndex = Math.floor(responseTimes.length / 2);
    const median = responseTimes.length % 2 === 0
      ? (responseTimes[midIndex - 1] + responseTimes[midIndex]) / 2
      : responseTimes[midIndex];

    // Calculate 95th percentile
    const percentile95Index = Math.floor(responseTimes.length * 0.95);
    const percentile95 = responseTimes[Math.min(percentile95Index, responseTimes.length - 1)];

    return {
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      average: Math.round(average * 100) / 100,
      median: Math.round(median * 100) / 100,
      percentile95: Math.round(percentile95 * 100) / 100,
    };
  }

  /**
   * Get status code distribution
   */
  getStatusCodeDistribution(results: TestResult[]): Record<number, number> {
    const distribution: Record<number, number> = {};

    for (const result of results) {
      const statusCode = result.statusCode;
      distribution[statusCode] = (distribution[statusCode] || 0) + 1;
    }

    return distribution;
  }

  /**
   * Get vulnerability summary by type
   */
  getVulnerabilitySummary(mutationResults: TestResult[]): {
    totalVulnerabilities: number;
    criticalIssues: TestResult[];
    warningIssues: TestResult[];
    infoIssues: TestResult[];
  } {
    const vulnerableResults = mutationResults.filter(r => r.vulnerabilityDetected);
    
    // Categorize vulnerabilities by severity based on status codes and patterns
    const criticalIssues: TestResult[] = [];
    const warningIssues: TestResult[] = [];
    const infoIssues: TestResult[] = [];

    for (const result of vulnerableResults) {
      // Critical: Successful responses to malicious inputs
      if (result.statusCode >= 200 && result.statusCode < 300) {
        criticalIssues.push(result);
      }
      // Warning: Server errors that might indicate vulnerabilities
      else if (result.statusCode >= 500) {
        warningIssues.push(result);
      }
      // Info: Client errors that might indicate information disclosure
      else {
        infoIssues.push(result);
      }
    }

    return {
      totalVulnerabilities: vulnerableResults.length,
      criticalIssues,
      warningIssues,
      infoIssues,
    };
  }

  /**
   * Get integrity issues summary
   */
  getIntegrityIssuesSummary(mutationResults: TestResult[]): {
    totalIntegrityIssues: number;
    serviceUnavailable: TestResult[];
    unexpectedSuccess: TestResult[];
    responseAnomalies: TestResult[];
  } {
    const integrityIssues = mutationResults.filter(r => r.integrityIssue);
    
    // Categorize integrity issues by type
    const serviceUnavailable: TestResult[] = [];
    const unexpectedSuccess: TestResult[] = [];
    const responseAnomalies: TestResult[] = [];

    for (const result of integrityIssues) {
      // Service unavailable: Connection errors or 5xx status codes
      if (result.error || result.statusCode >= 500) {
        serviceUnavailable.push(result);
      }
      // Unexpected success: 2xx responses when they should fail
      else if (result.statusCode >= 200 && result.statusCode < 300) {
        unexpectedSuccess.push(result);
      }
      // Response anomalies: Other concerning patterns
      else {
        responseAnomalies.push(result);
      }
    }

    return {
      totalIntegrityIssues: integrityIssues.length,
      serviceUnavailable,
      unexpectedSuccess,
      responseAnomalies,
    };
  }

  /**
   * Export report to JSON format with structured data
   */
  exportToJson(report: Report): string {
    this.logger.log(`Exporting report ${report.testId} to JSON format`);

    try {
      // Create enhanced export data with additional analysis
      const exportData = {
        // Basic report data
        ...report,
        
        // Additional analysis
        analysis: {
          categorizedResults: this.getCategorizedResults(report.mutationResults),
          responseTimeStats: this.getResponseTimeStatistics([report.happyPathResult, ...report.mutationResults]),
          statusCodeDistribution: this.getStatusCodeDistribution([report.happyPathResult, ...report.mutationResults]),
          vulnerabilitySummary: this.getVulnerabilitySummary(report.mutationResults),
          integrityIssuesSummary: this.getIntegrityIssuesSummary(report.mutationResults),
        },

        // Export metadata
        exportMetadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          format: 'api-mutation-tester-report',
        },
      };

      // Convert to JSON with proper formatting
      const jsonString = JSON.stringify(exportData, null, 2);
      
      this.logger.log(`Successfully exported report ${report.testId} to JSON (${jsonString.length} characters)`);
      
      return jsonString;
    } catch (error) {
      this.logger.error(`Failed to export report ${report.testId} to JSON:`, error);
      throw error;
    }
  }

  /**
   * Generate descriptive filename for report export
   */
  generateExportFilename(report: Report): string {
    try {
      // Extract domain from URL for filename
      const url = new URL(report.metadata.targetUrl);
      const domain = url.hostname.replace(/[^a-zA-Z0-9]/g, '-');
      
      // Format execution date
      const date = new Date(report.metadata.executionDate);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      const timeStr = date.toISOString().split('T')[1].split('.')[0].replace(/:/g, '-'); // HH-MM-SS
      
      // Create descriptive filename
      const filename = `api-mutation-test-${domain}-${dateStr}-${timeStr}-${report.testId.substring(0, 8)}.json`;
      
      this.logger.log(`Generated export filename for report ${report.testId}: ${filename}`);
      
      return filename;
    } catch (error) {
      this.logger.error(`Failed to generate filename for report ${report.testId}:`, error);
      
      // Fallback filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      return `api-mutation-test-${timestamp}-${report.testId.substring(0, 8)}.json`;
    }
  }

  /**
   * Create a summary-only export for quick overview
   */
  exportSummaryToJson(report: Report): string {
    this.logger.log(`Exporting summary for report ${report.testId} to JSON format`);

    try {
      const summaryData = {
        testId: report.testId,
        summary: report.summary,
        metadata: report.metadata,
        vulnerabilitySummary: this.getVulnerabilitySummary(report.mutationResults),
        integrityIssuesSummary: this.getIntegrityIssuesSummary(report.mutationResults),
        responseTimeStats: this.getResponseTimeStatistics([report.happyPathResult, ...report.mutationResults]),
        statusCodeDistribution: this.getStatusCodeDistribution([report.happyPathResult, ...report.mutationResults]),
        exportMetadata: {
          exportDate: new Date().toISOString(),
          version: '1.0.0',
          format: 'api-mutation-tester-summary',
          type: 'summary-only',
        },
      };

      const jsonString = JSON.stringify(summaryData, null, 2);
      
      this.logger.log(`Successfully exported summary for report ${report.testId} to JSON`);
      
      return jsonString;
    } catch (error) {
      this.logger.error(`Failed to export summary for report ${report.testId} to JSON:`, error);
      throw error;
    }
  }

  /**
   * Validate report data before export
   */
  validateReportForExport(report: Report): boolean {
    try {
      // Check required fields
      if (!report.testId || !report.summary || !report.metadata) {
        this.logger.error(`Report ${report.testId} missing required fields for export`);
        return false;
      }

      // Check if happy path result exists
      if (!report.happyPathResult) {
        this.logger.error(`Report ${report.testId} missing happy path result`);
        return false;
      }

      // Check if mutation results array exists (can be empty)
      if (!Array.isArray(report.mutationResults)) {
        this.logger.error(`Report ${report.testId} has invalid mutation results`);
        return false;
      }

      // Validate metadata
      if (!report.metadata.targetUrl || !report.metadata.executionDate) {
        this.logger.error(`Report ${report.testId} has incomplete metadata`);
        return false;
      }

      this.logger.log(`Report ${report.testId} validation passed for export`);
      return true;
    } catch (error) {
      this.logger.error(`Error validating report ${report.testId} for export:`, error);
      return false;
    }
  }
}