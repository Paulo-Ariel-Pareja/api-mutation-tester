import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import ProgressMonitor from './ProgressMonitor';

const ProgressMonitorDemo: React.FC = () => {
  const [testId, setTestId] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleStartMonitoring = () => {
    if (!testId.trim()) {
      setError('Please enter a test ID');
      return;
    }

    setError('');
    setSuccess('');
    setIsMonitoring(true);
  };

  const handleTestComplete = (completedTestId: string) => {
    setSuccess(`Test ${completedTestId} completed successfully!`);
  };

  const handleTestError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const handleReset = () => {
    setIsMonitoring(false);
    setTestId('');
    setError('');
    setSuccess('');
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Progress Monitor Demo
      </Typography>

      {!isMonitoring ? (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Start Test Monitoring
          </Typography>
          
          <Box display="flex" gap={2} alignItems="flex-start" mb={2}>
            <TextField
              label="Test ID"
              value={testId}
              onChange={(e) => setTestId(e.target.value)}
              placeholder="Enter test ID (e.g., test-123)"
              fullWidth
              error={!!error}
              helperText={error || 'Enter the ID of a running test to monitor its progress'}
            />
            <Button
              variant="contained"
              onClick={handleStartMonitoring}
              startIcon={<PlayIcon />}
              sx={{ minWidth: 120 }}
            >
              Monitor
            </Button>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Typography variant="body2" color="text.secondary">
            <strong>Features demonstrated:</strong>
          </Typography>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Live execution log with timestamps</li>
            <li>Phase-based progress tracking</li>
            <li>Connection status indicators</li>
            <li>Manual refresh and stop controls</li>
          </ul>
        </Paper>
      ) : (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">
              Monitoring Test: {testId}
            </Typography>
            <Button variant="outlined" onClick={handleReset}>
              Reset Demo
            </Button>
          </Box>
          
          <Divider sx={{ mb: 3 }} />
          
          <ProgressMonitor
            testId={testId}
            onComplete={handleTestComplete}
            onError={handleTestError}
          />
        </Box>
      )}
    </Box>
  );
};

export default ProgressMonitorDemo;