import { describe, it, expect } from 'vitest';
import {
  createProjectSchema,
  ingestLogsSchema,
  ingestMetricsSchema,
  queryLogsSchema,
} from '../validation/schemas';

describe('Validation Schemas', () => {
  describe('createProjectSchema', () => {
    it('should validate valid project name', () => {
      const result = createProjectSchema.safeParse({ name: 'Test Project' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('Test Project');
      }
    });

    it('should reject empty name', () => {
      const result = createProjectSchema.safeParse({ name: '' });
      expect(result.success).toBe(false);
    });

    it('should reject missing name', () => {
      const result = createProjectSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe('ingestLogsSchema', () => {
    it('should validate valid log entries', () => {
      const result = ingestLogsSchema.safeParse({
        logs: [
          { level: 'info', message: 'Test message' },
          { level: 'error', message: 'Error message', context: { code: 500 } },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid log level', () => {
      const result = ingestLogsSchema.safeParse({
        logs: [{ level: 'invalid', message: 'Test' }],
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty logs array', () => {
      const result = ingestLogsSchema.safeParse({ logs: [] });
      expect(result.success).toBe(false);
    });

    it('should reject logs without message', () => {
      const result = ingestLogsSchema.safeParse({
        logs: [{ level: 'info' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('ingestMetricsSchema', () => {
    it('should validate valid metric entries', () => {
      const result = ingestMetricsSchema.safeParse({
        metrics: [
          { name: 'cpu.usage', type: 'gauge', value: 75.5 },
          { name: 'api.requests', type: 'counter', value: 100, labels: { endpoint: '/users' } },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid metric type', () => {
      const result = ingestMetricsSchema.safeParse({
        metrics: [{ name: 'test', type: 'histogram', value: 10 }],
      });
      expect(result.success).toBe(false);
    });

    it('should validate timestamp format', () => {
      const result = ingestMetricsSchema.safeParse({
        metrics: [
          {
            name: 'test',
            type: 'gauge',
            value: 10,
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });

  describe('queryLogsSchema', () => {
    it('should validate query with defaults', () => {
      const result = queryLogsSchema.safeParse({ projectId: '1' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe(1);
        expect(result.data.limit).toBe(100);
        expect(result.data.offset).toBe(0);
      }
    });

    it('should coerce string projectId to number', () => {
      const result = queryLogsSchema.safeParse({ projectId: '42' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.projectId).toBe(42);
      }
    });

    it('should reject invalid projectId', () => {
      const result = queryLogsSchema.safeParse({ projectId: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should validate log level filter', () => {
      const result = queryLogsSchema.safeParse({
        projectId: '1',
        level: 'error',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.level).toBe('error');
      }
    });

    it('should reject limit over maximum', () => {
      const result = queryLogsSchema.safeParse({
        projectId: '1',
        limit: '2000',
      });
      expect(result.success).toBe(false);
    });
  });
});
