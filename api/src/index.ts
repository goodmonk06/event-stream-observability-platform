import Fastify from 'fastify';
import cors from '@fastify/cors';
import * as dotenv from 'dotenv';
import { ingestRoutes } from './routes/ingest';
import { queryRoutes } from './routes/query';
import { projectRoutes } from './routes/projects';
import { getPool } from './db/client';
import { AppError, formatErrorResponse } from './utils/errors';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3001', 10);

async function start() {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'development' ? 'info' : 'warn'
    }
  });

  // Register CORS
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  });

  // Global error handler
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof AppError) {
      const response = formatErrorResponse(error);
      return reply.code(error.statusCode).send(response);
    }

    // Log unexpected errors
    request.log.error(error);

    // Send generic error response
    const response = formatErrorResponse(error);
    return reply.code(500).send(response);
  });

  // Health check
  app.get('/health', async (request, reply) => {
    try {
      const pool = getPool();
      await pool.query('SELECT 1');
      reply.send({ status: 'ok', database: 'connected' });
    } catch (error) {
      reply.code(503).send({ status: 'error', database: 'disconnected' });
    }
  });

  // Register routes
  await app.register(ingestRoutes);
  await app.register(queryRoutes);
  await app.register(projectRoutes);

  // Start server
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`🚀 API server running on http://localhost:${PORT}`);
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

start();
