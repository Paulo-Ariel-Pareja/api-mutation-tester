import { Typography, Box, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/AppContext';
import TestConfigurationForm from '../components/TestConfigurationForm';

function HomePage() {
  const navigate = useNavigate();
  const { state } = useAppContext();

  const handleTestStarted = (testId: string) => {
    // Navigate to progress page
    navigate(`/progress/${testId}`);
  };

  const handleError = (errorMessage: string) => {
    // Error handling is now managed by the global context
    console.error('Test configuration error:', errorMessage);
  };

  return (
    <Box>
      <Box textAlign="center" mb={4}>
        <Typography variant="h4" component="h1" gutterBottom>
          API Mutation Tester
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Test your API's robustness through automated mutations
        </Typography>
      </Box>

      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {state.error}
        </Alert>
      )}



      <TestConfigurationForm
        onTestStarted={handleTestStarted}
        onError={handleError}
      />
    </Box>
  );
}

export default HomePage