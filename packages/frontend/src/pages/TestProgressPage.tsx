import { Typography, Box, Alert } from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import ProgressMonitor from '../components/ProgressMonitor';

function TestProgressPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!testId) {
      setError('No test ID provided');
    }
  }, [testId]);

  const handleTestComplete = () => {
    if (testId) {
      navigate(`/results/${testId}`);
    }
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  if (!testId) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Test Progress
        </Typography>
        <Alert severity="error">
          No test ID provided. Please start a test from the home page.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Test Progress
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Monitoring test execution for ID: {testId}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <ProgressMonitor
        testId={testId}
        onComplete={handleTestComplete}
        onError={handleError}
      />
    </Box>
  );
}

export default TestProgressPage;