import { FastifyInstance } from 'fastify';
import { authenticateApiKey } from '../middleware/auth';
import { createLogEventsBatch } from '../models/log';
import { createMetricPointsBatch } from '../models/metric';
import { createCustomEventsBatch } from '../models/event';
import { IngestLogRequest, IngestMetricRequest, IngestEventRequest } from '../types';

export async function ingestRoutes(app: FastifyInstance) {
  // Ingest logs
  app.post('/ingest/logs', {
    preHandler: authenticateApiKey,
    handler: async (request, reply) => {
      const project = (request as any).project;
      const body = request.body as { logs: IngestLogRequest[] };

      if (!body.logs || !Array.isArray(body.logs)) {
        return reply.code(400).send({ error: 'Request body must contain a "logs" array' });
      }

      try {
        await createLogEventsBatch(project.id, body.logs);
        reply.send({ success: true, count: body.logs.length });
      } catch (error) {
        console.error('Error ingesting logs:', error);
        reply.code(500).send({ error: 'Failed to ingest logs' });
      }
    }
  });

  // Ingest metrics
  app.post('/ingest/metrics', {
    preHandler: authenticateApiKey,
    handler: async (request, reply) => {
      const project = (request as any).project;
      const body = request.body as { metrics: IngestMetricRequest[] };

      if (!body.metrics || !Array.isArray(body.metrics)) {
        return reply.code(400).send({ error: 'Request body must contain a "metrics" array' });
      }

      // Validate metric types
      for (const metric of body.metrics) {
        if (!['counter', 'gauge'].includes(metric.type)) {
          return reply.code(400).send({
            error: `Invalid metric type: ${metric.type}. Must be "counter" or "gauge"`
          });
        }
      }

      try {
        await createMetricPointsBatch(project.id, body.metrics);
        reply.send({ success: true, count: body.metrics.length });
      } catch (error) {
        console.error('Error ingesting metrics:', error);
        reply.code(500).send({ error: 'Failed to ingest metrics' });
      }
    }
  });

  // Ingest custom events
  app.post('/ingest/events', {
    preHandler: authenticateApiKey,
    handler: async (request, reply) => {
      const project = (request as any).project;
      const body = request.body as { events: IngestEventRequest[] };

      if (!body.events || !Array.isArray(body.events)) {
        return reply.code(400).send({ error: 'Request body must contain an "events" array' });
      }

      try {
        await createCustomEventsBatch(project.id, body.events);
        reply.send({ success: true, count: body.events.length });
      } catch (error) {
        console.error('Error ingesting events:', error);
        reply.code(500).send({ error: 'Failed to ingest events' });
      }
    }
  });
}
