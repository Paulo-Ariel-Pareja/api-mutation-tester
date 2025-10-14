import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Grid,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { HttpMethod } from '@api-mutation-tester/shared';
import { CreateTestRequest } from '../services/api';
import { useCreateTest } from '../hooks/useApi';
import JsonPayloadEditor from './JsonPayloadEditor';

interface TestConfigFormData {
  url: string;
  method: HttpMethod;
  headers: Array<{ key: string; value: string }>;
  payload: string;
  timeout: number;
}

interface TestConfigurationFormProps {
  onTestStarted?: (testId: string) => void;
  onError?: (error: string) => void;
}

const TestConfigurationForm: React.FC<TestConfigurationFormProps> = ({
  onTestStarted,
  onError,
}) => {
  const [jsonError, setJsonError] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [pendingSubmission, setPendingSubmission] = useState<TestConfigFormData | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid, isSubmitting },
    trigger,
  } = useForm<TestConfigFormData>({
    defaultValues: {
      url: '',
      method: HttpMethod.GET,
      headers: [{ key: '', value: '' }],
      payload: '',
      timeout: 30000,
    },
    mode: 'onChange',
    reValidateMode: 'onChange',
  });

  // Mutation for creating test
  const createTestMutation = useCreateTest();

  // Handle successful test creation
  React.useEffect(() => {
    if (createTestMutation.isSuccess && createTestMutation.data) {
      setSuccessMessage(`Test started successfully! Test ID: ${createTestMutation.data.testId}`);
      onTestStarted?.(createTestMutation.data.testId);
      reset(); // Reset form after successful submission
    }
  }, [createTestMutation.isSuccess, createTestMutation.data, onTestStarted, reset]);

  // Handle errors
  React.useEffect(() => {
    if (createTestMutation.isError && createTestMutation.error) {
      onError?.(createTestMutation.error.message);
    }
  }, [createTestMutation.isError, createTestMutation.error, onError]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'headers',
  });

  const watchedPayload = watch('payload');

  // Validate JSON payload with enhanced validation
  React.useEffect(() => {
    if (watchedPayload.trim()) {
      try {
        const parsed = JSON.parse(watchedPayload);
        // Additional validation for payload structure
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          setJsonError('Payload must be a valid JSON object');
        } else {
          setJsonError('');
        }
      } catch (error) {
        setJsonError('Invalid JSON format - please check syntax');
      }
    } else {
      setJsonError('');
    }
    // Trigger form validation when JSON changes
    trigger('payload');
  }, [watchedPayload, trigger]);

  const onFormSubmit = async (data: TestConfigFormData) => {
    // Additional validation before submission
    if (jsonError) {
      onError?.('Please fix JSON payload errors before submitting');
      return;
    }

    // Store the form data and show confirmation dialog
    setPendingSubmission(data);
    setConfirmDialogOpen(true);
  };

  const handleConfirmSubmission = async () => {
    if (!pendingSubmission) return;

    const data = pendingSubmission;
    setConfirmDialogOpen(false);
    setPendingSubmission(null);

    // Convert headers array to object, filtering out empty entries
    const headersObject = data.headers
      .filter(header => header.key.trim() && header.value.trim())
      .reduce((acc, header) => {
        const key = header.key.trim();
        const value = header.value.trim();
        
        // Validate header names (basic validation)
        if (!/^[a-zA-Z0-9\-_]+$/.test(key)) {
          onError?.(`Invalid header name: ${key}. Use only alphanumeric characters, hyphens, and underscores.`);
          return acc;
        }
        
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

    // Parse payload if provided
    let payload: any = undefined;
    if (data.payload.trim()) {
      try {
        payload = JSON.parse(data.payload);
        
        // Additional payload validation
        if (typeof payload !== 'object' || Array.isArray(payload)) {
          onError?.('Payload must be a valid JSON object');
          return;
        }
      } catch (error) {
        onError?.('Invalid JSON payload format');
        return;
      }
    }

    // Final URL validation
    try {
      new URL(data.url.trim());
    } catch (error) {
      onError?.('Please enter a valid URL');
      return;
    }

    const config: CreateTestRequest = {
      url: data.url.trim(),
      method: data.method,
      headers: headersObject,
      payload,
      timeout: data.timeout,
    };

    createTestMutation.mutate(config);
  };

  const handleCancelSubmission = () => {
    setConfirmDialogOpen(false);
    setPendingSubmission(null);
  };

  const addHeader = () => {
    append({ key: '', value: '' });
  };

  const removeHeader = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h5" component="h2" gutterBottom>
        API Test Configuration
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Configure your API endpoint for mutation testing
      </Typography>

      <Box component="form" onSubmit={handleSubmit(onFormSubmit)} noValidate>
        <Grid container spacing={3}>
          {/* URL Input */}
          <Grid item xs={12}>
            <Controller
              name="url"
              control={control}
              rules={{
                required: 'URL is required',
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please enter a valid HTTP/HTTPS URL',
                },
                validate: {
                  validUrl: (value) => {
                    try {
                      new URL(value);
                      return true;
                    } catch {
                      return 'Please enter a valid URL';
                    }
                  },
                  notLocalhost: (value) => {
                    console.log(value)
                    try {
                      new URL(value);
                      if (value.toLocaleLowerCase().includes('localhost') || value.toLocaleLowerCase().includes('127.0.0.1')) {
                        return true
                      } 
                      return 'Warning: Testing localhost endpoints only';
                    } catch {
                      return true; // Let other validation handle invalid URLs
                    }
                  }
                }
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="API Endpoint URL"
                  placeholder="https://api.example.com/endpoint"
                  error={!!errors.url}
                  helperText={errors.url?.message}
                  disabled={createTestMutation.isPending}
                />
              )}
            />
          </Grid>

          {/* HTTP Method Selection */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>HTTP Method</InputLabel>
              <Controller
                name="method"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    label="HTTP Method"
                    disabled={createTestMutation.isPending}
                  >
                    {Object.values(HttpMethod).map((method) => (
                      <MenuItem key={method} value={method}>
                        {method}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </FormControl>
          </Grid>

          {/* Timeout */}
          <Grid item xs={12} sm={6}>
            <Controller
              name="timeout"
              control={control}
              rules={{
                required: 'Timeout is required',
                min: {
                  value: 1000,
                  message: 'Timeout must be at least 1000ms',
                },
                max: {
                  value: 300000,
                  message: 'Timeout cannot exceed 300000ms (5 minutes)',
                },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  type="number"
                  label="Timeout (ms)"
                  error={!!errors.timeout}
                  helperText={errors.timeout?.message}
                  disabled={createTestMutation.isPending}
                />
              )}
            />
          </Grid>

          {/* JSON Payload Editor */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Controller
              name="payload"
              control={control}
              render={({ field }) => (
                <JsonPayloadEditor
                  value={field.value}
                  onChange={field.onChange}
                  error={jsonError}
                  disabled={createTestMutation.isPending}
                  placeholder={`{
  "key": "value",
  "number": 123,
  "boolean": true,
  "array": [1, 2, 3],
  "nested": {
    "property": "value"
  }
}`}
                />
              )}
            />
          </Grid>

          {/* Headers Section */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
              <Typography variant="h6">Headers</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={addHeader}
                disabled={createTestMutation.isPending}
                size="small"
              >
                Add Header
              </Button>
            </Box>

            {fields.map((field, index) => (
              <Box key={field.id} sx={{ mb: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={5}>
                    <Controller
                      name={`headers.${index}.key`}
                      control={control}
                      rules={{
                        pattern: {
                          value: /^[a-zA-Z0-9\-_]*$/,
                          message: 'Invalid header name format'
                        }
                      }}
                      render={({ field, fieldState }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Header Name"
                          placeholder="Content-Type"
                          size="small"
                          disabled={createTestMutation.isPending}
                          error={!!fieldState.error}
                          helperText={fieldState.error?.message}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={5}>
                    <Controller
                      name={`headers.${index}.value`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          fullWidth
                          label="Header Value"
                          placeholder="application/json"
                          size="small"
                          disabled={createTestMutation.isPending}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <IconButton
                      onClick={() => removeHeader(index)}
                      disabled={fields.length <= 1 || createTestMutation.isPending}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </Grid>
              </Box>
            ))}
          </Grid>

          {/* Validation Summary */}
          {(Object.keys(errors).length > 0 || jsonError) && (
            <Grid item xs={12}>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Please fix the following issues:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {errors.url && <li>{errors.url.message}</li>}
                  {errors.timeout && <li>{errors.timeout.message}</li>}
                  {jsonError && <li>{jsonError}</li>}
                  {errors.headers && Array.isArray(errors.headers) && errors.headers.some(h => h?.key) && (
                    <li>Invalid header names detected</li>
                  )}
                </ul>
              </Alert>
            </Grid>
          )}

          {/* Submit Button */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="center" mt={2}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={!isValid || !!jsonError || createTestMutation.isPending || isSubmitting}
                startIcon={createTestMutation.isPending ? <CircularProgress size={20} /> : <PlayIcon />}
                sx={{ minWidth: 200 }}
              >
                {createTestMutation.isPending || isSubmitting ? 'Starting Test...' : 'Start Mutation Test'}
              </Button>
            </Box>
            
            {/* Form Status Information */}
            <Box display="flex" justifyContent="center" mt={1}>
              <Typography variant="caption" color="text.secondary">
                {isValid && !jsonError && !createTestMutation.isPending 
                  ? 'Ready to start mutation testing' 
                  : 'Complete the form to enable testing'
                }
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={6000}
        onClose={() => setSuccessMessage('')}
      >
        <Alert onClose={() => setSuccessMessage('')} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Error Display */}
      {createTestMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {createTestMutation.error?.message || 'Failed to start test. Please try again.'}
        </Alert>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelSubmission}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Test Execution</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            You are about to start a mutation test with the following configuration:
          </Typography>
          
          {pendingSubmission && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2"><strong>URL:</strong> {pendingSubmission.url}</Typography>
              <Typography variant="body2"><strong>Method:</strong> {pendingSubmission.method}</Typography>
              <Typography variant="body2"><strong>Timeout:</strong> {pendingSubmission.timeout}ms</Typography>
              
              {pendingSubmission.headers.some(h => h.key.trim() && h.value.trim()) && (
                <Typography variant="body2">
                  <strong>Headers:</strong> {
                    pendingSubmission.headers
                      .filter(h => h.key.trim() && h.value.trim())
                      .map(h => `${h.key}: ${h.value}`)
                      .join(', ')
                  }
                </Typography>
              )}
              
              {pendingSubmission.payload.trim() && (
                <Typography variant="body2">
                  <strong>Payload:</strong> JSON object provided
                </Typography>
              )}
            </Box>
          )}
          
          <Alert severity="info" sx={{ mt: 2 }}>
            This will execute the happy path test first, followed by multiple mutation tests. 
            The process may take several minutes depending on your API's response time.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelSubmission} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmSubmission} 
            variant="contained" 
            color="primary"
            startIcon={<PlayIcon />}
          >
            Start Test
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TestConfigurationForm;