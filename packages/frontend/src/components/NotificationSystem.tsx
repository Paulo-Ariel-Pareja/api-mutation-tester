import React from 'react';
import { 
  Snackbar, 
  Alert, 
  Slide,
  Stack,
  Portal
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { useAppContext, Notification } from '../contexts/AppContext';

function SlideTransition(props: TransitionProps & { children: React.ReactElement }) {
  return <Slide {...props} direction="up" />;
}

interface NotificationItemProps {
  notification: Notification;
  onClose: (id: string) => void;
}

function NotificationItem({ notification, onClose }: NotificationItemProps) {
  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    onClose(notification.id);
  };

  const severity = notification.type === 'error' ? 'error' :
                  notification.type === 'warning' ? 'warning' :
                  notification.type === 'success' ? 'success' : 'info';

  return (
    <Snackbar
      open={true}
      autoHideDuration={notification.autoHide === false ? null : (notification.duration || 5000)}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ 
        position: 'relative',
        '& .MuiSnackbar-root': {
          position: 'relative',
          transform: 'none !important',
          transition: 'none !important',
        }
      }}
    >
      <Alert 
        onClose={handleClose} 
        severity={severity}
        variant="filled"
        sx={{ 
          minWidth: 300,
          maxWidth: 500,
          '& .MuiAlert-message': {
            wordBreak: 'break-word'
          }
        }}
      >
        {notification.message}
      </Alert>
    </Snackbar>
  );
}

function NotificationSystem() {
  const { state, actions } = useAppContext();

  if (state.notifications.length === 0) {
    return null;
  }

  return (
    <Portal>
      <Stack
        spacing={1}
        sx={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          maxHeight: 'calc(100vh - 48px)',
          overflow: 'hidden',
        }}
      >
        {state.notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onClose={actions.removeNotification}
          />
        ))}
      </Stack>
    </Portal>
  );
}

export default NotificationSystem;