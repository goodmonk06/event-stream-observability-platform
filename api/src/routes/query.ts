import { FastifyInstance } from 'fastify';
import { queryLogs } from '../models/log';
import { queryMetrics, aggregateMetrics } from '../models/metric';
import { queryEvents } from '../models/event';
import { queryLogsSchema, queryMetricsSchema, queryEventsSchema } from '../validation/schemas';
import { validateQuery } from '../utils/validation';

export async function queryRoutes(app: FastifyInstance) {
  // Query logs
  app.get('/query/logs', {
    preHandler: validateQuery(queryLogsSchema),
    handler: async (request, reply) => {
      const query = request.query as any;

      const options = {
        projectId: query.projectId,
        level: query.level,
        search: query.search,
        startTime: query.startTime ? new Date(query.startTime) : undefined,
        endTime: query.endTime ? new Date(query.endTime) : undefined,
        limit: query.limit,
        offset: query.offset
      };

      const result = await queryLogs(options);
      reply.send(result);
    }
  });

  // Query metrics (raw data points)
  app.get('/query/metrics', {
    preHandler: validateQuery(queryMetricsSchema),
    handler: async (request, reply) => {
      const query = request.query as any;

      const options = {
        projectId: query.projectId,
        name: query.name,
        type: query.type,
        startTime: query.startTime ? new Date(query.startTime) : undefined,
        endTime: query.endTime ? new Date(query.endTime) : undefined
      };

      const metrics = await queryMetrics(options);
      reply.send({ metrics });
    }
  });

  // Aggregate metrics
  app.get('/query/metrics/aggregate', {
    preHandler: validateQuery(queryMetricsSchema),
    handler: async (request, reply) => {
      const query = request.query as any;

      const options = {
        projectId: query.projectId,
        name: query.name,
        type: query.type,
        startTime: query.startTime ? new Date(query.startTime) : undefined,
        endTime: query.endTime ? new Date(query.endTime) : undefined,
        bucketMinutes: query.bucketMinutes
      };

      const aggregations = await aggregateMetrics(options);
      reply.send({ aggregations });
    }
  });

  // Query custom events
  app.get('/query/events', {
    preHandler: validateQuery(queryEventsSchema),
    handler: async (request, reply) => {
      const query = request.query as any;

      const options = {
        projectId: query.projectId,
        name: query.name,
        startTime: query.startTime ? new Date(query.startTime) : undefined,
        endTime: query.endTime ? new Date(query.endTime) : undefined,
        limit: query.limit,
        offset: query.offset
      };

      const result = await queryEvents(options);
      reply.send(result);
    }
  });
}
