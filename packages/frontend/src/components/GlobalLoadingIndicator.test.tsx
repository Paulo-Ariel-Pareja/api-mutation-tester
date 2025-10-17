import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import GlobalLoadingIndicator from './GlobalLoadingIndicator';

// Mock the AppContext
const mockUseAppContext = vi.fn();
vi.mock('../contexts/AppContext', () => ({
  useAppContext: () => mockUseAppContext(),
}));

describe('GlobalLoadingIndicator', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: false },
      actions: {}
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when not loading', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: false },
      actions: {}
    });

    const { container } = render(<GlobalLoadingIndicator />);
    expect(container.firstChild).toBeNull();
  });

  it('should render backdrop variant when loading', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });

    render(<GlobalLoadingIndicator />);
    
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
  });

  it('should render backdrop variant by default', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });

    render(<GlobalLoadingIndicator />);
    
    // Should render the backdrop with text
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
  });

  it('should render linear variant when specified', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });

    render(<GlobalLoadingIndicator variant="linear" />);
    
    // Should render linear progress bar
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    // Should not render text elements
    expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
    expect(screen.queryByText('Please wait while we process your request')).not.toBeInTheDocument();
  });

  it('should not render linear variant when not loading', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: false },
      actions: {}
    });

    const { container } = render(<GlobalLoadingIndicator variant="linear" />);
    expect(container.firstChild).toBeNull();
  });

  it('should handle loading state changes', () => {
    const { rerender } = render(<GlobalLoadingIndicator />);
    
    // Initially not loading
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    
    // Start loading
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });
    
    rerender(<GlobalLoadingIndicator />);
    expect(screen.getByRole('progressbar', { hidden: true })).toBeInTheDocument();
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    
    // Stop loading
    mockUseAppContext.mockReturnValue({
      state: { isLoading: false },
      actions: {}
    });
    
    rerender(<GlobalLoadingIndicator />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('should apply correct styling for backdrop variant', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });

    render(<GlobalLoadingIndicator variant="backdrop" />);
    
    const progressbar = screen.getByRole('progressbar', { hidden: true });
    expect(progressbar).toBeInTheDocument();
    
    // Check that backdrop content is rendered
    expect(screen.getByText('Processing...')).toBeInTheDocument();
    expect(screen.getByText('Please wait while we process your request')).toBeInTheDocument();
  });

  it('should apply correct styling for linear variant', () => {
    mockUseAppContext.mockReturnValue({
      state: { isLoading: true },
      actions: {}
    });

    const { container } = render(<GlobalLoadingIndicator variant="linear" />);
    
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toBeInTheDocument();
    
    // Check that it's wrapped in a Box with fixed positioning
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toHaveStyle({
      position: 'fixed',
      top: '0px',
      left: '0px',
      right: '0px'
    });
  });
});