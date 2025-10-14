
import { 
  Box, 
  CircularProgress, 
  Typography, 
  Skeleton,
  Stack
} from '@mui/material';

interface LoadingSpinnerProps {
  size?: number | string;
  message?: string;
  variant?: 'circular' | 'skeleton' | 'minimal';
  height?: number | string;
  fullHeight?: boolean;
}

function LoadingSpinner({ 
  size = 40, 
  message, 
  variant = 'circular',
  height = 200,
  fullHeight = false
}: LoadingSpinnerProps) {
  
  const containerSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    height: fullHeight ? '100vh' : height,
    width: '100%',
  };

  if (variant === 'skeleton') {
    return (
      <Box sx={{ width: '100%' }}>
        <Stack spacing={1}>
          <Skeleton variant="text" sx={{ fontSize: '2rem' }} />
          <Skeleton variant="rectangular" height={60} />
          <Skeleton variant="rectangular" height={40} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
        </Stack>
      </Box>
    );
  }

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
        <CircularProgress size={size} />
      </Box>
    );
  }

  return (
    <Box sx={containerSx}>
      <CircularProgress size={size} />
      {message && (
        <Typography 
          variant="body1" 
          color="text.secondary" 
          textAlign="center"
          sx={{ maxWidth: 300 }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
}

export default LoadingSpinner;