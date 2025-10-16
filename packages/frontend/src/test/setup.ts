import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';

// Global test setup for frontend

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables
beforeAll(() => {
  Object.defineProperty(import.meta, 'env', {
    value: {
      VITE_API_URL: 'http://localhost:3003',
      NODE_ENV: 'test',
      DEV: false,
      PROD: false,
      SSR: false,
    },
    writable: true,
  });
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mocked-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
});

// Mock fetch
global.fetch = vi.fn();

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  console.log = vi.fn();
  console.warn = vi.fn();
  console.error = vi.fn();
  console.info = vi.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});

// Global test utilities
global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  mockFile: (name: string, content: string, type: string = 'text/plain') => {
    return new File([content], name, { type });
  },
  
  mockBlob: (content: string, type: string = 'application/json') => {
    return new Blob([content], { type });
  },
  
  createMockEvent: (type: string, properties: any = {}) => {
    const event = new Event(type);
    Object.assign(event, properties);
    return event;
  },
};

// Extend global types
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    mockFile: (name: string, content: string, type?: string) => File;
    mockBlob: (content: string, type?: string) => Blob;
    createMockEvent: (type: string, properties?: any) => Event;
  };
}

// Custom matchers for Vitest
import { expect } from 'vitest';

expect.extend({
  toBeValidUUID(received: string) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const pass = uuidRegex.test(received);
    
    return {
      pass,
      message: () => pass 
        ? `expected ${received} not to be a valid UUID`
        : `expected ${received} to be a valid UUID`,
    };
  },
  
  toBeValidUrl(received: string) {
    try {
      new URL(received);
      return {
        pass: true,
        message: () => `expected ${received} not to be a valid URL`,
      };
    } catch {
      return {
        pass: false,
        message: () => `expected ${received} to be a valid URL`,
      };
    }
  },
  
  toHaveValidFormData(received: FormData) {
    const pass = received instanceof FormData;
    
    return {
      pass,
      message: () => pass
        ? `expected ${received} not to be valid FormData`
        : `expected ${received} to be valid FormData`,
    };
  },
});

// Extend Vitest matchers
interface CustomMatchers<R = unknown> {
  toBeValidUUID(): R;
  toBeValidUrl(): R;
  toHaveValidFormData(): R;
}

declare module 'vitest' {
  interface Assertion<T = any> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}

// Handle unhandled promise rejections in tests
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ value, onChange, ...props }) => {
    const React = require('react');
    return React.createElement('textarea', {
      'data-testid': 'monaco-editor',
      value: value || '',
      onChange: (e) => onChange?.(e.target.value),
      ...props
    });
  }),
}));

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: vi.fn(({ data, options, ...props }) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'line-chart',
      'data-chart-data': JSON.stringify(data),
      ...props
    });
  }),
  Bar: vi.fn(({ data, options, ...props }) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'bar-chart',
      'data-chart-data': JSON.stringify(data),
      ...props
    });
  }),
  Pie: vi.fn(({ data, options, ...props }) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'pie-chart',
      'data-chart-data': JSON.stringify(data),
      ...props
    });
  }),
  Doughnut: vi.fn(({ data, options, ...props }) => {
    const React = require('react');
    return React.createElement('div', {
      'data-testid': 'doughnut-chart',
      'data-chart-data': JSON.stringify(data),
      ...props
    });
  }),
}));

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  ArcElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
}));