import { Test, TestingModule } from '@nestjs/testing';
import { MutationGeneratorService } from './mutation-generator.service';
import { HttpRequest, HttpMethod, MutationType } from '@api-mutation-tester/shared';

describe('MutationGeneratorService', () => {
  let service: MutationGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MutationGeneratorService],
    }).compile();

    service = module.get<MutationGeneratorService>(MutationGeneratorService);
  });

  describe('generateMutations', () => {
    it('should generate mutations for GET request with query parameters', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users?id=123&name=test',
        method: HttpMethod.GET,
        headers: { 'Authorization': 'Bearer token' },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      expect(mutations.some(m => m.type === MutationType.STRING_MALICIOUS)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.MISSING_FIELD)).toBeTruthy();
    });

    it('should generate mutations for POST request with payload', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'John', email: 'john@example.com', age: 30 },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      
      // Should have string mutations
      expect(mutations.some(m => m.type === MutationType.STRING_EMPTY)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.STRING_LONG)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.STRING_MALICIOUS)).toBeTruthy();
      
      // Should have type mutations
      expect(mutations.some(m => m.type === MutationType.TYPE_NULL)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.TYPE_BOOLEAN)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.TYPE_ARRAY)).toBeTruthy();
      
      // Should have structure mutations
      expect(mutations.some(m => m.type === MutationType.MISSING_FIELD)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.EXTRA_FIELD)).toBeTruthy();
      
      // Should have numeric mutations
      expect(mutations.some(m => m.type === MutationType.NUMERIC_LARGE)).toBeTruthy();
      expect(mutations.some(m => m.type === MutationType.NUMERIC_NEGATIVE)).toBeTruthy();
    });

    it('should generate header mutations for all request types', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.GET,
        headers: { 'Authorization': 'Bearer token', 'User-Agent': 'TestAgent' },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      const headerMutations = mutations.filter(m => 
        m.originalField === 'Authorization' || 
        m.originalField === 'User-Agent' ||
        m.originalField?.startsWith('X-') ||
        m.originalField === 'Host'
      );

      expect(headerMutations.length).toBeGreaterThan(0);
    });

    it('should generate URL mutations for GET requests without parameters', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: HttpMethod.GET,
        headers: {},
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      expect(mutations.some(m => m.type === MutationType.EXTRA_FIELD)).toBeTruthy();
    });

    it('should handle requests without payload', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: HttpMethod.DELETE,
        headers: { 'Authorization': 'Bearer token' },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      // Should have header mutations since no payload
      const hasHeaderMutations = mutations.some(m => 
        m.originalField === 'Authorization' ||
        m.originalField?.startsWith('X-') ||
        m.originalField === 'Host' ||
        m.originalField === 'Referer' ||
        m.originalField === 'User-Agent' ||
        m.originalField === 'Origin'
      );
      expect(hasHeaderMutations).toBeTruthy();
    });
  });

  describe('getMutationCategories', () => {
    it('should return all mutation categories', () => {
      const categories = service.getMutationCategories();

      expect(categories).toHaveProperty('string_mutations');
      expect(categories).toHaveProperty('type_mutations');
      expect(categories).toHaveProperty('numeric_mutations');
      expect(categories).toHaveProperty('character_mutations');
      expect(categories).toHaveProperty('structure_mutations');

      expect(categories.string_mutations.types).toContain(MutationType.STRING_EMPTY);
      expect(categories.type_mutations.types).toContain(MutationType.TYPE_NULL);
      expect(categories.numeric_mutations.types).toContain(MutationType.NUMERIC_LARGE);
    });
  });

  describe('getMutationTypeDescription', () => {
    it('should return description for all mutation types', () => {
      const types = Object.values(MutationType);

      types.forEach(type => {
        const description = service.getMutationTypeDescription(type);
        
        expect(description).toHaveProperty('name');
        expect(description).toHaveProperty('description');
        expect(description).toHaveProperty('purpose');
        expect(typeof description.name).toBe('string');
        expect(typeof description.description).toBe('string');
        expect(typeof description.purpose).toBe('string');
      });
    });

    it('should return specific descriptions for known types', () => {
      const emptyStringDesc = service.getMutationTypeDescription(MutationType.STRING_EMPTY);
      expect(emptyStringDesc.name).toBe('Empty String');
      expect(emptyStringDesc.description).toContain('empty string');

      const sqlInjectionDesc = service.getMutationTypeDescription(MutationType.STRING_MALICIOUS);
      expect(sqlInjectionDesc.name).toBe('Malicious Script');
      expect(sqlInjectionDesc.purpose).toContain('XSS');
    });
  });

  describe('getMutationStatistics', () => {
    it('should calculate statistics correctly', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/users',
        method: HttpMethod.POST,
        headers: { 'Content-Type': 'application/json' },
        payload: { name: 'John', age: 30 },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);
      const stats = service.getMutationStatistics(mutations);

      expect(stats.total).toBe(mutations.length);
      expect(stats.byType).toBeDefined();
      expect(stats.byCategory).toBeDefined();

      // Verify totals match
      const typeTotal = Object.values(stats.byType).reduce((sum, count) => sum + count, 0);
      expect(typeTotal).toBe(mutations.length);

      // Verify categories have counts
      expect(Object.values(stats.byCategory).some(count => count > 0)).toBeTruthy();
    });

    it('should handle empty mutations array', () => {
      const stats = service.getMutationStatistics([]);

      expect(stats.total).toBe(0);
      expect(Object.values(stats.byType).every(count => count === 0)).toBeTruthy();
      expect(Object.values(stats.byCategory).every(count => count === 0)).toBeTruthy();
    });
  });

  describe('getMutationDocumentation', () => {
    it('should return complete documentation', () => {
      const docs = service.getMutationDocumentation();

      expect(docs).toHaveProperty('overview');
      expect(docs).toHaveProperty('categories');
      expect(docs).toHaveProperty('types');

      expect(typeof docs.overview).toBe('string');
      expect(docs.overview.length).toBeGreaterThan(0);

      // Verify all categories are documented
      const categories = service.getMutationCategories();
      Object.keys(categories).forEach(categoryKey => {
        expect(docs.categories).toHaveProperty(categoryKey);
      });

      // Verify all types are documented
      Object.values(MutationType).forEach(type => {
        expect(docs.types).toHaveProperty(type as string);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle malformed URLs gracefully', () => {
      const request: HttpRequest = {
        url: 'not-a-valid-url',
        method: HttpMethod.GET,
        headers: {},
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      // Should still generate some basic mutations
    });

    it('should handle empty payload object', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: {},
        payload: {},
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      // Should generate structure mutations even for empty payload
      expect(mutations.some(m => m.type === MutationType.EXTRA_FIELD)).toBeTruthy();
    });

    it('should handle nested payload objects', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: {},
        payload: {
          user: {
            name: 'John',
            profile: {
              age: 30,
              email: 'john@example.com'
            }
          },
          settings: {
            theme: 'dark',
            notifications: true
          }
        },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);

      expect(mutations.length).toBeGreaterThan(0);
      // Should generate mutations for nested fields
      expect(mutations.some(m => m.originalField === 'user')).toBeTruthy();
      expect(mutations.some(m => m.originalField === 'settings')).toBeTruthy();
    });

    it('should generate unique mutation IDs', () => {
      const request: HttpRequest = {
        url: 'https://api.example.com/test',
        method: HttpMethod.POST,
        headers: {},
        payload: { name: 'test' },
        timeout: 5000,
      };

      const mutations = service.generateMutations(request);
      const ids = mutations.map(m => m.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});