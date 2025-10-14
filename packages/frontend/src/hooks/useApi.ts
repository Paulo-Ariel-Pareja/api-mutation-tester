import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../contexts/AppContext';
import apiService, { CreateTestRequest, CreateTestResponse, ApiError } from '../services/api';
import { TestStatus, Report } from '@api-mutation-tester/shared';

export function useCreateTest() {
  const { actions } = useAppContext();

  return useMutation<CreateTestResponse, ApiError, CreateTestRequest>({
    mutationFn: apiService.createTest,
    onMutate: () => {
      actions.setLoading(true);
      actions.setError(null);
    },
    onSuccess: (data) => {
      actions.setLoading(false);
      actions.setCurrentTestId(data.testId);
      actions.addNotification({
        type: 'success',
        message: `Test started successfully! Test ID: ${data.testId}`,
        autoHide: true,
        duration: 3000,
      });
    },
    onError: (error) => {
      actions.setLoading(false);
      actions.setError(error.message);
      actions.addNotification({
        type: 'error',
        message: `Failed to start test: ${error.message}`,
        autoHide: true,
        duration: 5000,
      });
    },
  });
}

export function useTestStatus(testId: string | null, enabled = true) {
  const { actions } = useAppContext();

  return useQuery<TestStatus, ApiError>({
    queryKey: ['test-status', testId],
    queryFn: () => apiService.getTestStatus(testId!),
    enabled: enabled && !!testId,
    refetchInterval: (data) => {
      // Stop polling if test is completed or failed
      if (data?.status === 'completed' || data?.status === 'failed') {
        return false;
      }
      return 2000; // Poll every 2 seconds
    },
    onError: (error) => {
      actions.addNotification({
        type: 'error',
        message: `Failed to get test status: ${error.message}`,
        autoHide: true,
      });
    },
  });
}

export function useTestReport(testId: string | null, enabled = true) {
  const { actions } = useAppContext();

  return useQuery<Report, ApiError>({
    queryKey: ['test-report', testId],
    queryFn: () => apiService.getTestReport(testId!),
    enabled: enabled && !!testId,
    retry: 3,
    retryDelay: 1000,
    onError: (error) => {
      actions.addNotification({
        type: 'error',
        message: `Failed to load test report: ${error.message}`,
        autoHide: true,
      });
    },
  });
}

export function useExportReport() {
  const { actions } = useAppContext();

  return useMutation<Blob, ApiError, string>({
    mutationFn: apiService.exportTestReport,
    onMutate: () => {
      actions.setLoading(true);
    },
    onSuccess: (blob, testId) => {
      actions.setLoading(false);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `api-mutation-test-${testId}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      actions.addNotification({
        type: 'success',
        message: 'Report exported successfully!',
        autoHide: true,
        duration: 3000,
      });
    },
    onError: (error) => {
      actions.setLoading(false);
      actions.addNotification({
        type: 'error',
        message: `Failed to export report: ${error.message}`,
        autoHide: true,
      });
    },
  });
}

// Hook for invalidating queries when needed
export function useInvalidateQueries() {
  const queryClient = useQueryClient();

  return {
    invalidateTestStatus: (testId: string) => {
      queryClient.invalidateQueries({ queryKey: ['test-status', testId] });
    },
    invalidateTestReport: (testId: string) => {
      queryClient.invalidateQueries({ queryKey: ['test-report', testId] });
    },
    invalidateAll: () => {
      queryClient.invalidateQueries();
    },
  };
}