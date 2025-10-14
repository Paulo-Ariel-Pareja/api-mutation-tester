export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH'
}

export enum MutationType {
  STRING_EMPTY = 'STRING_EMPTY',
  STRING_LONG = 'STRING_LONG',
  STRING_MALICIOUS = 'STRING_MALICIOUS',
  TYPE_BOOLEAN = 'TYPE_BOOLEAN',
  TYPE_ARRAY = 'TYPE_ARRAY',
  TYPE_NULL = 'TYPE_NULL',
  TYPE_UNDEFINED = 'TYPE_UNDEFINED',
  NUMERIC_LARGE = 'NUMERIC_LARGE',
  NUMERIC_NEGATIVE = 'NUMERIC_NEGATIVE',
  NUMERIC_ZERO = 'NUMERIC_ZERO',
  SPECIAL_CHARACTERS = 'SPECIAL_CHARACTERS',
  UNICODE_CHARACTERS = 'UNICODE_CHARACTERS',
  MISSING_FIELD = 'MISSING_FIELD',
  EXTRA_FIELD = 'EXTRA_FIELD',
  INVALID_TYPE = 'INVALID_TYPE'
}

export interface TestConfig {
  id: string;
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  payload?: any;
  timeout: number;
  createdAt: Date;
}

export interface HttpRequest {
  url: string;
  method: HttpMethod;
  headers: Record<string, string>;
  payload?: any;
  timeout: number;
}

export interface HttpResponse {
  statusCode: number;
  responseTime: number;
  responseBody: any;
  headers: Record<string, string>;
  error?: string;
}

export interface Mutation {
  id: string;
  type: MutationType;
  description: string;
  modifiedRequest: HttpRequest;
  originalField?: string;
  mutationStrategy: string;
}

export interface TestResult {
  id: string;
  mutationId?: string;
  isHappyPath: boolean;
  statusCode: number;
  responseTime: number;
  responseBody: any;
  error?: string;
  vulnerabilityDetected: boolean;
  integrityIssue: boolean;
  timestamp: Date;
  // Request information for debugging and analysis
  requestDetails?: {
    url: string;
    method: HttpMethod;
    headers: Record<string, string>;
    payload?: any;
    mutationType?: MutationType;
    mutationDescription?: string;
  };
}

export interface TestStatus {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  currentPhase: 'validation' | 'happy-path' | 'mutations' | 'report';
  totalMutations: number;
  completedMutations: number;
  startTime: Date;
  endTime?: Date;
}

export interface Report {
  testId: string;
  summary: {
    totalTests: number;
    successfulTests: number;
    failedTests: number;
    vulnerabilitiesFound: number;
    integrityIssues: number;
    averageResponseTime: number;
  };
  happyPathResult: TestResult;
  mutationResults: TestResult[];
  metadata: {
    targetUrl: string;
    executionDate: Date;
    duration: number;
  };
}