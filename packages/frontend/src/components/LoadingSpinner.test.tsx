import { render, screen } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders loading spinner', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    render(<LoadingSpinner size={60} />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '60px', height: '60px' });
  });

  it('renders with custom message', () => {
    render(<LoadingSpinner message="Custom loading message" />);
    
    expect(screen.getByText('Custom loading message')).toBeInTheDocument();
  });

  it('renders without message when not provided', () => {
    render(<LoadingSpinner />);
    
    // Should not have any text content
    const container = screen.getByRole('progressbar').parentElement;
    expect(container?.textContent).toBe('');
  });

  it('applies custom color', () => {
    render(<LoadingSpinner color="secondary" />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveClass('MuiCircularProgress-colorSecondary');
  });

  it('centers content properly', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const container = screen.getByRole('progressbar').parentElement;
    expect(container).toHaveStyle({
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    });
  });

  it('renders with all props combined', () => {
    render(
      <LoadingSpinner 
        size={50} 
        color="primary" 
        message="Please wait..." 
      />
    );
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveStyle({ width: '50px', height: '50px' });
    expect(spinner).toHaveClass('MuiCircularProgress-colorPrimary');
    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<LoadingSpinner message="Loading data..." />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toHaveAttribute('aria-label', 'loading');
  });

  it('message has proper typography styling', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const message = screen.getByText('Loading...');
    expect(message).toHaveClass('MuiTypography-body2');
  });

  it('handles empty string message', () => {
    render(<LoadingSpinner message="" />);
    
    const spinner = screen.getByRole('progressbar');
    expect(spinner).toBeInTheDocument();
    
    // Empty message should not render text element
    expect(screen.queryByText('')).not.toBeInTheDocument();
  });

  it('handles very long messages', () => {
    const longMessage = 'This is a very long loading message that might wrap to multiple lines and should still be displayed properly';
    
    render(<LoadingSpinner message={longMessage} />);
    
    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it('maintains consistent spacing between spinner and message', () => {
    render(<LoadingSpinner message="Loading..." />);
    
    const container = screen.getByRole('progressbar').parentElement;
    expect(container).toHaveStyle({ gap: '16px' });
  });
});