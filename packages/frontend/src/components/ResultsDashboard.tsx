import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  Paper,
  useTheme
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { Report } from '@api-mutation-tester/shared';
import {
  CheckCircle,
  Error,
  Security,
  Speed,
  BugReport,
  Shield,
  WarningAmber,
  ErrorOutline,
  InfoOutlined
} from '@mui/icons-material';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface ResultsDashboardProps {
  report: Report;
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({ report }) => {
  const theme = useTheme();

  // Calculate status code distribution
  const statusCodeDistribution = React.useMemo(() => {
    const distribution: Record<string, number> = {};
    
    // Include happy path result
    const happyPathCode = Math.floor(report.happyPathResult.statusCode / 100) * 100;
    const happyPathRange = `${happyPathCode}-${happyPathCode + 99}`;
    distribution[happyPathRange] = (distribution[happyPathRange] || 0) + 1;
    
    // Include mutation results
    report.mutationResults.forEach(result => {
      const codeRange = Math.floor(result.statusCode / 100) * 100;
      const range = `${codeRange}-${codeRange + 99}`;
      distribution[range] = (distribution[range] || 0) + 1;
    });
    
    return distribution;
  }, [report]);

  // Calculate response time data for visualization
  const responseTimeData = React.useMemo(() => {
    const allResults = [report.happyPathResult, ...report.mutationResults];
    const times = allResults.map(result => result.responseTime);
    const labels = allResults.map((result, index) => 
      result.isHappyPath ? 'Happy Path' : `Mutation ${index}`
    );
    
    return { times, labels };
  }, [report]);

  // Status code chart data
  const statusCodeChartData = {
    labels: Object.keys(statusCodeDistribution),
    datasets: [
      {
        label: 'Number of Responses',
        data: Object.values(statusCodeDistribution),
        backgroundColor: [
          theme.palette.success.main,
          theme.palette.info.main,
          theme.palette.warning.main,
          theme.palette.error.main,
          theme.palette.grey[500],
        ],
        borderColor: [
          theme.palette.success.dark,
          theme.palette.info.dark,
          theme.palette.warning.dark,
          theme.palette.error.dark,
          theme.palette.grey[700],
        ],
        borderWidth: 1,
      },
    ],
  };

  // Response time chart data
  const responseTimeChartData = {
    labels: responseTimeData.labels.slice(0, 20), // Show first 20 for readability
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseTimeData.times.slice(0, 20),
        backgroundColor: theme.palette.primary.main,
        borderColor: theme.palette.primary.dark,
        borderWidth: 1,
      },
    ],
  };

  // Response time trend data
  const responseTimeTrendData = {
    labels: responseTimeData.labels.slice(0, 50),
    datasets: [
      {
        label: 'Response Time (ms)',
        data: responseTimeData.times.slice(0, 50),
        borderColor: theme.palette.primary.main,
        backgroundColor: theme.palette.primary.light,
        tension: 0.1,
        fill: false,
      },
    ],
  };

  // Vulnerability and integrity issue analysis
  const vulnerabilityResults = React.useMemo(() => {
    return report.mutationResults.filter(result => result.vulnerabilityDetected);
  }, [report]);

  const integrityIssueResults = React.useMemo(() => {
    return report.mutationResults.filter(result => result.integrityIssue);
  }, [report]);

  // Categorize integrity issues by type
  const integrityIssueTypes = React.useMemo(() => {
    const types = {
      serviceCrash: 0,
      unexpectedSuccess: 0,
      responseAnomaly: 0,
      timeoutIssue: 0
    };
    
    integrityIssueResults.forEach(result => {
      // Service crash or unavailability (5xx errors or connection issues)
      if (result.statusCode >= 500 || result.error?.includes('timeout') || result.error?.includes('connection')) {
        if (result.error?.includes('timeout')) {
          types.timeoutIssue++;
        } else {
          types.serviceCrash++;
        }
      }
      // Unexpected successful responses to clearly invalid data
      else if (result.statusCode < 400 && 
               (result.mutationId?.includes('STRING_EMPTY') ||
                result.mutationId?.includes('MISSING_FIELD') ||
                result.mutationId?.includes('INVALID_TYPE'))) {
        types.unexpectedSuccess++;
      }
      // Response pattern anomalies
      else {
        types.responseAnomaly++;
      }
    });
    
    return types;
  }, [integrityIssueResults]);

  // Categorize vulnerabilities by severity (based on status codes and mutation types)
  const vulnerabilitySeverity = React.useMemo(() => {
    const severity = { critical: 0, high: 0, medium: 0, low: 0 };
    
    vulnerabilityResults.forEach(result => {
      // Critical: Server errors revealing sensitive info or successful malicious script execution
      if (result.statusCode >= 500 || 
          (result.statusCode < 400 && result.mutationId?.includes('STRING_MALICIOUS'))) {
        severity.critical++;
      }
      // High: Validation bypass allowing invalid data types or missing required fields
      else if (result.statusCode < 400 && 
               (result.mutationId?.includes('INVALID_TYPE') || 
                result.mutationId?.includes('MISSING_FIELD') ||
                result.mutationId?.includes('TYPE_NULL') ||
                result.mutationId?.includes('TYPE_UNDEFINED'))) {
        severity.high++;
      }
      // Medium: Unexpected successful responses to edge cases or type confusion
      else if (result.statusCode < 400 && 
               (result.mutationId?.includes('TYPE_BOOLEAN') ||
                result.mutationId?.includes('TYPE_ARRAY') ||
                result.mutationId?.includes('NUMERIC_LARGE') ||
                result.mutationId?.includes('SPECIAL_CHARACTERS'))) {
        severity.medium++;
      }
      // Low: Other vulnerability patterns or minor security concerns
      else {
        severity.low++;
      }
    });
    
    return severity;
  }, [vulnerabilityResults]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <ErrorOutline />;
      case 'high': return <WarningAmber />;
      case 'medium': return <InfoOutlined />;
      case 'low': return <Shield />;
      default: return <InfoOutlined />;
    }
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Test Results Dashboard
      </Typography>
      
      {/* Summary Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h4" component="div">
                {report.summary.totalTests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Tests
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircle sx={{ fontSize: 40, color: theme.palette.success.main, mb: 1 }} />
              <Typography variant="h4" component="div" color="success.main">
                {report.summary.successfulTests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Successful
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Error sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
              <Typography variant="h4" component="div" color="error.main">
                {report.summary.failedTests}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Failed
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            border: report.summary.vulnerabilitiesFound > 0 ? `2px solid ${theme.palette.warning.main}` : 'none',
            bgcolor: report.summary.vulnerabilitiesFound > 0 ? theme.palette.warning.main + '08' : 'inherit'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Security sx={{ fontSize: 40, color: theme.palette.warning.main, mb: 1 }} />
                {report.summary.vulnerabilitiesFound > 0 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -5, 
                    right: -5, 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      !
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="h4" component="div" color="warning.main">
                {report.summary.vulnerabilitiesFound}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vulnerabilities
              </Typography>
              {report.summary.vulnerabilitiesFound > 0 && (
                <Chip 
                  label="ATTENTION REQUIRED" 
                  size="small" 
                  color="warning"
                  sx={{ mt: 1, fontSize: '0.7rem' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card sx={{ 
            border: report.summary.integrityIssues > 0 ? `2px solid ${theme.palette.error.main}` : 'none',
            bgcolor: report.summary.integrityIssues > 0 ? theme.palette.error.main + '08' : 'inherit'
          }}>
            <CardContent sx={{ textAlign: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <BugReport sx={{ fontSize: 40, color: theme.palette.error.main, mb: 1 }} />
                {report.summary.integrityIssues > 0 && (
                  <Box sx={{ 
                    position: 'absolute', 
                    top: -5, 
                    right: -5, 
                    width: 20, 
                    height: 20, 
                    borderRadius: '50%', 
                    bgcolor: theme.palette.error.main,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Typography variant="caption" sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 'bold' }}>
                      !
                    </Typography>
                  </Box>
                )}
              </Box>
              <Typography variant="h4" component="div" color="error.main">
                {report.summary.integrityIssues}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Integrity Issues
              </Typography>
              {report.summary.integrityIssues > 0 && (
                <Chip 
                  label="CRITICAL" 
                  size="small" 
                  color="error"
                  sx={{ mt: 1, fontSize: '0.7rem' }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} sm={6} md={2}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Speed sx={{ fontSize: 40, color: theme.palette.info.main, mb: 1 }} />
              <Typography variant="h4" component="div" color="info.main">
                {Math.round(report.summary.averageResponseTime)}ms
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Avg Response Time
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Vulnerability and Integrity Issues Section */}
      {(report.summary.vulnerabilitiesFound > 0 || report.summary.integrityIssues > 0) && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.warning.main }}>
            Security Issues Detected
          </Typography>
          
          <Grid container spacing={3}>
            {/* Vulnerability Severity Breakdown */}
            {report.summary.vulnerabilitiesFound > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: `2px solid ${theme.palette.warning.main}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ fontSize: 30, color: theme.palette.warning.main, mr: 1 }} />
                    <Typography variant="h6">
                      Vulnerability Severity Breakdown
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    {Object.entries(vulnerabilitySeverity).map(([severity, count]) => (
                      count > 0 && (
                        <Grid item xs={6} key={severity}>
                          <Card sx={{ 
                            bgcolor: getSeverityColor(severity) + '10',
                            border: `1px solid ${getSeverityColor(severity)}`
                          }}>
                            <CardContent sx={{ textAlign: 'center', py: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                                {getSeverityIcon(severity)}
                                <Typography variant="h5" sx={{ ml: 1, color: getSeverityColor(severity) }}>
                                  {count}
                                </Typography>
                              </Box>
                              <Chip 
                                label={severity.toUpperCase()} 
                                size="small"
                                sx={{ 
                                  bgcolor: getSeverityColor(severity),
                                  color: 'white',
                                  fontWeight: 'bold'
                                }}
                              />
                            </CardContent>
                          </Card>
                        </Grid>
                      )
                    ))}
                  </Grid>
                  
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Critical:</strong> Server errors or successful malicious requests<br/>
                      <strong>High:</strong> Validation bypass or type confusion<br/>
                      <strong>Medium:</strong> Unexpected successful responses<br/>
                      <strong>Low:</strong> Minor security concerns
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            )}
            
            {/* Integrity Issues */}
            {report.summary.integrityIssues > 0 && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 3, border: `2px solid ${theme.palette.error.main}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BugReport sx={{ fontSize: 30, color: theme.palette.error.main, mr: 1 }} />
                    <Typography variant="h6">
                      Integrity Issues Breakdown
                    </Typography>
                  </Box>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {integrityIssueTypes.serviceCrash > 0 && (
                      <Grid item xs={6}>
                        <Card sx={{ 
                          bgcolor: theme.palette.error.main + '15',
                          border: `1px solid ${theme.palette.error.main}`
                        }}>
                          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <ErrorOutline sx={{ color: theme.palette.error.main, mb: 0.5 }} />
                            <Typography variant="h6" sx={{ color: theme.palette.error.main }}>
                              {integrityIssueTypes.serviceCrash}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Service Crashes
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {integrityIssueTypes.unexpectedSuccess > 0 && (
                      <Grid item xs={6}>
                        <Card sx={{ 
                          bgcolor: theme.palette.warning.main + '15',
                          border: `1px solid ${theme.palette.warning.main}`
                        }}>
                          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <WarningAmber sx={{ color: theme.palette.warning.main, mb: 0.5 }} />
                            <Typography variant="h6" sx={{ color: theme.palette.warning.main }}>
                              {integrityIssueTypes.unexpectedSuccess}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Unexpected Success
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {integrityIssueTypes.timeoutIssue > 0 && (
                      <Grid item xs={6}>
                        <Card sx={{ 
                          bgcolor: theme.palette.info.main + '15',
                          border: `1px solid ${theme.palette.info.main}`
                        }}>
                          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Speed sx={{ color: theme.palette.info.main, mb: 0.5 }} />
                            <Typography variant="h6" sx={{ color: theme.palette.info.main }}>
                              {integrityIssueTypes.timeoutIssue}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Timeout Issues
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                    
                    {integrityIssueTypes.responseAnomaly > 0 && (
                      <Grid item xs={6}>
                        <Card sx={{ 
                          bgcolor: theme.palette.grey[500] + '15',
                          border: `1px solid ${theme.palette.grey[500]}`
                        }}>
                          <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <InfoOutlined sx={{ color: theme.palette.grey[600], mb: 0.5 }} />
                            <Typography variant="h6" sx={{ color: theme.palette.grey[600] }}>
                              {integrityIssueTypes.responseAnomaly}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Response Anomalies
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      <strong>Integrity Issue Types:</strong>
                    </Typography>
                    <Box component="ul" sx={{ mt: 1, pl: 2, mb: 0 }}>
                      <Typography component="li" variant="body2" color="text.secondary">
                        <strong>Service Crashes:</strong> 5xx errors indicating server instability
                      </Typography>
                      <Typography component="li" variant="body2" color="text.secondary">
                        <strong>Unexpected Success:</strong> 2xx responses to clearly invalid data
                      </Typography>
                      <Typography component="li" variant="body2" color="text.secondary">
                        <strong>Timeout Issues:</strong> Requests that exceed timeout limits
                      </Typography>
                      <Typography component="li" variant="body2" color="text.secondary">
                        <strong>Response Anomalies:</strong> Other unusual response patterns
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            )}
          </Grid>
          
          {/* Detailed Issue List */}
          {(vulnerabilityResults.length > 0 || integrityIssueResults.length > 0) && (
            <Paper sx={{ p: 3, mt: 3 }}>
              <Typography variant="h6" gutterBottom>
                Detailed Issue Analysis
              </Typography>
              
              {vulnerabilityResults.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Security sx={{ color: theme.palette.warning.main, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ color: theme.palette.warning.main }}>
                      Vulnerability Details ({vulnerabilityResults.length} found)
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {vulnerabilityResults.slice(0, 15).map((result, index) => {
                      // Determine severity for visual indicator
                      let severity = 'low';
                      let severityColor = theme.palette.success.main;
                      let severityIcon = <Shield />;
                      
                      if (result.statusCode >= 500 || (result.statusCode < 400 && result.mutationId?.includes('STRING_MALICIOUS'))) {
                        severity = 'critical';
                        severityColor = theme.palette.error.main;
                        severityIcon = <ErrorOutline />;
                      } else if (result.statusCode < 400 && (result.mutationId?.includes('INVALID_TYPE') || result.mutationId?.includes('MISSING_FIELD'))) {
                        severity = 'high';
                        severityColor = theme.palette.warning.main;
                        severityIcon = <WarningAmber />;
                      } else if (result.statusCode < 400) {
                        severity = 'medium';
                        severityColor = theme.palette.info.main;
                        severityIcon = <InfoOutlined />;
                      }
                      
                      return (
                        <Box key={result.id} sx={{ 
                          p: 2, 
                          mb: 1, 
                          bgcolor: severityColor + '08',
                          border: `2px solid ${severityColor}30`,
                          borderRadius: 1,
                          borderLeft: `4px solid ${severityColor}`
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {severityIcon}
                                <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                                  Mutation {index + 1}: {result.mutationId?.replace(/_/g, ' ') || 'Unknown'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Status: <strong>{result.statusCode}</strong> | 
                                Response Time: <strong>{result.responseTime}ms</strong>
                              </Typography>
                              {result.error && (
                                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                                  <strong>Error:</strong> {result.error}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                              <Chip 
                                label={severity.toUpperCase()} 
                                size="small" 
                                sx={{ 
                                  bgcolor: severityColor,
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Chip 
                                label="VULNERABILITY" 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderColor: severityColor,
                                  color: severityColor,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                    {vulnerabilityResults.length > 15 && (
                      <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>+ {vulnerabilityResults.length - 15} more vulnerabilities</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Review the complete report for all vulnerability details
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
              
              {integrityIssueResults.length > 0 && (
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BugReport sx={{ color: theme.palette.error.main, mr: 1 }} />
                    <Typography variant="subtitle1" sx={{ color: theme.palette.error.main }}>
                      Integrity Issue Details ({integrityIssueResults.length} found)
                    </Typography>
                  </Box>
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    {integrityIssueResults.slice(0, 15).map((result, index) => {
                      // Determine issue type for visual indicator
                      let issueType = 'Response Anomaly';
                      let issueColor = theme.palette.grey[600];
                      let issueIcon = <InfoOutlined />;
                      
                      if (result.statusCode >= 500 || result.error?.includes('connection')) {
                        issueType = 'Service Crash';
                        issueColor = theme.palette.error.main;
                        issueIcon = <ErrorOutline />;
                      } else if (result.error?.includes('timeout')) {
                        issueType = 'Timeout Issue';
                        issueColor = theme.palette.info.main;
                        issueIcon = <Speed />;
                      } else if (result.statusCode < 400 && 
                                 (result.mutationId?.includes('STRING_EMPTY') ||
                                  result.mutationId?.includes('MISSING_FIELD') ||
                                  result.mutationId?.includes('INVALID_TYPE'))) {
                        issueType = 'Unexpected Success';
                        issueColor = theme.palette.warning.main;
                        issueIcon = <WarningAmber />;
                      }
                      
                      return (
                        <Box key={result.id} sx={{ 
                          p: 2, 
                          mb: 1, 
                          bgcolor: issueColor + '08',
                          border: `2px solid ${issueColor}30`,
                          borderRadius: 1,
                          borderLeft: `4px solid ${issueColor}`
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {issueIcon}
                                <Typography variant="body2" sx={{ ml: 1, fontWeight: 'bold' }}>
                                  Mutation {index + 1}: {result.mutationId?.replace(/_/g, ' ') || 'Unknown'}
                                </Typography>
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                Status: <strong>{result.statusCode}</strong> | 
                                Response Time: <strong>{result.responseTime}ms</strong>
                              </Typography>
                              {result.error && (
                                <Typography variant="caption" color="error.main" sx={{ mt: 0.5, display: 'block' }}>
                                  <strong>Error:</strong> {result.error}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                              <Chip 
                                label={issueType.toUpperCase()} 
                                size="small" 
                                sx={{ 
                                  bgcolor: issueColor,
                                  color: 'white',
                                  fontWeight: 'bold',
                                  fontSize: '0.7rem'
                                }}
                              />
                              <Chip 
                                label="INTEGRITY ISSUE" 
                                size="small" 
                                variant="outlined"
                                sx={{ 
                                  borderColor: issueColor,
                                  color: issueColor,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      );
                    })}
                    {integrityIssueResults.length > 15 && (
                      <Box sx={{ textAlign: 'center', mt: 2, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          <strong>+ {integrityIssueResults.length - 15} more integrity issues</strong>
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Review the complete report for all integrity issue details
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              )}
            </Paper>
          )}
        </Box>
      )}

      {/* Charts Section */}
      <Grid container spacing={3}>
        {/* Status Code Distribution */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Status Code Distribution
            </Typography>
            <Box sx={{ height: 300 }}>
              <Doughnut data={statusCodeChartData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>
        
        {/* Response Time Bar Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Times (First 20 Tests)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Bar 
                data={responseTimeChartData} 
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Response Time (ms)'
                      }
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
        
        {/* Response Time Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Response Time Trend (First 50 Tests)
            </Typography>
            <Box sx={{ height: 300 }}>
              <Line 
                data={responseTimeTrendData} 
                options={{
                  ...chartOptions,
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: {
                        display: true,
                        text: 'Response Time (ms)'
                      }
                    },
                    x: {
                      title: {
                        display: true,
                        text: 'Test Execution Order'
                      }
                    }
                  }
                }} 
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultsDashboard;