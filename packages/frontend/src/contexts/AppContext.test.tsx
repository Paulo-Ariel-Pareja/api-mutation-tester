import { render, screen, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { AppProvider, useAppContext, Notification } from './AppContext';

// Test component to access context
function TestComponent() {
  const { state, actions } = useAppContext();

  return (
    <div>
      <div data-testid="loading">{state.isLoading.toString()}</div>
      <div data-testid="error">{state.error || 'null'}</div>
      <div data-testid="testId">{state.currentTestId || 'null'}</div>
      <div data-testid="notifications">{state.notifications.length}</div>
      
      <button onClick={() => actions.setLoading(true)}>Set Loading</button>
      <button onClick={() => actions.setError('Test error')}>Set Error</button>
      <button onClick={() => actions.setCurrentTestId('test-123')}>Set Test ID</button>
      <button onClick={() => actions.addNotification({ type: 'info', message: 'Test notification' })}>
        Add Notification
      </button>
      <button onClick={() => actions.clearNotifications()}>Clear Notifications</button>
      <button onClick={() => actions.resetState()}>Reset State</button>
    </div>
  );
}

describe('AppContext', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should provide initial state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('testId')).toHaveTextContent('null');
    expect(screen.getByTestId('notifications')).toHaveTextContent('0');
  });

  it('should update loading state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Loading').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
  });

  it('should update error state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Error').click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
  });

  it('should update test ID state', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Set Test ID').click();
    });

    expect(screen.getByTestId('testId')).toHaveTextContent('test-123');
  });

  it('should add notifications', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Add Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('1');
  });

  it('should auto-remove notifications after timeout', async () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Add Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('1');

    // Fast-forward time by 5 seconds (default duration)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('notifications')).toHaveTextContent('0');
    });
  });

  it('should not auto-remove notifications when autoHide is false', async () => {
    function TestComponentWithPersistentNotification() {
      const { state, actions } = useAppContext();

      return (
        <div>
          <div data-testid="notifications">{state.notifications.length}</div>
          <button 
            onClick={() => actions.addNotification({ 
              type: 'info', 
              message: 'Persistent notification',
              autoHide: false
            })}
          >
            Add Persistent Notification
          </button>
        </div>
      );
    }

    render(
      <AppProvider>
        <TestComponentWithPersistentNotification />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Add Persistent Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('1');

    // Fast-forward time by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Should still be there
    expect(screen.getByTestId('notifications')).toHaveTextContent('1');
  });

  it('should use custom duration for notifications', async () => {
    function TestComponentWithCustomDuration() {
      const { state, actions } = useAppContext();

      return (
        <div>
          <div data-testid="notifications">{state.notifications.length}</div>
          <button 
            onClick={() => actions.addNotification({ 
              type: 'info', 
              message: 'Custom duration notification',
              duration: 1000
            })}
          >
            Add Custom Duration Notification
          </button>
        </div>
      );
    }

    render(
      <AppProvider>
        <TestComponentWithCustomDuration />
      </AppProvider>
    );

    act(() => {
      screen.getByText('Add Custom Duration Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('1');

    // Fast-forward time by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(screen.getByTestId('notifications')).toHaveTextContent('0');
    });
  });

  it('should clear all notifications', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Add multiple notifications
    act(() => {
      screen.getByText('Add Notification').click();
      screen.getByText('Add Notification').click();
      screen.getByText('Add Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('3');

    act(() => {
      screen.getByText('Clear Notifications').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('0');
  });

  it('should reset state to initial values', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Change all state values
    act(() => {
      screen.getByText('Set Loading').click();
      screen.getByText('Set Error').click();
      screen.getByText('Set Test ID').click();
      screen.getByText('Add Notification').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('true');
    expect(screen.getByTestId('error')).toHaveTextContent('Test error');
    expect(screen.getByTestId('testId')).toHaveTextContent('test-123');
    expect(screen.getByTestId('notifications')).toHaveTextContent('1');

    act(() => {
      screen.getByText('Reset State').click();
    });

    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('null');
    expect(screen.getByTestId('testId')).toHaveTextContent('null');
    expect(screen.getByTestId('notifications')).toHaveTextContent('0');
  });

  it('should remove specific notification by ID', () => {
    function TestComponentWithRemove() {
      const { state, actions } = useAppContext();

      return (
        <div>
          <div data-testid="notifications">{state.notifications.length}</div>
          <div data-testid="notification-ids">
            {state.notifications.map(n => n.id).join(',')}
          </div>
          <button onClick={() => actions.addNotification({ type: 'info', message: 'Test 1' })}>
            Add Notification 1
          </button>
          <button onClick={() => actions.addNotification({ type: 'info', message: 'Test 2' })}>
            Add Notification 2
          </button>
          <button onClick={() => {
            if (state.notifications.length > 0) {
              actions.removeNotification(state.notifications[0].id);
            }
          }}>
            Remove First Notification
          </button>
        </div>
      );
    }

    render(
      <AppProvider>
        <TestComponentWithRemove />
      </AppProvider>
    );

    // Add two notifications
    act(() => {
      screen.getByText('Add Notification 1').click();
      screen.getByText('Add Notification 2').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('2');

    // Remove first notification
    act(() => {
      screen.getByText('Remove First Notification').click();
    });

    expect(screen.getByTestId('notifications')).toHaveTextContent('1');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    function ComponentWithoutProvider() {
      useAppContext();
      return <div>Should not render</div>;
    }

    expect(() => {
      render(<ComponentWithoutProvider />);
    }).toThrow('useAppContext must be used within an AppProvider');

    consoleSpy.mockRestore();
  });

  it('should generate unique notification IDs', () => {
    function TestComponentWithIds() {
      const { state, actions } = useAppContext();

      return (
        <div>
          <div data-testid="notification-ids">
            {state.notifications.map(n => n.id).join(',')}
          </div>
          <button onClick={() => actions.addNotification({ type: 'info', message: 'Test' })}>
            Add Notification
          </button>
        </div>
      );
    }

    render(
      <AppProvider>
        <TestComponentWithIds />
      </AppProvider>
    );

    // Add multiple notifications quickly
    act(() => {
      screen.getByText('Add Notification').click();
      screen.getByText('Add Notification').click();
      screen.getByText('Add Notification').click();
    });

    const ids = screen.getByTestId('notification-ids').textContent?.split(',') || [];
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3); // All IDs should be unique
  });
});