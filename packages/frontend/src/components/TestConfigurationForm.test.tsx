import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TestConfigurationForm from './TestConfigurationForm';
import { HttpMethod } from '@api-mutation-tester/shared';

import { vi } from 'vitest';

// Mock the API hook
vi.mock('../hooks/useApi', () => ({
  useCreateTest: () => ({
    mutate: vi.fn(),
    isPending: false,
    isSuccess: false,
    isError: false,
    error: null,
    data: null,
  }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TestConfigurationForm', () => {
  let mockOnTestStarted: any;
  let mockOnError: any;

  beforeEach(() => {
    mockOnTestStarted = vi.fn();
    mockOnError = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with all required fields', () => {
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByLabelText(/API Endpoint URL/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/HTTP Method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Timeout/i)).toBeInTheDocument();
    expect(screen.getByText(/JSON Payload/i)).toBeInTheDocument();
    expect(screen.getByText(/Headers/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Mutation Test/i })).toBeInTheDocument();
  });

  it('validates required URL field', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    expect(submitButton).toBeDisabled();

    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'invalid-url');

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid HTTP\/HTTPS URL/i)).toBeInTheDocument();
    });
  });

  it('validates URL format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'https://api.example.com/test');

    await waitFor(() => {
      expect(screen.queryByText(/Please enter a valid HTTP\/HTTPS URL/i)).not.toBeInTheDocument();
    });
  });

  it('validates timeout range', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const timeoutInput = screen.getByLabelText(/Timeout/i);
    
    // Test minimum validation
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '500');

    await waitFor(() => {
      expect(screen.getByText(/Timeout must be at least 1000ms/i)).toBeInTheDocument();
    });

    // Test maximum validation
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '400000');

    await waitFor(() => {
      expect(screen.getByText(/Timeout cannot exceed 300000ms/i)).toBeInTheDocument();
    });
  });

  it('validates JSON payload format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Find the JSON payload editor (Monaco editor or textarea)
    const payloadEditor = screen.getByRole('textbox', { name: /JSON Payload/i });
    
    await user.type(payloadEditor, '{"invalid": json}');

    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON format/i)).toBeInTheDocument();
    });
  });

  it('allows adding and removing headers', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Initially should have one header row
    expect(screen.getAllByLabelText(/Header Name/i)).toHaveLength(1);

    // Add header
    const addButton = screen.getByRole('button', { name: /Add Header/i });
    await user.click(addButton);

    expect(screen.getAllByLabelText(/Header Name/i)).toHaveLength(2);

    // Remove header (should not be able to remove the last one)
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    await user.click(deleteButtons[1]);

    expect(screen.getAllByLabelText(/Header Name/i)).toHaveLength(1);
  });

  it('validates header names format', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const headerNameInput = screen.getByLabelText(/Header Name/i);
    await user.type(headerNameInput, 'Invalid Header Name!');

    await waitFor(() => {
      expect(screen.getByText(/Invalid header name format/i)).toBeInTheDocument();
    });
  });

  it('shows confirmation dialog before submission', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Fill out valid form
    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'https://api.example.com/test');

    const timeoutInput = screen.getByLabelText(/Timeout/i);
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '30000');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    await user.click(submitButton);

    // Should show confirmation dialog
    await waitFor(() => {
      expect(screen.getByText(/Confirm Test Execution/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/You are about to start a mutation test/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Test/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
  });

  it('handles form submission cancellation', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Fill out valid form
    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'https://api.example.com/test');

    const timeoutInput = screen.getByLabelText(/Timeout/i);
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '30000');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    await user.click(submitButton);

    // Cancel in confirmation dialog
    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelButton);

    // Dialog should close
    await waitFor(() => {
      expect(screen.queryByText(/Confirm Test Execution/i)).not.toBeInTheDocument();
    });
  });

  it('handles different HTTP methods', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const methodSelect = screen.getByLabelText(/HTTP Method/i);
    
    // Test POST method
    await user.click(methodSelect);
    await user.click(screen.getByText('POST'));

    expect(methodSelect).toHaveValue(HttpMethod.POST);

    // Test PUT method
    await user.click(methodSelect);
    await user.click(screen.getByText('PUT'));

    expect(methodSelect).toHaveValue(HttpMethod.PUT);
  });

  it('shows validation summary when there are errors', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Create validation errors
    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'invalid-url');

    const timeoutInput = screen.getByLabelText(/Timeout/i);
    await user.clear(timeoutInput);
    await user.type(timeoutInput, '500');

    await waitFor(() => {
      expect(screen.getByText(/Please fix the following issues:/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when form is invalid', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    
    // Initially disabled (no URL)
    expect(submitButton).toBeDisabled();

    // Still disabled with invalid URL
    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'invalid-url');

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Enabled with valid URL
    await user.clear(urlInput);
    await user.type(urlInput, 'https://api.example.com/test');

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('handles valid JSON payload', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const payloadEditor = screen.getByRole('textbox', { name: /JSON Payload/i });
    await user.type(payloadEditor, '{"name": "test", "value": 123}');

    // Should not show JSON error
    await waitFor(() => {
      expect(screen.queryByText(/Invalid JSON format/i)).not.toBeInTheDocument();
    });
  });

  it('shows form status information', () => {
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    expect(screen.getByText(/Complete the form to enable testing/i)).toBeInTheDocument();
  });

  it('handles empty payload correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    // Fill required fields
    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'https://api.example.com/test');

    // Leave payload empty - should be valid
    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('validates that payload must be JSON object', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const payloadEditor = screen.getByRole('textbox', { name: /JSON Payload/i });
    
    // Test array (should be invalid)
    await user.type(payloadEditor, '[1, 2, 3]');

    await waitFor(() => {
      expect(screen.getByText(/Payload must be a valid JSON object/i)).toBeInTheDocument();
    });

    // Test string (should be invalid)
    await user.clear(payloadEditor);
    await user.type(payloadEditor, '"string"');

    await waitFor(() => {
      expect(screen.getByText(/Payload must be a valid JSON object/i)).toBeInTheDocument();
    });
  });

  it('shows localhost warning for localhost URLs', async () => {
    const user = userEvent.setup();
    
    render(
      <TestConfigurationForm 
        onTestStarted={mockOnTestStarted}
        onError={mockOnError}
      />,
      { wrapper: createWrapper() }
    );

    const urlInput = screen.getByLabelText(/API Endpoint URL/i);
    await user.type(urlInput, 'http://localhost:3000/api');

    // Should show warning but still be valid
    await waitFor(() => {
      expect(screen.getByText(/Warning: Testing localhost endpoints only/i)).toBeInTheDocument();
    });

    const submitButton = screen.getByRole('button', { name: /Start Mutation Test/i });
    expect(submitButton).not.toBeDisabled();
  });
});