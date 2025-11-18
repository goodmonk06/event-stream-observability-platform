import { FastifyInstance } from 'fastify';
import { createProject, getProjectById, listProjects, deleteProject } from '../models/project';

export async function projectRoutes(app: FastifyInstance) {
  // Create a new project
  app.post('/projects', async (request, reply) => {
    const body = request.body as { name: string };

    if (!body.name) {
      return reply.code(400).send({ error: 'Project name is required' });
    }

    try {
      const project = await createProject(body.name);
      reply.code(201).send(project);
    } catch (error) {
      console.error('Error creating project:', error);
      reply.code(500).send({ error: 'Failed to create project' });
    }
  });

  // List all projects
  app.get('/projects', async (request, reply) => {
    try {
      const projects = await listProjects();
      reply.send({ projects });
    } catch (error) {
      console.error('Error listing projects:', error);
      reply.code(500).send({ error: 'Failed to list projects' });
    }
  });

  // Get a single project
  app.get('/projects/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return reply.code(400).send({ error: 'Invalid project ID' });
    }

    try {
      const project = await getProjectById(id);
      if (!project) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      reply.send(project);
    } catch (error) {
      console.error('Error fetching project:', error);
      reply.code(500).send({ error: 'Failed to fetch project' });
    }
  });

  // Delete a project
  app.delete('/projects/:id', async (request, reply) => {
    const params = request.params as { id: string };
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return reply.code(400).send({ error: 'Invalid project ID' });
    }

    try {
      const deleted = await deleteProject(id);
      if (!deleted) {
        return reply.code(404).send({ error: 'Project not found' });
      }
      reply.send({ success: true });
    } catch (error) {
      console.error('Error deleting project:', error);
      reply.code(500).send({ error: 'Failed to delete project' });
    }
  });
}
