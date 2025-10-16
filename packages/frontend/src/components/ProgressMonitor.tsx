import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  Collapse,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Paper,
} from '@mui/material';
import {

  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { TestStatus } from '@api-mutation-tester/shared';
import { apiService } from '../services/api';

interface ProgressMonitorProps {
  testId: string;
  onComplete?: (testId: string) => void;
  onError?: (error: string) => void;
}

interface LogEntry {
  id: string;
  timestamp: Date;
  phase: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

const ProgressMonitor: React.FC<ProgressMonitorProps> = ({
  testId,
  onComplete,
  onError,
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPolling, setIsPolling] = useState(true);
  const [showLogs, setShowLogs] = useState(false);
  const previousStatusRef = useRef<TestStatus | null>(null);

  // Query for test status with polling
  const {
    data: testStatus,
    error,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['testStatus', testId],
    queryFn: () => apiService.getTestStatus(testId),
    refetchInterval: isPolling ? 2000 : false,
    refetchIntervalInBackground: false,
    enabled: !!testId && isPolling,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Use the current status from polling
  const currentStatus = testStatus;

  // Add log entry helper
  const addLogEntry = useCallback((phase: string, message: string, type: LogEntry['type'] = 'info') => {
    const logEntry: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      phase,
      message,
      type,
    };
    
    setLogs(prevLogs => [...prevLogs, logEntry]);
  }, []);

  // Initialize logging
  useEffect(() => {
    addLogEntry('Monitor', 'Progress monitoring started', 'info');
  }, [addLogEntry]);

  // Handle status changes and generate log entries
  useEffect(() => {
    if (currentStatus && previousStatusRef.current) {
      const prev = previousStatusRef.current;
      const curr = currentStatus;

      // Status change
      if (prev.status !== curr.status) {
        const statusMessages = {
          pending: 'Test is pending execution',
          running: 'Test execution started',
          completed: 'Test execution completed successfully',
          failed: 'Test execution failed',
        };
        
        const statusTypes: Record<string, LogEntry['type']> = {
          pending: 'info',
          running: 'info',
          completed: 'success',
          failed: 'error',
        };

        addLogEntry(
          'Status',
          statusMessages[curr.status as keyof typeof statusMessages] || `Status changed to ${curr.status}`,
          statusTypes[curr.status] || 'info'
        );
      }

      // Phase change
      if (prev.currentPhase !== curr.currentPhase) {
        const phaseMessages = {
          validation: 'Validating test configuration',
          'happy-path': 'Executing happy path test',
          mutations: 'Executing mutation tests',
          report: 'Generating test report',
        };

        addLogEntry(
          'Phase',
          phaseMessages[curr.currentPhase as keyof typeof phaseMessages] || `Phase changed to ${curr.currentPhase}`,
          'info'
        );
      }

      // Progress milestones
      const progressMilestones = [25, 50, 75, 90];
      progressMilestones.forEach(milestone => {
        if (prev.progress < milestone && curr.progress >= milestone) {
          addLogEntry('Progress', `${milestone}% completed`, 'info');
        }
      });

      // Mutation progress
      if (prev.completedMutations !== curr.completedMutations && curr.totalMutations > 0) {
        addLogEntry(
          'Mutations',
          `Completed ${curr.completedMutations}/${curr.totalMutations} mutations`,
          'info'
        );
      }
    }

    previousStatusRef.current = currentStatus || null;
  }, [currentStatus, addLogEntry]);

  // Handle completion and errors
  useEffect(() => {
    if (currentStatus) {
      if (currentStatus.status === 'completed') {
        setIsPolling(false);
        addLogEntry('Monitor', 'Test completed successfully', 'success');
        onComplete?.(testId);
      } else if (currentStatus.status === 'failed') {
        setIsPolling(false);
        addLogEntry('Monitor', 'Test failed', 'error');
        onError?.('Test execution failed');
      }
    }
  }, [currentStatus, testId, onComplete, onError, addLogEntry]);

  // Handle query errors
  useEffect(() => {
    if (isError && error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      addLogEntry('Monitor', `Failed to fetch status: ${errorMessage}`, 'error');
      onError?.(errorMessage);
    }
  }, [isError, error, onError, addLogEntry]);

  const handlePollingToggle = useCallback(() => {
    setIsPolling(!isPolling);
    addLogEntry('Monitor', `Polling ${!isPolling ? 'enabled' : 'disabled'}`, 'info');
  }, [isPolling, addLogEntry]);

  const handleRefresh = useCallback(() => {
    refetch();
    addLogEntry('Monitor', 'Manual refresh triggered', 'info');
  }, [refetch, addLogEntry]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'running': return 'primary';
      default: return 'default';
    }
  };

  const getPhaseDescription = (phase: string) => {
    const descriptions = {
      validation: 'Validating configuration and connectivity',
      'happy-path': 'Testing with original request',
      mutations: 'Testing with mutated requests',
      report: 'Analyzing results and generating report',
    };
    return descriptions[phase as keyof typeof descriptions] || phase;
  };

  const formatDuration = (start: Date | string, end?: Date | string) => {
    const startTime = start instanceof Date ? start : new Date(start);
    const endTime = end ? (end instanceof Date ? end : new Date(end)) : new Date();
    const duration = endTime.getTime() - startTime.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon color="success" fontSize="small" />;
      case 'error': return <ErrorIcon color="error" fontSize="small" />;
      case 'warning': return <WarningIcon color="warning" fontSize="small" />;
      default: return <InfoIcon color="info" fontSize="small" />;
    }
  };

  if (!currentStatus) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Test Progress Monitor
          </Typography>
          <LinearProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Loading test status...
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Box>
      {/* Main Progress Card */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Test Progress Monitor
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              {/* Polling Controls */}
              <FormControlLabel
                control={
                  <Switch
                    checked={isPolling}
                    onChange={handlePollingToggle}
                    size="small"
                  />
                }
                label="Auto-refresh"
              />
              
              <Tooltip title="Refresh now">
                <IconButton onClick={handleRefresh} size="small">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Status and Progress */}
          <Box mb={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
              <Chip
                label={currentStatus.status.toUpperCase()}
                color={getStatusColor(currentStatus.status) as any}
                size="small"
              />
              <Typography variant="body2" color="text.secondary">
                {currentStatus.progress}% Complete
              </Typography>
            </Box>
            
            <LinearProgress
              variant="determinate"
              value={currentStatus.progress}
              sx={{ mb: 2 }}
            />
            
            <Typography variant="body2" color="text.secondary">
              <strong>Phase:</strong> {getPhaseDescription(currentStatus.currentPhase)}
            </Typography>
          </Box>

          {/* Statistics Grid */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <TimelineIcon color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6">
                  {formatDuration(currentStatus.startTime, currentStatus.endTime)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Duration
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <SpeedIcon color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6">
                  {currentStatus.completedMutations}/{currentStatus.totalMutations}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Mutations
                </Typography>
              </Paper>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <AssessmentIcon color="primary" sx={{ mb: 1 }} />
                <Typography variant="h6">
                  Polling (2s)
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Updates
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="subtitle2">Connection Error</Typography>
          <Typography variant="body2">
            Failed to fetch test status. The monitoring will continue to retry automatically.
          </Typography>
        </Alert>
      )}

      {/* Logs Section */}
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Execution Log ({logs.length} entries)
            </Typography>
            <Button
              startIcon={showLogs ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowLogs(!showLogs)}
              size="small"
            >
              {showLogs ? 'Hide' : 'Show'} Logs
            </Button>
          </Box>
          
          <Collapse in={showLogs}>
            <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {logs.slice(-20).map((log, index) => (
                  <React.Fragment key={log.id}>
                    <ListItem>
                      <ListItemIcon>
                        {getLogIcon(log.type)}
                      </ListItemIcon>
                      <ListItemText
                        primary={log.message}
                        secondary={
                          <Box component="span" display="flex" justifyContent="space-between">
                            <span>{log.phase}</span>
                            <span>{log.timestamp.toLocaleTimeString()}</span>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < logs.slice(-20).length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
              
              {logs.length === 0 && (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                  No log entries yet
                </Typography>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ProgressMonitor;