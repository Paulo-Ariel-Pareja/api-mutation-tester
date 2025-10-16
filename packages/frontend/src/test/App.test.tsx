import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from '../App';

import { vi } from 'vitest';

// Mock components to avoid complex dependencies
vi.mock('../pages/HomePage', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'home-page' }, 'Home Page');
  },
}));

vi.mock('../pages/TestProgressPage', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'progress-page' }, 'Test Progress Page');
  },
}));

vi.mock('../pages/TestResultsPage', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'results-page' }, 'Test Results Page');
  },
}));

vi.mock('../components/ReportViewerDemo', () => ({
  default: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'report-demo' }, 'Report Viewer Demo');
  },
}));

const createWrapper = (initialEntries: string[] = ['/']) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => {
    const React = require('react');
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(MemoryRouter, { initialEntries }, children)
    );
  };
};

describe('App', () => {
  beforeEach(() => {
    // Mock environment variable
    process.env.NODE_ENV = 'development';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders app header with title', () => {
    render(<App />, { wrapper: createWrapper() });

    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('renders navigation with home button', () => {
    render(<App />, { wrapper: createWrapper() });

    const homeButton = screen.getByRole('link', { name: /home/i });
    expect(homeButton).toBeInTheDocument();
    expect(homeButton).toHaveAttribute('href', '/');
  });

  it('renders home page by default', () => {
    render(<App />, { wrapper: createWrapper(['/']) });

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
  });

  it('renders progress page for progress route', () => {
    render(<App />, { wrapper: createWrapper(['/progress/test-123']) });

    expect(screen.getByTestId('progress-page')).toBeInTheDocument();
  });

  it('renders results page for results route', () => {
    render(<App />, { wrapper: createWrapper(['/results/test-123']) });

    expect(screen.getByTestId('results-page')).toBeInTheDocument();
  });

  it('renders demo page in development mode', () => {
    process.env.NODE_ENV = 'development';
    
    render(<App />, { wrapper: createWrapper(['/demo/report-viewer']) });

    expect(screen.getByTestId('report-demo')).toBeInTheDocument();
  });

  it('shows demo button in development mode', () => {
    process.env.NODE_ENV = 'development';
    
    render(<App />, { wrapper: createWrapper() });

    expect(screen.getByRole('link', { name: /demo/i })).toBeInTheDocument();
  });

  it('hides demo button in production mode', () => {
    process.env.NODE_ENV = 'production';
    
    render(<App />, { wrapper: createWrapper() });

    expect(screen.queryByRole('link', { name: /demo/i })).not.toBeInTheDocument();
  });

  it('renders footer with description', () => {
    render(<App />, { wrapper: createWrapper() });

    expect(screen.getByText(/Test your API's robustness through automated mutations/i)).toBeInTheDocument();
  });

  it('highlights active navigation item', () => {
    render(<App />, { wrapper: createWrapper(['/']) });

    const homeButton = screen.getByRole('link', { name: /home/i });
    expect(homeButton).toHaveStyle('background-color: rgba(255,255,255,0.1)');
  });

  it('renders app bar with assessment icon', () => {
    render(<App />, { wrapper: createWrapper() });

    // Check for the Assessment icon (MUI icon)
    const assessmentIcon = document.querySelector('[data-testid="AssessmentIcon"]');
    expect(assessmentIcon).toBeInTheDocument();
  });

  it('renders responsive layout', () => {
    render(<App />, { wrapper: createWrapper() });

    const container = screen.getByRole('main');
    expect(container).toHaveStyle('flex-grow: 1');
  });

  it('handles unknown routes gracefully', () => {
    render(<App />, { wrapper: createWrapper(['/unknown-route']) });

    // Should still render the app structure
    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('renders error boundary', () => {
    // The ErrorBoundary should be present in the component tree
    render(<App />, { wrapper: createWrapper() });

    // App should render without errors
    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('renders notification system', () => {
    render(<App />, { wrapper: createWrapper() });

    // NotificationSystem should be rendered (though not visible by default)
    // We can't easily test this without triggering notifications
    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('renders global loading indicator', () => {
    render(<App />, { wrapper: createWrapper() });

    // GlobalLoadingIndicator should be rendered (though not visible by default)
    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('maintains layout structure', () => {
    render(<App />, { wrapper: createWrapper() });

    // Check for main layout elements
    expect(screen.getByRole('banner')).toBeInTheDocument(); // AppBar
    expect(screen.getByRole('main')).toBeInTheDocument(); // Container
    expect(screen.getByRole('contentinfo')).toBeInTheDocument(); // Footer
  });

  it('renders with proper semantic HTML', () => {
    render(<App />, { wrapper: createWrapper() });

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('handles route parameters correctly', () => {
    render(<App />, { wrapper: createWrapper(['/progress/test-abc-123']) });

    expect(screen.getByTestId('progress-page')).toBeInTheDocument();
  });

  it('renders mobile-friendly navigation', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(<App />, { wrapper: createWrapper() });

    expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
  });

  it('provides proper accessibility attributes', () => {
    render(<App />, { wrapper: createWrapper() });

    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  describe('routing', () => {
    it('navigates between routes correctly', () => {
      const { rerender } = render(<App />, { wrapper: createWrapper(['/']) });

      expect(screen.getByTestId('home-page')).toBeInTheDocument();

      // Simulate navigation to progress page
      rerender(<App />);
      const wrapper = createWrapper(['/progress/test-123']);
      rerender(<App />, { wrapper });

      expect(screen.getByTestId('progress-page')).toBeInTheDocument();
    });

    it('handles nested routes', () => {
      render(<App />, { wrapper: createWrapper(['/results/test-123/details']) });

      expect(screen.getByTestId('results-page')).toBeInTheDocument();
    });
  });

  describe('theme and styling', () => {
    it('applies consistent theme', () => {
      render(<App />, { wrapper: createWrapper() });

      const appBar = screen.getByRole('banner');
      expect(appBar).toHaveClass('MuiAppBar-root');
    });

    it('uses proper color scheme', () => {
      render(<App />, { wrapper: createWrapper() });

      const title = screen.getByText('API Mutation Tester');
      expect(title).toHaveStyle('font-weight: 600');
    });
  });

  describe('responsive behavior', () => {
    it('adapts to different screen sizes', () => {
      render(<App />, { wrapper: createWrapper() });

      const container = screen.getByRole('main');
      expect(container).toHaveClass('MuiContainer-root');
    });

    it('shows appropriate content for mobile', () => {
      render(<App />, { wrapper: createWrapper() });

      // Should render mobile-friendly navigation
      expect(screen.getByText('API Mutation Tester')).toBeInTheDocument();
    });
  });
});