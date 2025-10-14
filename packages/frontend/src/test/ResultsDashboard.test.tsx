import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ResultsDashboard from '../components/ResultsDashboard';
import { Report } from '@api-mutation-tester/shared';

const theme = createTheme();

const mockReportWithVulnerabilities: Report = {
  testId: 'test-123',
  summary: {
    totalTests: 10,
    successfulTests: 5,
    failedTests: 5,
    vulnerabilitiesFound: 3,
    integrityIssues: 2,
    averageResponseTime: 200
  },
  happyPathResult: {
    id: 'happy-1',
    isHappyPath: true,
    statusCode: 200,
    responseTime: 150,
    responseBody: { success: true },
    vulnerabilityDetected: false,
    integrityIssue: false,
    timestamp: new Date()
  },
  mutationResults: [
    {
      id: 'vuln-1',
      mutationId: 'STRING_MALICIOUS_1',
      isHappyPath: false,
      statusCode: 200,
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
      statusCode: 200,
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
      statusCode: 500,
      responseTime: 350,
      responseBody: { error: 'Server error' },
      vulnerabilityDetected: true,
      integrityIssue: false,
      timestamp: new Date()
    },
    {
      id: 'integrity-1',
      mutationId: 'STRING_LONG_1',
      isHappyPath: false,
      statusCode: 503,
      responseTime: 5000,
      responseBody: null,
      error: 'Service crashed',
      vulnerabilityDetected: false,
      integrityIssue: true,
      timestamp: new Date()
    },
    {
      id: 'integrity-2',
      mutationId: 'MISSING_FIELD_1',
      isHappyPath: false,
      statusCode: 200,
      responseTime: 50,
      responseBody: { success: true },
      vulnerabilityDetected: false,
      integrityIssue: true,
      timestamp: new Date()
    }
  ],
  metadata: {
    targetUrl: 'https://api.example.com/test',
    executionDate: new Date(),
    duration: 5000
  }
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('ResultsDashboard Vulnerability and Integrity Highlighting', () => {
  test('displays vulnerability counter with severity indicators', () => {
    renderWithTheme(<ResultsDashboard report={mockReportWithVulnerabilities} />);
    
    // Check that vulnerabilities are displayed
    expect(screen.getByText('3')).toBeInTheDocument(); // Vulnerability count
    expect(screen.getByText('Vulnerabilities')).toBeInTheDocument();
    expect(screen.getByText('ATTENTION REQUIRED')).toBeInTheDocument();
  });

  test('displays integrity issue counter with detailed descriptions', () => {
    renderWithTheme(<ResultsDashboard report={mockReportWithVulnerabilities} />);
    
    // Check that integrity issues are displayed
    expect(screen.getByText('2')).toBeInTheDocument(); // Integrity issue count
    expect(screen.getByText('Integrity Issues')).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });

  test('shows security issues section when vulnerabilities or integrity issues exist', () => {
    renderWithTheme(<ResultsDashboard report={mockReportWithVulnerabilities} />);
    
    // Check that the security issues section is displayed
    expect(screen.getByText('Security Issues Detected')).toBeInTheDocument();
    expect(screen.getByText('Vulnerability Severity Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Integrity Issues Breakdown')).toBeInTheDocument();
  });

  test('displays detailed vulnerability analysis with visual indicators', () => {
    renderWithTheme(<ResultsDashboard report={mockReportWithVulnerabilities} />);
    
    // Check for detailed vulnerability section
    expect(screen.getByText(/Vulnerability Details \(3 found\)/)).toBeInTheDocument();
    
    // Check for severity indicators
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });

  test('displays detailed integrity issue analysis with visual indicators', () => {
    renderWithTheme(<ResultsDashboard report={mockReportWithVulnerabilities} />);
    
    // Check for detailed integrity issue section
    expect(screen.getByText(/Integrity Issue Details \(2 found\)/)).toBeInTheDocument();
    
    // Check for issue type indicators
    expect(screen.getByText('SERVICE CRASH')).toBeInTheDocument();
    expect(screen.getByText('UNEXPECTED SUCCESS')).toBeInTheDocument();
  });
});