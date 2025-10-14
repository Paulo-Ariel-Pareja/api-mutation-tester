import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Box, 
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material'
import { Link, useLocation } from 'react-router-dom'
import { Home, Assessment, Timeline } from '@mui/icons-material'
import ErrorBoundary from './components/ErrorBoundary'
import NotificationSystem from './components/NotificationSystem'
import GlobalLoadingIndicator from './components/GlobalLoadingIndicator'
import HomePage from './pages/HomePage'
import TestProgressPage from './pages/TestProgressPage'
import TestResultsPage from './pages/TestResultsPage'
import ReportViewerDemo from './components/ReportViewerDemo'


function AppContent() {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <Box sx={{ flexGrow: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
            <Assessment sx={{ mr: 1 }} />
            <Typography 
              variant={isMobile ? "h6" : "h5"} 
              component="div" 
              sx={{ fontWeight: 600 }}
            >
              API Mutation Tester
            </Typography>
          </Box>
          
          <Box display="flex" gap={1}>
            <Button 
              color="inherit" 
              component={Link} 
              to="/"
              startIcon={!isMobile ? <Home /> : undefined}
              sx={{ 
                backgroundColor: isActive('/') ? 'rgba(255,255,255,0.1)' : 'transparent',
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
              }}
            >
              {isMobile ? <Home /> : 'Home'}
            </Button>
            
            {/* Demo button - only show in development */}
            {process.env.NODE_ENV === 'development' && (
              <>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/demo/report-viewer"
                  startIcon={!isMobile ? <Timeline /> : undefined}
                  sx={{ 
                    backgroundColor: isActive('/demo') ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  {isMobile ? <Timeline /> : 'Demo'}
                </Button>
                <Button 
                  color="inherit" 
                  component={Link} 
                  to="/demo/report-viewer"
                  sx={{ 
                    backgroundColor: isActive('/test') ? 'rgba(255,255,255,0.1)' : 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.2)' }
                  }}
                >
                  WS Test
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </AppBar>
      
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 2, sm: 4 }, 
          mb: { xs: 2, sm: 4 }, 
          px: { xs: 2, sm: 3 },
          flexGrow: 1
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/progress/:testId" element={<TestProgressPage />} />
          <Route path="/results/:testId" element={<TestResultsPage />} />
          <Route path="/demo/report-viewer" element={<ReportViewerDemo />} />

        </Routes>
      </Container>
      
      <Box 
        component="footer" 
        sx={{ 
          py: 2, 
          px: 3, 
          mt: 'auto',
          backgroundColor: theme.palette.grey[100],
          borderTop: `1px solid ${theme.palette.divider}`
        }}
      >
        <Typography variant="body2" color="text.secondary" align="center">
          API Mutation Tester - Test your API's robustness through automated mutations
        </Typography>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppContent />
        <NotificationSystem />
        <GlobalLoadingIndicator />
      </Router>
    </ErrorBoundary>
  )
}

export default App