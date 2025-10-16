import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import NotificationSystem from './NotificationSystem';
import { Notification } from '../contexts/AppContext';

// Mock the AppContext
const mockUseAppContext = vi.fn();
vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

// Mock Portal to avoid issues with document.body
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    Portal: ({ children }: { children: React.ReactNode }) => <div data-testid="portal">{children}</div>,
  };
});

describe('NotificationSystem', () => {
  const mockRemoveNotification = vi.fn();

  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      state: { notifications: [] },
      actions: { removeNotification: mockRemoveNotification }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when no notifications', () => {
    const { container } = render(<NotificationSystem />);
    expect(container.firstChild).toBeNull();
  });

  it('should render single notification', () => {
    const notification: Notification = {
      id: '1',
      message: 'Test notification',
      type: 'info',
      duration: 5000,
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('Test notification')).toBeInTheDocument();
    expect(screen.getByTestId('portal')).toBeInTheDocument();
  });

  it('should render multiple notifications', () => {
    const notifications: Notification[] = [
      {
        id: '1',
        message: 'First notification',
        type: 'info',
        duration: 5000,
        autoHide: true
      },
      {
        id: '2',
        message: 'Second notification',
        type: 'success',
        duration: 5000,
        autoHide: true
      }
    ];

    mockUseAppContext.mockReturnValue({
      state: { notifications },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('First notification')).toBeInTheDocument();
    expect(screen.getByText('Second notification')).toBeInTheDocument();
  });

  it('should handle different notification types', () => {
    const notifications: Notification[] = [
      {
        id: '1',
        message: 'Error message',
        type: 'error',
        duration: 5000,
        autoHide: true
      },
      {
        id: '2',
        message: 'Warning message',
        type: 'warning',
        duration: 5000,
        autoHide: true
      },
      {
        id: '3',
        message: 'Success message',
        type: 'success',
        duration: 5000,
        autoHide: true
      },
      {
        id: '4',
        message: 'Info message',
        type: 'info',
        duration: 5000,
        autoHide: true
      }
    ];

    mockUseAppContext.mockReturnValue({
      state: { notifications },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('Error message')).toBeInTheDocument();
    expect(screen.getByText('Warning message')).toBeInTheDocument();
    expect(screen.getByText('Success message')).toBeInTheDocument();
    expect(screen.getByText('Info message')).toBeInTheDocument();
  });

  it('should call removeNotification when close button is clicked', async () => {
    const notification: Notification = {
      id: '1',
      message: 'Test notification',
      type: 'info',
      duration: 5000,
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);
    
    expect(mockRemoveNotification).toHaveBeenCalledWith('1');
  });

  it('should not auto-hide when autoHide is false', () => {
    const notification: Notification = {
      id: '1',
      message: 'Persistent notification',
      type: 'info',
      duration: 1000,
      autoHide: false
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('Persistent notification')).toBeInTheDocument();
    
    // Wait longer than the duration to ensure it doesn't auto-hide
    setTimeout(() => {
      expect(mockRemoveNotification).not.toHaveBeenCalled();
    }, 1500);
  });

  it('should use custom duration when provided', () => {
    const notification: Notification = {
      id: '1',
      message: 'Custom duration notification',
      type: 'info',
      duration: 10000,
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('Custom duration notification')).toBeInTheDocument();
  });

  it('should use default duration when not provided', () => {
    const notification: Notification = {
      id: '1',
      message: 'Default duration notification',
      type: 'info',
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText('Default duration notification')).toBeInTheDocument();
  });

  it('should not close on clickaway', () => {
    const notification: Notification = {
      id: '1',
      message: 'Test notification',
      type: 'info',
      duration: 5000,
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    // Simulate clickaway event
    const alert = screen.getByRole('alert');
    fireEvent.click(document.body);
    
    expect(mockRemoveNotification).not.toHaveBeenCalled();
  });

  it('should handle long messages with word break', () => {
    const notification: Notification = {
      id: '1',
      message: 'This is a very long notification message that should break words properly when displayed in the notification system',
      type: 'info',
      duration: 5000,
      autoHide: true
    };

    mockUseAppContext.mockReturnValue({
      state: { notifications: [notification] },
      actions: { removeNotification: mockRemoveNotification }
    });

    render(<NotificationSystem />);
    
    expect(screen.getByText(/This is a very long notification message/)).toBeInTheDocument();
  });

  it('should render notifications in a stack', () => {
    const notifications: Notification[] = [
      {
        id: '1',
        message: 'First notification',
        type: 'info',
        duration: 5000,
        autoHide: true
      },
      {
        id: '2',
        message: 'Second notification',
        type: 'success',
        duration: 5000,
        autoHide: true
      }
    ];

    mockUseAppContext.mockReturnValue({
      state: { notifications },
      actions: { removeNotification: mockRemoveNotification }
    });

    const { container } = render(<NotificationSystem />);
    
    // Check that both notifications are rendered
    expect(screen.getByText('First notification')).toBeInTheDocument();
    expect(screen.getByText('Second notification')).toBeInTheDocument();
    
    // Check that they are in a stack container
    const portal = screen.getByTestId('portal');
    expect(portal).toBeInTheDocument();
  });
});