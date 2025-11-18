import { FastifyInstance } from 'fastify';
import { createProject, getProjectById, listProjects, deleteProject } from '../models/project';
import { createProjectSchema } from '../validation/schemas';
import { validateBody } from '../utils/validation';
import { NotFoundError } from '../utils/errors';
import { z } from 'zod';

const projectIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export async function projectRoutes(app: FastifyInstance) {
  // Create a new project
  app.post('/projects', {
    preHandler: validateBody(createProjectSchema),
    handler: async (request, reply) => {
      const { name } = request.body as { name: string };
      const project = await createProject(name);
      reply.code(201).send(project);
    }
  });

  // List all projects
  app.get('/projects', async (request, reply) => {
    const projects = await listProjects();
    reply.send({ projects });
  });

  // Get a single project
  app.get('/projects/:id', async (request, reply) => {
    const params = projectIdSchema.parse(request.params);
    const project = await getProjectById(params.id);

    if (!project) {
      throw new NotFoundError('Project');
    }

    reply.send(project);
  });

  // Delete a project
  app.delete('/projects/:id', async (request, reply) => {
    const params = projectIdSchema.parse(request.params);
    const deleted = await deleteProject(params.id);

    if (!deleted) {
      throw new NotFoundError('Project');
    }

    reply.send({ success: true });
  });
}
