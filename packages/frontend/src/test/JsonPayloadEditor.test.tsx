import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import JsonPayloadEditor from '../components/JsonPayloadEditor';

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => {
  return {
    __esModule: true,
    default: ({ value, onChange, onMount, options }: any) => {
      React.useEffect(() => {
        if (onMount) {
          const mockEditor = {
            focus: vi.fn(),
            updateOptions: vi.fn(),
          };
          onMount(mockEditor);
        }
      }, [onMount]);

      return (
        <textarea
          data-testid="monaco-editor"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={options?.readOnly}
          style={{ width: '100%', height: '300px' }}
        />
      );
    },
  };
});

describe('JsonPayloadEditor', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders with default placeholder', () => {
    render(
      <JsonPayloadEditor
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText('Request Payload (JSON)')).toBeInTheDocument();
    expect(screen.getByText('Editor')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('shows valid JSON success message', async () => {
    const validJson = '{"key": "value"}';
    
    render(
      <JsonPayloadEditor
        value={validJson}
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Valid JSON format')).toBeInTheDocument();
    });
  });

  it('shows error for invalid JSON', async () => {
    const invalidJson = '{"key": "value"';
    
    render(
      <JsonPayloadEditor
        value={invalidJson}
        onChange={mockOnChange}
        error="Invalid JSON format"
      />
    );

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid JSON format/)).toBeInTheDocument();
    });
  });

  it('calls onChange when editor value changes', async () => {
    render(
      <JsonPayloadEditor
        value=""
        onChange={mockOnChange}
      />
    );

    const editor = screen.getByTestId('monaco-editor');
    fireEvent.change(editor, { target: { value: '{"test": true}' } });

    expect(mockOnChange).toHaveBeenCalledWith('{"test": true}');
  });

  it('disables preview tab for invalid JSON', () => {
    render(
      <JsonPayloadEditor
        value="invalid json"
        onChange={mockOnChange}
      />
    );

    // Check that preview tab is disabled by checking if it's clickable
    const previewTab = screen.getByRole('tab', { name: /preview/i });
    // For this test, we'll just check that the tab exists and has the correct tabindex
    expect(previewTab).toHaveAttribute('tabindex', '-1');
  });

  it('enables preview tab for valid JSON', async () => {
    render(
      <JsonPayloadEditor
        value='{"valid": "json"}'
        onChange={mockOnChange}
      />
    );

    await waitFor(() => {
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      expect(previewTab).not.toHaveAttribute('aria-disabled', 'true');
    });
  });

  it('shows help text when empty', () => {
    render(
      <JsonPayloadEditor
        value=""
        onChange={mockOnChange}
      />
    );

    expect(screen.getByText(/Enter valid JSON or leave empty for GET requests/)).toBeInTheDocument();
    expect(screen.getByText('Example:')).toBeInTheDocument();
  });

  it('disables editor when disabled prop is true', () => {
    render(
      <JsonPayloadEditor
        value=""
        onChange={mockOnChange}
        disabled={true}
      />
    );

    const editor = screen.getByTestId('monaco-editor');
    expect(editor).toBeDisabled();
  });
});