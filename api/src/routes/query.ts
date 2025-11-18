import { FastifyInstance } from 'fastify';
import { queryLogs } from '../models/log';
import { queryMetrics, aggregateMetrics } from '../models/metric';
import { queryEvents } from '../models/event';

export async function queryRoutes(app: FastifyInstance) {
  // Query logs
  app.get('/query/logs', async (request, reply) => {
    const query = request.query as any;

    const projectId = parseInt(query.projectId);
    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' });
    }

    const options = {
      projectId,
      level: query.level,
      search: query.search,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      limit: query.limit ? parseInt(query.limit) : 100,
      offset: query.offset ? parseInt(query.offset) : 0
    };

    try {
      const result = await queryLogs(options);
      reply.send(result);
    } catch (error) {
      console.error('Error querying logs:', error);
      reply.code(500).send({ error: 'Failed to query logs' });
    }
  });

  // Query metrics (raw data points)
  app.get('/query/metrics', async (request, reply) => {
    const query = request.query as any;

    const projectId = parseInt(query.projectId);
    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' });
    }

    const options = {
      projectId,
      name: query.name,
      type: query.type,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined
    };

    try {
      const metrics = await queryMetrics(options);
      reply.send({ metrics });
    } catch (error) {
      console.error('Error querying metrics:', error);
      reply.code(500).send({ error: 'Failed to query metrics' });
    }
  });

  // Aggregate metrics
  app.get('/query/metrics/aggregate', async (request, reply) => {
    const query = request.query as any;

    const projectId = parseInt(query.projectId);
    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' });
    }

    const options = {
      projectId,
      name: query.name,
      type: query.type,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      bucketMinutes: query.bucketMinutes ? parseInt(query.bucketMinutes) : 5
    };

    try {
      const aggregations = await aggregateMetrics(options);
      reply.send({ aggregations });
    } catch (error) {
      console.error('Error aggregating metrics:', error);
      reply.code(500).send({ error: 'Failed to aggregate metrics' });
    }
  });

  // Query custom events
  app.get('/query/events', async (request, reply) => {
    const query = request.query as any;

    const projectId = parseInt(query.projectId);
    if (!projectId) {
      return reply.code(400).send({ error: 'projectId is required' });
    }

    const options = {
      projectId,
      name: query.name,
      startTime: query.startTime ? new Date(query.startTime) : undefined,
      endTime: query.endTime ? new Date(query.endTime) : undefined,
      limit: query.limit ? parseInt(query.limit) : 100,
      offset: query.offset ? parseInt(query.offset) : 0
    };

    try {
      const result = await queryEvents(options);
      reply.send(result);
    } catch (error) {
      console.error('Error querying events:', error);
      reply.code(500).send({ error: 'Failed to query events' });
    }
  });
}
