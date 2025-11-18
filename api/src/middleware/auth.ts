import { FastifyRequest, FastifyReply } from 'fastify';
import { getProjectByApiKey } from '../models/project';

export async function authenticateApiKey(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const apiKey = request.headers['x-api-key'] as string;

  if (!apiKey) {
    reply.code(401).send({ error: 'Missing API key' });
    return;
  }

  const project = await getProjectByApiKey(apiKey);

  if (!project) {
    reply.code(401).send({ error: 'Invalid API key' });
    return;
  }

  // Attach project to request
  (request as any).project = project;
}
