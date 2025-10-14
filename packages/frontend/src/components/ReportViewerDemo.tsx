import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ReportViewer from './ReportViewer';
import { Report, TestResult } from '@api-mutation-tester/shared';

// Generate mock test results for demonstration
const generateMockResults = (): TestResult[] => {
  const baseTimestamp = new Date('2024-01-15T10:00:00Z');
  
  return [
    // Happy path result
    {
      id: 'result-happy-path',
      isHappyPath: true,
      statusCode: 200,
      responseTime: 145,
      responseBody: { success: true, data: { id: 123, name: 'Test User', email: 'test@example.com' } },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: baseTimestamp
    },
    // Successful mutations (potential vulnerabilities)
    {
      id: 'result-mutation-1',
      mutationId: 'STRING_EMPTY',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 98,
      responseBody: { success: true, data: { id: 124, name: '', email: 'test@example.com' } },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 1000)
    },
    {
      id: 'result-mutation-2',
      mutationId: 'STRING_MALICIOUS',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 156,
      responseBody: { success: true, data: { id: 125, name: '<script>alert(1)</script>', email: 'test@example.com' } },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 2000)
    },
    {
      id: 'result-mutation-3',
      mutationId: 'MISSING_FIELD',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 134,
      responseBody: { success: true, data: { id: 126, email: 'test@example.com' } },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 3000)
    },
    // Expected failures (good behavior)
    {
      id: 'result-mutation-4',
      mutationId: 'INVALID_TYPE',
      isHappyPath: false,
      statusCode: 400,
      responseTime: 89,
      responseBody: { error: 'Invalid input type', code: 'VALIDATION_ERROR' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 4000)
    },
    {
      id: 'result-mutation-5',
      mutationId: 'TYPE_NULL',
      isHappyPath: false,
      statusCode: 422,
      responseTime: 76,
      responseBody: { error: 'Required field cannot be null', field: 'name' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 5000)
    },
    // Server errors (integrity issues)
    {
      id: 'result-mutation-6',
      mutationId: 'STRING_LONG',
      isHappyPath: false,
      statusCode: 500,
      responseTime: 2340,
      responseBody: { error: 'Internal server error', stack: 'Error at line 42 in user.service.js' },
      vulnerabilityDetected: true,
      integrityIssue: true,
      timestamp: new Date(baseTimestamp.getTime() + 6000)
    },
    {
      id: 'result-mutation-7',
      mutationId: 'NUMERIC_LARGE',
      isHappyPath: false,
      statusCode: 503,
      responseTime: 5000,
      responseBody: { error: 'Service temporarily unavailable' },
      error: 'Request timeout after 5000ms',
      vulnerabilityDetected: false,
      integrityIssue: true,
      timestamp: new Date(baseTimestamp.getTime() + 7000)
    },
    // More varied results
    {
      id: 'result-mutation-8',
      mutationId: 'TYPE_BOOLEAN',
      isHappyPath: false,
      statusCode: 201,
      responseTime: 167,
      responseBody: { success: true, data: { id: 127, name: true, email: 'test@example.com' } },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 8000)
    },
    {
      id: 'result-mutation-9',
      mutationId: 'SPECIAL_CHARACTERS',
      isHappyPath: false,
      statusCode: 400,
      responseTime: 112,
      responseBody: { error: 'Invalid characters in input', code: 'INVALID_CHARS' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 9000)
    },
    {
      id: 'result-mutation-10',
      mutationId: 'TYPE_ARRAY',
      isHappyPath: false,
      statusCode: 422,
      responseTime: 95,
      responseBody: { error: 'Expected string, got array', field: 'name' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date(baseTimestamp.getTime() + 10000)
    },
    // Additional results for pagination testing
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `result-mutation-${11 + i}`,
      mutationId: `UNICODE_CHARACTERS_${i}`,
      isHappyPath: false,
      statusCode: Math.random() > 0.7 ? (Math.random() > 0.5 ? 500 : 400) : 200,
      responseTime: Math.floor(Math.random() * 1000) + 50,
      responseBody: { 
        test: `Result ${11 + i}`, 
        unicode: '测试数据', 
        emoji: '🚀🔥💯',
        data: Math.random() > 0.5 ? { processed: true } : null
      },
      vulnerabilityDetected: Math.random() > 0.8,
      integrityIssue: Math.random() > 0.9,
      timestamp: new Date(baseTimestamp.getTime() + (11 + i) * 1000)
    }))
  ];
};

const mockResults = generateMockResults();

// Create mock report
const mockReport: Report = {
  testId: 'test-demo-12345',
  summary: {
    totalTests: mockResults.length,
    successfulTests: mockResults.filter(r => r.statusCode < 400).length,
    failedTests: mockResults.filter(r => r.statusCode >= 400).length,
    vulnerabilitiesFound: mockResults.filter(r => r.vulnerabilityDetected).length,
    integrityIssues: mockResults.filter(r => r.integrityIssue).length,
    averageResponseTime: mockResults.reduce((sum, r) => sum + r.responseTime, 0) / mockResults.length
  },
  happyPathResult: mockResults[0],
  mutationResults: mockResults.slice(1),
  metadata: {
    targetUrl: 'https://api.example.com/users',
    executionDate: new Date('2024-01-15T10:00:00Z'),
    duration: 45000 // 45 seconds
  }
};

const ReportViewerDemo: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          Report Viewer Demo
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          This demo showcases the ReportViewer component with mock test results. The component includes:
        </Typography>
        <Box component="ul" sx={{ pl: 3, mb: 2 }}>
          <Typography component="li" variant="body2">
            <strong>Filterable and sortable results table</strong> - Filter by category, status codes, response times, and search terms
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Detailed view for individual test results</strong> - Click the expand button or "View Details" to see full information
          </Typography>
          <Typography component="li" variant="body2">
            <strong>Pagination for large result sets</strong> - Navigate through results with configurable page sizes
          </Typography>
          <Typography component="li" variant="body2">
            <strong>JSON export functionality</strong> - Download complete report with metadata and applied filters
          </Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          <strong>Test Data:</strong> {mockResults.length} total results including {mockReport.summary.vulnerabilitiesFound} vulnerabilities 
          and {mockReport.summary.integrityIssues} integrity issues.
        </Typography>
      </Paper>
      
      <ReportViewer report={mockReport} />
    </Box>
  );
};

export default ReportViewerDemo;