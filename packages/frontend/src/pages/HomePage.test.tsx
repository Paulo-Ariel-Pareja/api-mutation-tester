import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './HomePage';

// Mock the AppContext
const mockUseAppContext = vi.fn();
vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

// Mock the TestConfigurationForm component
const mockTestConfigurationForm = vi.fn();
vi.mock('../components/TestConfigurationForm', () => ({
  default: (props: any) => {
    mockTestConfigurationForm(props);
    return (
      <div data-testid="test-configuration-form">
        <button onClick={() => props.onTestStarted('test-123')}>Start Test</button>
        <button onClick={() => props.onError('Test error')}>Trigger Error</button>
      </div>
    );
  },
}));

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('HomePage', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      state: {
        isLoading: false,
        error: null,
        currentTestId: null,
        notifications: []
      },
      actions: {}
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and description', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
    expect(screen.getByText("Test your API's robustness through automated mutations")).toBeInTheDocument();
  });

  it('should render TestConfigurationForm', () => {
    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('test-configuration-form')).toBeInTheDocument();
    expect(mockTestConfigurationForm).toHaveBeenCalledWith(
      expect.objectContaining({
        onTestStarted: expect.any(Function),
        onError: expect.any(Function)
      })
    );
  });

  it('should not show error alert when no error', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        isLoading: false,
        error: null,
        currentTestId: null,
        notifications: []
      },
      actions: {}
    });

    renderWithRouter(<HomePage />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should show error alert when error exists', () => {
    mockUseAppContext.mockReturnValue({
      state: {
        isLoading: false,
        error: 'Something went wrong',
        currentTestId: null,
        notifications: []
      },
      actions: {}
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should navigate to progress page when test is started', () => {
    renderWithRouter(<HomePage />);

    const startTestButton = screen.getByText('Start Test');
    startTestButton.click();

    expect(mockNavigate).toHaveBeenCalledWith('/progress/test-123');
  });

  it('should handle error from TestConfigurationForm', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<HomePage />);

    const triggerErrorButton = screen.getByText('Trigger Error');
    triggerErrorButton.click();

    expect(consoleSpy).toHaveBeenCalledWith('Test configuration error:', 'Test error');

    consoleSpy.mockRestore();
  });

  it('should pass correct props to TestConfigurationForm', () => {
    renderWithRouter(<HomePage />);

    expect(mockTestConfigurationForm).toHaveBeenCalledWith({
      onTestStarted: expect.any(Function),
      onError: expect.any(Function)
    });
  });

  it('should handle different error types', () => {
    const errorMessages = [
      'Network error',
      'Validation failed',
      'Server unavailable',
      null
    ];

    errorMessages.forEach(error => {
      mockUseAppContext.mockReturnValue({
        state: {
          isLoading: false,
          error,
          currentTestId: null,
          notifications: []
        },
        actions: {}
      });

      const { unmount } = renderWithRouter(<HomePage />);

      if (error) {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(error)).toBeInTheDocument();
      } else {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      }

      unmount();
    });
  });

  it('should maintain page structure with different states', () => {
    const states = [
      { isLoading: true, error: null },
      { isLoading: false, error: 'Error message' },
      { isLoading: true, error: 'Error message' },
      { isLoading: false, error: null }
    ];

    states.forEach(state => {
      mockUseAppContext.mockReturnValue({
        state: {
          ...state,
          currentTestId: null,
          notifications: []
        },
        actions: {}
      });

      const { unmount } = renderWithRouter(<HomePage />);

      // Core elements should always be present
      expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
      expect(screen.getByText("Test your API's robustness through automated mutations")).toBeInTheDocument();
      expect(screen.getByTestId('test-configuration-form')).toBeInTheDocument();

      unmount();
    });
  });

  it('should handle navigation with different test IDs', () => {
    const testIds = ['test-123', 'test-456', 'test-789'];

    testIds.forEach(testId => {
      renderWithRouter(<HomePage />);

      // Simulate test started with different ID
      const call = mockTestConfigurationForm.mock.calls[mockTestConfigurationForm.mock.calls.length - 1];
      const onTestStarted = call[0].onTestStarted;
      onTestStarted(testId);

      expect(mockNavigate).toHaveBeenCalledWith(`/progress/${testId}`);

      vi.clearAllMocks();
    });
  });

  it('should handle multiple error triggers', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    renderWithRouter(<HomePage />);

    const triggerErrorButton = screen.getByText('Trigger Error');
    
    // Trigger multiple errors
    triggerErrorButton.click();
    triggerErrorButton.click();
    triggerErrorButton.click();

    expect(consoleSpy).toHaveBeenCalledTimes(3);
    expect(consoleSpy).toHaveBeenCalledWith('Test configuration error:', 'Test error');

    consoleSpy.mockRestore();
  });
});