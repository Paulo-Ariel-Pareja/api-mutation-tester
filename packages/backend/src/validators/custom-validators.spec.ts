import { validate } from 'class-validator';
import { IsValidJson, IsValidUrl, IsValidHeaders } from './custom-validators';
import { IsOptional } from 'class-validator';

class TestDto {
  @IsOptional()
  @IsValidJson()
  jsonField?: any;

  @IsOptional()
  @IsValidUrl()
  urlField?: string;

  @IsOptional()
  @IsValidHeaders()
  headersField?: Record<string, string>;
}

describe('Custom Validators', () => {
  describe('IsValidJson', () => {
    it('should accept null and undefined', async () => {
      const dto = new TestDto();
      dto.jsonField = null;
      let errors = await validate(dto);
      expect(errors.length).toBe(0);

      dto.jsonField = undefined;
      errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid JSON strings', async () => {
      const dto = new TestDto();
      dto.jsonField = '{"key": "value"}';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept objects', async () => {
      const dto = new TestDto();
      dto.jsonField = { key: 'value' };
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject invalid JSON strings', async () => {
      const dto = new TestDto();
      dto.jsonField = '{"invalid": json}';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('jsonField');
      expect(Object.values(errors[0].constraints || {})).toContain('Payload must be valid JSON');
    });

    it('should accept arrays', async () => {
      const dto = new TestDto();
      dto.jsonField = [1, 2, 3];
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept primitive values as objects', async () => {
      const dto = new TestDto();
      dto.jsonField = 42;
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('IsValidUrl', () => {
    it('should accept valid HTTP URLs', async () => {
      const dto = new TestDto();
      dto.urlField = 'http://example.com';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid HTTPS URLs', async () => {
      const dto = new TestDto();
      dto.urlField = 'https://api.example.com/endpoint';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject non-string values', async () => {
      const dto = new TestDto();
      dto.urlField = 123 as any;
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('urlField');
      expect(Object.values(errors[0].constraints || {})).toContain('URL must be a valid HTTP or HTTPS URL');
    });

    it('should reject invalid URLs', async () => {
      const dto = new TestDto();
      dto.urlField = 'not-a-url';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('urlField');
      expect(Object.values(errors[0].constraints || {})).toContain('URL must be a valid HTTP or HTTPS URL');
    });

    it('should reject non-HTTP protocols', async () => {
      const dto = new TestDto();
      dto.urlField = 'ftp://example.com';
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('urlField');
      expect(Object.values(errors[0].constraints || {})).toContain('URL must be a valid HTTP or HTTPS URL');
    });

    it('should accept URLs with ports and paths', async () => {
      const dto = new TestDto();
      dto.urlField = 'https://api.example.com:8080/v1/endpoint?param=value';
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('IsValidHeaders', () => {
    it('should accept null and undefined', async () => {
      const dto = new TestDto();
      dto.headersField = null as any;
      let errors = await validate(dto);
      expect(errors.length).toBe(0);

      dto.headersField = undefined;
      errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept valid headers object', async () => {
      const dto = new TestDto();
      dto.headersField = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer token',
        'X-Custom-Header': 'value'
      };
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should reject arrays', async () => {
      const dto = new TestDto();
      dto.headersField = ['header1', 'header2'] as any;
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('headersField');
      expect(Object.values(errors[0].constraints || {})).toContain('Headers must be an object with string keys and values, and valid header names');
    });

    it('should reject non-object values', async () => {
      const dto = new TestDto();
      dto.headersField = 'not-an-object' as any;
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('headersField');
      expect(Object.values(errors[0].constraints || {})).toContain('Headers must be an object with string keys and values, and valid header names');
    });

    it('should reject objects with non-string keys or values', async () => {
      const dto = new TestDto();
      dto.headersField = {
        'Content-Type': 123
      } as any;
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('headersField');
      expect(Object.values(errors[0].constraints || {})).toContain('Headers must be an object with string keys and values, and valid header names');
    });

    it('should reject invalid header names', async () => {
      const dto = new TestDto();
      dto.headersField = {
        'Invalid Header Name!': 'value'
      };
      const errors = await validate(dto);
      expect(errors.length).toBe(1);
      expect(errors[0].property).toBe('headersField');
      expect(Object.values(errors[0].constraints || {})).toContain('Headers must be an object with string keys and values, and valid header names');
    });

    it('should accept empty headers object', async () => {
      const dto = new TestDto();
      dto.headersField = {};
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should accept headers with underscores and hyphens', async () => {
      const dto = new TestDto();
      dto.headersField = {
        'X_Custom_Header': 'value',
        'X-Another-Header': 'value2',
        'SimpleHeader': 'value3'
      };
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });
});