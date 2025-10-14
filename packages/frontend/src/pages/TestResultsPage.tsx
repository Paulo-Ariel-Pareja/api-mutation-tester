import { Typography, Box, Alert, Button, CircularProgress } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowBack } from '@mui/icons-material';
import ResultsDashboard from '../components/ResultsDashboard';
import ReportViewer from '../components/ReportViewer';
import { useTestReport } from '../hooks/useApi';

function TestResultsPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!testId) {
      setError('No test ID provided');
    }
  }, [testId]);

  const { data: report, isLoading, error: queryError } = useTestReport(testId || null);

  const handleBackToHome = () => {
    navigate('/');
  };

  if (!testId) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Results
        </Typography>
        <Alert severity="error">
          No test ID provided. Please start a test from the home page.
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToHome}
          sx={{ mt: 2 }}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  if (isLoading) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" mt={4}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading test results...
        </Typography>
      </Box>
    );
  }

  if (queryError || !report) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Results
        </Typography>
        <Alert severity="error" sx={{ mb: 2 }}>
          Failed to load test results. {queryError?.message || 'Unknown error occurred.'}
        </Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToHome}
        >
          Back to Home
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={handleBackToHome}
          sx={{ mr: 2 }}
        >
          New Test
        </Button>
        <Box>
          <Typography variant="h4" component="h1">
            Test Results
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Test ID: {testId}
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Box mb={4}>
        <ResultsDashboard report={report} />
      </Box>

      <ReportViewer report={report} />
    </Box>
  );
}

export default TestResultsPage;