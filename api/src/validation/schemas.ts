import { z } from 'zod';

// Project schemas
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1).max(255).optional(),
});

// Log schemas
export const logEntrySchema = z.object({
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string().min(1, 'Message is required'),
  context: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

export const ingestLogsSchema = z.object({
  logs: z.array(logEntrySchema).min(1, 'At least one log entry is required').max(1000),
});

// Metric schemas
export const metricEntrySchema = z.object({
  name: z.string().min(1, 'Metric name is required').max(255),
  type: z.enum(['counter', 'gauge']),
  value: z.number(),
  labels: z.record(z.string()).optional(),
  timestamp: z.string().datetime().optional(),
});

export const ingestMetricsSchema = z.object({
  metrics: z.array(metricEntrySchema).min(1, 'At least one metric is required').max(1000),
});

// Event schemas
export const eventEntrySchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  payload: z.record(z.any()).optional(),
  timestamp: z.string().datetime().optional(),
});

export const ingestEventsSchema = z.object({
  events: z.array(eventEntrySchema).min(1, 'At least one event is required').max(1000),
});

// Query schemas
export const queryLogsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
  search: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

export const queryMetricsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  name: z.string().optional(),
  type: z.enum(['counter', 'gauge']).optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  bucketMinutes: z.coerce.number().int().positive().max(1440).default(5),
});

export const queryEventsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  name: z.string().optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  limit: z.coerce.number().int().positive().max(1000).default(100),
  offset: z.coerce.number().int().nonnegative().default(0),
});

// Type exports
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type IngestLogsInput = z.infer<typeof ingestLogsSchema>;
export type IngestMetricsInput = z.infer<typeof ingestMetricsSchema>;
export type IngestEventsInput = z.infer<typeof ingestEventsSchema>;
export type QueryLogsInput = z.infer<typeof queryLogsSchema>;
export type QueryMetricsInput = z.infer<typeof queryMetricsSchema>;
export type QueryEventsInput = z.infer<typeof queryEventsSchema>;
