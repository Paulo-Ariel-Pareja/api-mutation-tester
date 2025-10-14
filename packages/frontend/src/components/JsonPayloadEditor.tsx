import React, { useState, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Alert,
  Paper,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  FormatAlignLeft as FormatIcon,
  Visibility as PreviewIcon,
  Code as CodeIcon,
  ContentCopy as CopyIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import Editor from '@monaco-editor/react';

interface JsonPayloadEditorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`json-tabpanel-${index}`}
      aria-labelledby={`json-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

const JsonPayloadEditor: React.FC<JsonPayloadEditorProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = '{\n  "key": "value",\n  "number": 123,\n  "boolean": true\n}',
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [jsonError, setJsonError] = useState<string>('');
  const [formattedJson, setFormattedJson] = useState<string>('');
  const editorRef = useRef<any>(null);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    if (newValue === 1) {
      // Preview tab - format JSON for display
      formatJsonForPreview();
    }
  };

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    const jsonValue = newValue || '';
    onChange(jsonValue);
    validateJson(jsonValue);
  }, [onChange]);

  const validateJson = (jsonString: string) => {
    if (!jsonString.trim()) {
      setJsonError('');
      return;
    }

    try {
      JSON.parse(jsonString);
      setJsonError('');
    } catch (error) {
      if (error instanceof Error) {
        setJsonError(`Invalid JSON: ${error.message}`);
      } else {
        setJsonError('Invalid JSON format');
      }
    }
  };

  const formatJsonForPreview = () => {
    if (!value.trim()) {
      setFormattedJson('');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setFormattedJson(JSON.stringify(parsed, null, 2));
    } catch (error) {
      setFormattedJson(value); // Show original if invalid
    }
  };

  const formatJson = () => {
    if (!value.trim()) return;

    try {
      const parsed = JSON.parse(value);
      const formatted = JSON.stringify(parsed, null, 2);
      onChange(formatted);
      
      // Focus editor after formatting
      if (editorRef.current) {
        editorRef.current.focus();
      }
    } catch (error) {
      // JSON is invalid, don't format
    }
  };

  const clearJson = () => {
    onChange('');
    setJsonError('');
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = value;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  const onEditorMount = (editor: any) => {
    editorRef.current = editor;
    
    // Configure editor options
    editor.updateOptions({
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollbar: {
        vertical: 'auto',
        horizontal: 'auto',
      },
      wordWrap: 'on',
      automaticLayout: true,
    });
  };

  const isValidJson = !jsonError && value.trim();

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Request Payload (JSON)</Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Format JSON">
            <span>
              <IconButton
                onClick={formatJson}
                disabled={disabled || !value.trim() || !!jsonError}
                size="small"
              >
                <FormatIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Copy to clipboard">
            <span>
              <IconButton
                onClick={copyToClipboard}
                disabled={disabled || !value.trim()}
                size="small"
              >
                <CopyIcon />
              </IconButton>
            </span>
          </Tooltip>
          <Tooltip title="Clear">
            <span>
              <IconButton
                onClick={clearJson}
                disabled={disabled || !value.trim()}
                size="small"
              >
                <ClearIcon />
              </IconButton>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="JSON editor tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab
            icon={<CodeIcon />}
            label="Editor"
            id="json-tab-0"
            aria-controls="json-tabpanel-0"
          />
          <Tab
            icon={<PreviewIcon />}
            label="Preview"
            id="json-tab-1"
            aria-controls="json-tabpanel-1"
            disabled={!isValidJson}
          />
        </Tabs>

        <TabPanel value={activeTab} index={0}>
          <Box sx={{ height: 300, border: 'none' }}>
            <Editor
              height="300px"
              defaultLanguage="json"
              value={value}
              onChange={handleEditorChange}
              onMount={onEditorMount}
              options={{
                readOnly: disabled,
                theme: 'vs-light',
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                lineNumbers: 'on',
                wordWrap: 'on',
                automaticLayout: true,
                formatOnPaste: true,
                formatOnType: true,
              }}
              loading={
                <Box
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  height="300px"
                >
                  Loading editor...
                </Box>
              }
            />
          </Box>
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <Box sx={{ height: 300, overflow: 'auto', p: 2 }}>
            {isValidJson ? (
              <pre
                style={{
                  margin: 0,
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}
              >
                {formattedJson || JSON.stringify(JSON.parse(value), null, 2)}
              </pre>
            ) : (
              <Typography color="text.secondary" fontStyle="italic">
                {value.trim() ? 'Invalid JSON - fix errors to see preview' : 'Enter JSON to see preview'}
              </Typography>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Error Display */}
      {(jsonError || error) && (
        <Alert severity="error" sx={{ mt: 1 }}>
          {jsonError || error}
        </Alert>
      )}

      {/* Success Display */}
      {isValidJson && !error && (
        <Alert severity="success" sx={{ mt: 1 }}>
          Valid JSON format
        </Alert>
      )}

      {/* Help Text */}
      {!value.trim() && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Enter valid JSON or leave empty for GET requests. Use the Format button to prettify your JSON.
          </Typography>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="text.secondary">
            Example:
          </Typography>
          <pre
            style={{
              margin: '8px 0 0 0',
              padding: '8px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px',
              fontSize: '12px',
              fontFamily: 'monospace',
              overflow: 'auto',
            }}
          >
            {placeholder}
          </pre>
        </Box>
      )}
    </Box>
  );
};

export default JsonPayloadEditor;