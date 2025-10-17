import { Component, ErrorInfo, ReactNode } from "react";
import {
  Typography,
  Button,
  Alert,
  Paper,
  Container,
  Stack,
} from "@mui/material";
import { Refresh, Home, BugReport } from "@mui/icons-material";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when children change
    if (this.state.hasError && prevProps.children !== this.props.children) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  handleReportError = () => {
    const { error, errorInfo } = this.state;
    const errorReport = {
      error: error?.toString(),
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    console.error("Error Report:", errorReport);

    // In a real app, you would send this to your error reporting service
    alert(
      "Error details have been logged to the console. Please report this issue."
    );
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <BugReport color="error" sx={{ fontSize: 64 }} />

              <Typography variant="h4" component="h1" color="error">
                Oops! Something went wrong
              </Typography>

              <Typography variant="body1" color="text.secondary">
                We're sorry, but something unexpected happened. This error has
                been logged and we'll work to fix it as soon as possible.
              </Typography>

              <Alert severity="error" sx={{ width: "100%", textAlign: "left" }}>
                <Typography variant="subtitle2" gutterBottom>
                  Error Details:
                </Typography>
                <Typography
                  variant="body2"
                  component="pre"
                  sx={{
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    fontSize: "0.875rem",
                  }}
                >
                  {this.state.error?.toString()}
                </Typography>
              </Alert>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Refresh />}
                  onClick={this.handleReload}
                >
                  Reload Page
                </Button>

                <Button
                  variant="outlined"
                  startIcon={<Home />}
                  onClick={this.handleGoHome}
                >
                  Go Home
                </Button>

                <Button
                  variant="text"
                  startIcon={<BugReport />}
                  onClick={this.handleReportError}
                  size="small"
                >
                  Report Error
                </Button>
              </Stack>

              {process.env.NODE_ENV === "development" &&
                this.state.errorInfo && (
                  <Alert
                    severity="warning"
                    sx={{ width: "100%", textAlign: "left" }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      Component Stack (Development Only):
                    </Typography>
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        fontSize: "0.75rem",
                        maxHeight: 200,
                        overflow: "auto",
                      }}
                    >
                      {this.state.errorInfo.componentStack}
                    </Typography>
                  </Alert>
                )}
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
