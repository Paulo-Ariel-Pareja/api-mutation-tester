import React, { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Typography,
  IconButton,
  Collapse,
  Card,
  CardContent,
  Button,
  Grid,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ExpandMore,
  ExpandLess,
  Download,
  FilterList,
  Clear,
  Visibility,
  Security,
  BugReport,
  CheckCircle,
  Error,
  Warning
} from '@mui/icons-material';
import { Report, TestResult } from '@api-mutation-tester/shared';

interface ReportViewerProps {
  report: Report;
}

type SortField = 'timestamp' | 'statusCode' | 'responseTime' | 'mutationId';
type SortDirection = 'asc' | 'desc';
type FilterCategory = 'all' | 'success' | 'error' | 'vulnerability' | 'integrity';

interface TableFilters {
  category: FilterCategory;
  statusCodeMin: string;
  statusCodeMax: string;
  responseTimeMin: string;
  responseTimeMax: string;
  searchTerm: string;
}

const ReportViewer: React.FC<ReportViewerProps> = ({ report }) => {
  const theme = useTheme();
  
  // Table state
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filter state
  const [filters, setFilters] = useState<TableFilters>({
    category: 'all',
    statusCodeMin: '',
    statusCodeMax: '',
    responseTimeMin: '',
    responseTimeMax: '',
    searchTerm: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // Export state
  const [exportLoading, setExportLoading] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  
  // Detail dialog state
  const [selectedResult, setSelectedResult] = useState<TestResult | null>(null);
  
  // Combine all results (happy path + mutations)
  const allResults = useMemo(() => {
    return [report.happyPathResult, ...report.mutationResults];
  }, [report]);
  
  // Apply filters and sorting
  const filteredAndSortedResults = useMemo(() => {
    let filtered = allResults.filter(result => {
      // Category filter
      if (filters.category !== 'all') {
        switch (filters.category) {
          case 'success':
            if (result.statusCode >= 400) return false;
            break;
          case 'error':
            if (result.statusCode < 400) return false;
            break;
          case 'vulnerability':
            if (!result.vulnerabilityDetected) return false;
            break;
          case 'integrity':
            if (!result.integrityIssue) return false;
            break;
        }
      }
      
      // Status code range filter
      if (filters.statusCodeMin && result.statusCode < parseInt(filters.statusCodeMin)) return false;
      if (filters.statusCodeMax && result.statusCode > parseInt(filters.statusCodeMax)) return false;
      
      // Response time range filter
      if (filters.responseTimeMin && result.responseTime < parseInt(filters.responseTimeMin)) return false;
      if (filters.responseTimeMax && result.responseTime > parseInt(filters.responseTimeMax)) return false;
      
      // Search term filter
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const mutationId = result.mutationId?.toLowerCase() || '';
        const error = result.error?.toLowerCase() || '';
        const responseBody = JSON.stringify(result.responseBody).toLowerCase();
        
        if (!mutationId.includes(searchLower) && 
            !error.includes(searchLower) && 
            !responseBody.includes(searchLower)) {
          return false;
        }
      }
      
      return true;
    });
    
    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (sortField) {
        case 'timestamp':
          aValue = new Date(a.timestamp).getTime();
          bValue = new Date(b.timestamp).getTime();
          break;
        case 'statusCode':
          aValue = a.statusCode;
          bValue = b.statusCode;
          break;
        case 'responseTime':
          aValue = a.responseTime;
          bValue = b.responseTime;
          break;
        case 'mutationId':
          aValue = a.mutationId || (a.isHappyPath ? 'Happy Path' : '');
          bValue = b.mutationId || (b.isHappyPath ? 'Happy Path' : '');
          break;
        default:
          return 0;
      }
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return filtered;
  }, [allResults, filters, sortField, sortDirection]);
  
  // Pagination
  const paginatedResults = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredAndSortedResults.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredAndSortedResults, page, rowsPerPage]);
  
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  const handleFilterChange = (field: keyof TableFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPage(0); // Reset to first page when filters change
  };
  
  const clearFilters = () => {
    setFilters({
      category: 'all',
      statusCodeMin: '',
      statusCodeMax: '',
      responseTimeMin: '',
      responseTimeMax: '',
      searchTerm: ''
    });
    setPage(0);
  };
  
  const getStatusChip = (result: TestResult) => {
    if (result.vulnerabilityDetected) {
      return <Chip label="VULNERABILITY" size="small" color="warning" icon={<Security />} />;
    }
    if (result.integrityIssue) {
      return <Chip label="INTEGRITY ISSUE" size="small" color="error" icon={<BugReport />} />;
    }
    if (result.statusCode >= 500) {
      return <Chip label="SERVER ERROR" size="small" color="error" icon={<Error />} />;
    }
    if (result.statusCode >= 400) {
      return <Chip label="CLIENT ERROR" size="small" color="warning" icon={<Warning />} />;
    }
    return <Chip label="SUCCESS" size="small" color="success" icon={<CheckCircle />} />;
  };
  
  const handleExport = async () => {
    setExportLoading(true);
    try {
      // Generate filename with test metadata
      const timestamp = new Date(report.metadata.executionDate).toISOString().replace(/[:.]/g, '-');
      const url = new URL(report.metadata.targetUrl);
      const hostname = url.hostname.replace(/\./g, '-');
      const filename = `api-mutation-test-${hostname}-${timestamp}.json`;
      
      // Create export data
      const exportData = {
        ...report,
        exportMetadata: {
          exportDate: new Date().toISOString(),
          filteredResults: filteredAndSortedResults.length,
          totalResults: allResults.length,
          appliedFilters: filters
        }
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      });
      const url_download = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url_download;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url_download);
      
      setExportSuccess(true);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setExportLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Test Results Report
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
            color={showFilters ? 'primary' : 'inherit'}
          >
            Filters
          </Button>
          <Button
            variant="contained"
            startIcon={exportLoading ? <CircularProgress size={16} /> : <Download />}
            onClick={handleExport}
            disabled={exportLoading}
          >
            {exportLoading ? 'Exporting...' : 'Export JSON'}
          </Button>
        </Box>
      </Box>
      
      {/* Filter Panel */}
      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Filter Results</Typography>
            <Button
              startIcon={<Clear />}
              onClick={clearFilters}
              size="small"
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  label="Category"
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <MenuItem value="all">All Results</MenuItem>
                  <MenuItem value="success">Success (2xx-3xx)</MenuItem>
                  <MenuItem value="error">Error (4xx-5xx)</MenuItem>
                  <MenuItem value="vulnerability">Vulnerabilities</MenuItem>
                  <MenuItem value="integrity">Integrity Issues</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Min Status Code"
                type="number"
                value={filters.statusCodeMin}
                onChange={(e) => handleFilterChange('statusCodeMin', e.target.value)}
                inputProps={{ min: 100, max: 599 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Max Status Code"
                type="number"
                value={filters.statusCodeMax}
                onChange={(e) => handleFilterChange('statusCodeMax', e.target.value)}
                inputProps={{ min: 100, max: 599 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                size="small"
                label="Min Response Time (ms)"
                type="number"
                value={filters.responseTimeMin}
                onChange={(e) => handleFilterChange('responseTimeMin', e.target.value)}
                inputProps={{ min: 0 }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search in results..."
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="Mutation ID, error message, response..."
              />
            </Grid>
          </Grid>
          
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAndSortedResults.length} of {allResults.length} results
            </Typography>
            {(filters.category !== 'all' || filters.statusCodeMin || filters.statusCodeMax || 
              filters.responseTimeMin || filters.responseTimeMax || filters.searchTerm) && (
              <Chip
                label="Filters Active"
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      </Collapse>
      
      {/* Results Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width="40px"></TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'mutationId'}
                  direction={sortField === 'mutationId' ? sortDirection : 'asc'}
                  onClick={() => handleSort('mutationId')}
                >
                  Test Type
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'statusCode'}
                  direction={sortField === 'statusCode' ? sortDirection : 'asc'}
                  onClick={() => handleSort('statusCode')}
                >
                  Status Code
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'responseTime'}
                  direction={sortField === 'responseTime' ? sortDirection : 'asc'}
                  onClick={() => handleSort('responseTime')}
                >
                  Response Time
                </TableSortLabel>
              </TableCell>
              <TableCell>Status</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortField === 'timestamp' ? sortDirection : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell width="100px">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedResults.map((result) => (
              <React.Fragment key={result.id}>
                <TableRow hover>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setExpandedRow(expandedRow === result.id ? null : result.id)}
                    >
                      {expandedRow === result.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {result.isHappyPath ? 'Happy Path' : (result.mutationId?.replace(/_/g, ' ') || 'Unknown')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={result.statusCode}
                      size="small"
                      color={result.statusCode < 400 ? 'success' : result.statusCode < 500 ? 'warning' : 'error'}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {result.responseTime}ms
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(result)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(result.timestamp).toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => setSelectedResult(result)}
                      title="View Details"
                    >
                      <Visibility />
                    </IconButton>
                  </TableCell>
                </TableRow>
                
                {/* Expanded Row Content */}
                <TableRow>
                  <TableCell colSpan={7} sx={{ py: 0 }}>
                    <Collapse in={expandedRow === result.id} timeout="auto" unmountOnExit>
                      <Box sx={{ p: 2, bgcolor: theme.palette.grey[50] }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" gutterBottom>
                              Request Details
                            </Typography>
                            {result.requestDetails ? (
                              <Box sx={{ mb: 2 }}>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>Method:</strong> {result.requestDetails.method}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                  <strong>URL:</strong> {result.requestDetails.url}
                                </Typography>
                                {result.requestDetails.mutationType && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Mutation:</strong> {result.requestDetails.mutationType.replace(/_/g, ' ')}
                                  </Typography>
                                )}
                                {result.requestDetails.mutationDescription && (
                                  <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>Description:</strong> {result.requestDetails.mutationDescription}
                                  </Typography>
                                )}
                              </Box>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Request details not available
                              </Typography>
                            )}
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" gutterBottom>
                              Response Details
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              <Typography variant="body2" color="text.secondary">
                                <strong>Response Body (preview):</strong>
                              </Typography>
                              <Paper sx={{ p: 1, mt: 1, bgcolor: 'white', maxHeight: 150, overflow: 'auto' }}>
                                <pre style={{ margin: 0, fontSize: '0.7rem', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(result.responseBody, null, 2).substring(0, 300)}
                                  {JSON.stringify(result.responseBody, null, 2).length > 300 && '...'}
                                </pre>
                              </Paper>
                            </Box>
                          </Grid>
                          
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" gutterBottom>
                              Test Information
                            </Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <Typography variant="body2">
                                <strong>Test ID:</strong> {result.id}
                              </Typography>
                              {result.mutationId && (
                                <Typography variant="body2">
                                  <strong>Mutation ID:</strong> {result.mutationId}
                                </Typography>
                              )}
                              <Typography variant="body2">
                                <strong>Execution Time:</strong> {new Date(result.timestamp).toLocaleString()}
                              </Typography>
                              {result.error && (
                                <Box>
                                  <Typography variant="body2" color="error.main">
                                    <strong>Error:</strong>
                                  </Typography>
                                  <Paper sx={{ p: 1, mt: 1, bgcolor: theme.palette.error.light + '20' }}>
                                    <Typography variant="body2" color="error.main">
                                      {result.error}
                                    </Typography>
                                  </Paper>
                                </Box>
                              )}
                            </Box>
                          </Grid>
                        </Grid>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={filteredAndSortedResults.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>
      
      {/* Detail Dialog */}
      <Dialog
        open={!!selectedResult}
        onClose={() => setSelectedResult(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedResult && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedResult.isHappyPath ? 'Happy Path' : selectedResult.mutationId?.replace(/_/g, ' ')} - Details
                </Typography>
                {getStatusChip(selectedResult)}
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Response Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Status Code</Typography>
                          <Chip
                            label={selectedResult.statusCode}
                            color={selectedResult.statusCode < 400 ? 'success' : selectedResult.statusCode < 500 ? 'warning' : 'error'}
                          />
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Response Time</Typography>
                          <Typography variant="body1">{selectedResult.responseTime}ms</Typography>
                        </Box>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Timestamp</Typography>
                          <Typography variant="body1">{new Date(selectedResult.timestamp).toLocaleString()}</Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Test Information
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Test ID</Typography>
                          <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                            {selectedResult.id}
                          </Typography>
                        </Box>
                        {selectedResult.mutationId && (
                          <Box>
                            <Typography variant="body2" color="text.secondary">Mutation Type</Typography>
                            <Typography variant="body1">{selectedResult.mutationId}</Typography>
                          </Box>
                        )}
                        <Box>
                          <Typography variant="body2" color="text.secondary">Issues Detected</Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                            {selectedResult.vulnerabilityDetected && (
                              <Chip label="Vulnerability" size="small" color="warning" />
                            )}
                            {selectedResult.integrityIssue && (
                              <Chip label="Integrity Issue" size="small" color="error" />
                            )}
                            {!selectedResult.vulnerabilityDetected && !selectedResult.integrityIssue && (
                              <Chip label="No Issues" size="small" color="success" />
                            )}
                          </Box>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Request Details
                      </Typography>
                      {selectedResult.requestDetails ? (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Method & URL</Typography>
                            <Typography variant="body1" sx={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                              {selectedResult.requestDetails.method} {selectedResult.requestDetails.url}
                            </Typography>
                          </Box>
                          
                          {selectedResult.requestDetails.mutationType && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Mutation Type</Typography>
                              <Chip 
                                label={selectedResult.requestDetails.mutationType.replace(/_/g, ' ')} 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                          )}
                          
                          {selectedResult.requestDetails.mutationDescription && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Description</Typography>
                              <Typography variant="body1">{selectedResult.requestDetails.mutationDescription}</Typography>
                            </Box>
                          )}
                          
                          <Box>
                            <Typography variant="body2" color="text.secondary">Headers</Typography>
                            <Paper sx={{ p: 1, mt: 1, bgcolor: theme.palette.grey[50], maxHeight: 150, overflow: 'auto' }}>
                              <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(selectedResult.requestDetails.headers, null, 2)}
                              </pre>
                            </Paper>
                          </Box>
                          
                          {selectedResult.requestDetails.payload && (
                            <Box>
                              <Typography variant="body2" color="text.secondary">Request Payload</Typography>
                              <Paper sx={{ p: 1, mt: 1, bgcolor: theme.palette.grey[50], maxHeight: 200, overflow: 'auto' }}>
                                <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                                  {JSON.stringify(selectedResult.requestDetails.payload, null, 2)}
                                </pre>
                              </Paper>
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Request details not available for this result.
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Response Body
                      </Typography>
                      <Paper sx={{ p: 2, bgcolor: theme.palette.grey[50], maxHeight: 400, overflow: 'auto' }}>
                        <pre style={{ margin: 0, fontSize: '0.875rem', whiteSpace: 'pre-wrap' }}>
                          {JSON.stringify(selectedResult.responseBody, null, 2)}
                        </pre>
                      </Paper>
                    </CardContent>
                  </Card>
                </Grid>
                
                {selectedResult.error && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="error.main">
                          Error Details
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: theme.palette.error.light + '20' }}>
                          <Typography variant="body2" color="error.main">
                            {selectedResult.error}
                          </Typography>
                        </Paper>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedResult(null)}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
      
      {/* Export Success Snackbar */}
      <Snackbar
        open={exportSuccess}
        autoHideDuration={4000}
        onClose={() => setExportSuccess(false)}
      >
        <Alert onClose={() => setExportSuccess(false)} severity="success">
          Report exported successfully!
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportViewer;