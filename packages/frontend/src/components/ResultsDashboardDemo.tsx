import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import ResultsDashboard from './ResultsDashboard';
import { Report, TestResult } from '@api-mutation-tester/shared';

const ResultsDashboardDemo: React.FC = () => {
  // Create mock data for demonstration
  const mockReport: Report = {
    testId: 'demo-test-123',
    summary: {
      totalTests: 25,
      successfulTests: 15,
      failedTests: 10,
      vulnerabilitiesFound: 5,
      integrityIssues: 3,
      averageResponseTime: 245.7
    },
    happyPathResult: {
      id: 'happy-path-1',
      isHappyPath: true,
      statusCode: 200,
      responseTime: 150,
      responseBody: { success: true, data: 'test data' },
      vulnerabilityDetected: false,
      integrityIssue: false,
      timestamp: new Date()
    },
    mutationResults: [
      // Successful mutations (no issues)
      ...Array.from({ length: 10 }, (_, i) => ({
        id: `mutation-${i + 1}`,
        mutationId: `STRING_EMPTY_${i + 1}`,
        isHappyPath: false,
        statusCode: 400,
        responseTime: Math.random() * 300 + 100,
        responseBody: { error: 'Validation failed' },
        vulnerabilityDetected: false,
        integrityIssue: false,
        timestamp: new Date()
      } as TestResult)),
      
      // Vulnerability examples
      {
        id: 'vuln-1',
        mutationId: 'STRING_MALICIOUS_1',
        isHappyPath: false,
        statusCode: 200, // Should have failed but didn't
        responseTime: 180,
        responseBody: { success: true },
        vulnerabilityDetected: true,
        integrityIssue: false,
        timestamp: new Date()
      },
      {
        id: 'vuln-2',
        mutationId: 'INVALID_TYPE_1',
        isHappyPath: false,
        statusCode: 200, // Type validation bypassed
        responseTime: 220,
        responseBody: { success: true },
        vulnerabilityDetected: true,
        integrityIssue: false,
        timestamp: new Date()
      },
      {
        id: 'vuln-3',
        mutationId: 'STRING_MALICIOUS_2',
        isHappyPath: false,
        statusCode: 500, // Server error with potential info disclosure
        responseTime: 350,
        responseBody: { error: 'Internal server error', stack: 'Error at line 123...' },
        vulnerabilityDetected: true,
        integrityIssue: false,
        timestamp: new Date()
      },
      {
        id: 'vuln-4',
        mutationId: 'MISSING_FIELD_1',
        isHappyPath: false,
        statusCode: 200, // Should have failed validation
        responseTime: 190,
        responseBody: { success: true },
        vulnerabilityDetected: true,
        integrityIssue: false,
        timestamp: new Date()
      },
      {
        id: 'vuln-5',
        mutationId: 'NUMERIC_LARGE_1',
        isHappyPath: false,
        statusCode: 200, // Large number accepted
        responseTime: 280,
        responseBody: { success: true },
        vulnerabilityDetected: true,
        integrityIssue: false,
        timestamp: new Date()
      },
      
      // Integrity issues
      {
        id: 'integrity-1',
        mutationId: 'STRING_LONG_1',
        isHappyPath: false,
        statusCode: 503, // Service unavailable
        responseTime: 5000,
        responseBody: null,
        error: 'Service crashed',
        vulnerabilityDetected: false,
        integrityIssue: true,
        timestamp: new Date()
      },
      {
        id: 'integrity-2',
        mutationId: 'UNICODE_CHARACTERS_1',
        isHappyPath: false,
        statusCode: 200, // Unexpected success with anomalous response
        responseTime: 50, // Suspiciously fast
        responseBody: { success: true, data: null },
        vulnerabilityDetected: false,
        integrityIssue: true,
        timestamp: new Date()
      },
      {
        id: 'integrity-3',
        mutationId: 'TYPE_ARRAY_1',
        isHappyPath: false,
        statusCode: 502, // Bad gateway
        responseTime: 10000,
        responseBody: null,
        error: 'Gateway timeout',
        vulnerabilityDetected: false,
        integrityIssue: true,
        timestamp: new Date()
      }
    ],
    metadata: {
      targetUrl: 'https://api.example.com/users',
      executionDate: new Date(),
      duration: 12500
    }
  };

  const [showDashboard, setShowDashboard] = React.useState(false);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Results Dashboard Demo
      </Typography>
      
      <Typography variant="body1" paragraph>
        This demo shows the ResultsDashboard component with mock data including:
      </Typography>
      
      <Box component="ul" sx={{ mb: 3 }}>
        <Typography component="li" variant="body2">
          25 total tests (1 happy path + 24 mutations)
        </Typography>
        <Typography component="li" variant="body2">
          5 vulnerabilities detected (various severity levels)
        </Typography>
        <Typography component="li" variant="body2">
          3 integrity issues (service crashes, anomalous responses)
        </Typography>
        <Typography component="li" variant="body2">
          Response time visualizations and status code distributions
        </Typography>
      </Box>
      
      <Button 
        variant="contained" 
        onClick={() => setShowDashboard(!showDashboard)}
        sx={{ mb: 3 }}
      >
        {showDashboard ? 'Hide Dashboard' : 'Show Dashboard'}
      </Button>
      
      {showDashboard && <ResultsDashboard report={mockReport} />}
    </Box>
  );
};

export default ResultsDashboardDemo;