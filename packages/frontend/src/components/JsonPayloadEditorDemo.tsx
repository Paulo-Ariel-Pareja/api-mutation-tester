import React, { useState } from 'react';
import { Box, Paper, Typography, Button, Alert } from '@mui/material';
import JsonPayloadEditor from './JsonPayloadEditor';

/**
 * Demo component to showcase JsonPayloadEditor functionality
 * This demonstrates the key features implemented in task 9.2:
 * - JSON editor with syntax highlighting (Monaco Editor)
 * - JSON validation with error display
 * - Payload preview and formatting features
 */
const JsonPayloadEditorDemo: React.FC = () => {
  const [jsonValue, setJsonValue] = useState('');
  const [submittedValue, setSubmittedValue] = useState<any>(null);

  const handleSubmit = () => {
    try {
      const parsed = JSON.parse(jsonValue);
      setSubmittedValue(parsed);
    } catch (error) {
      setSubmittedValue({ error: 'Invalid JSON' });
    }
  };

  const handleClear = () => {
    setJsonValue('');
    setSubmittedValue(null);
  };

  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        JSON Payload Editor Demo
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This demo showcases the JsonPayloadEditor component integrated in task 9.2.
        Features include:
      </Typography>
      
      <Box component="ul" sx={{ mb: 3, color: 'text.secondary' }}>
        <li>Monaco Editor with JSON syntax highlighting</li>
        <li>Real-time JSON validation with error messages</li>
        <li>Format, copy, and clear functionality</li>
        <li>Preview tab for formatted JSON display</li>
        <li>Success/error indicators</li>
      </Box>

      <Paper elevation={2} sx={{ p: 2, mb: 3 }}>
        <JsonPayloadEditor
          value={jsonValue}
          onChange={setJsonValue}
          placeholder={`{
  "user": {
    "name": "John Doe",
    "email": "john@example.com",
    "preferences": {
      "theme": "dark",
      "notifications": true
    }
  },
  "data": [1, 2, 3, 4, 5],
  "timestamp": "2024-01-01T00:00:00Z"
}`}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!jsonValue.trim()}
        >
          Submit JSON
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={!jsonValue.trim()}
        >
          Clear
        </Button>
      </Box>

      {submittedValue && (
        <Paper elevation={1} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Submitted Value:
          </Typography>
          {submittedValue.error ? (
            <Alert severity="error">{submittedValue.error}</Alert>
          ) : (
            <pre
              style={{
                backgroundColor: '#f5f5f5',
                padding: '16px',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '14px',
                fontFamily: 'monospace',
              }}
            >
              {JSON.stringify(submittedValue, null, 2)}
            </pre>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default JsonPayloadEditorDemo;