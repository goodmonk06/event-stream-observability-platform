import { FastifyInstance } from 'fastify';
import { authenticateApiKey } from '../middleware/auth';
import { createLogEventsBatch } from '../models/log';
import { createMetricPointsBatch } from '../models/metric';
import { createCustomEventsBatch } from '../models/event';
import { ingestLogsSchema, ingestMetricsSchema, ingestEventsSchema } from '../validation/schemas';
import { validateBody } from '../utils/validation';

export async function ingestRoutes(app: FastifyInstance) {
  // Ingest logs
  app.post('/ingest/logs', {
    preHandler: [authenticateApiKey, validateBody(ingestLogsSchema)],
    handler: async (request, reply) => {
      const project = (request as any).project;
      const { logs } = request.body as any;

      await createLogEventsBatch(project.id, logs);
      reply.send({ success: true, count: logs.length });
    }
  });

  // Ingest metrics
  app.post('/ingest/metrics', {
    preHandler: [authenticateApiKey, validateBody(ingestMetricsSchema)],
    handler: async (request, reply) => {
      const project = (request as any).project;
      const { metrics } = request.body as any;

      await createMetricPointsBatch(project.id, metrics);
      reply.send({ success: true, count: metrics.length });
    }
  });

  // Ingest custom events
  app.post('/ingest/events', {
    preHandler: [authenticateApiKey, validateBody(ingestEventsSchema)],
    handler: async (request, reply) => {
      const project = (request as any).project;
      const { events } = request.body as any;

      await createCustomEventsBatch(project.id, events);
      reply.send({ success: true, count: events.length });
    }
  });
}
