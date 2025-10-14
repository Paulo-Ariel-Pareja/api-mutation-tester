
import { 
  Backdrop, 
  CircularProgress, 
  Typography, 
  Box,
  LinearProgress
} from '@mui/material';
import { useAppContext } from '../contexts/AppContext';

interface GlobalLoadingIndicatorProps {
  variant?: 'backdrop' | 'linear';
}

function GlobalLoadingIndicator({ variant = 'backdrop' }: GlobalLoadingIndicatorProps) {
  const { state } = useAppContext();

  if (!state.isLoading) {
    return null;
  }

  if (variant === 'linear') {
    return (
      <Box sx={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        zIndex: 9998 
      }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Backdrop
      sx={{ 
        color: '#fff', 
        zIndex: 9998,
        flexDirection: 'column',
        gap: 2
      }}
      open={state.isLoading}
    >
      <CircularProgress color="inherit" size={60} />
      <Typography variant="h6" component="div">
        Processing...
      </Typography>
      <Typography variant="body2" component="div" sx={{ opacity: 0.8 }}>
        Please wait while we process your request
      </Typography>
    </Backdrop>
  );
}

export default GlobalLoadingIndicator;