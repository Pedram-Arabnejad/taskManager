import type { Project } from '../../../domain/entities/project';
import { NotFoundError } from '../../../domain/errors/domain-errors';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';

/**
 * Ownership rule (spec 1.1, rule 3): a resource that belongs to someone else
 * answers 404, not 403, so the API never leaks that the id exists.
 */
export async function requireOwnedProject(
  projects: ProjectRepository,
  projectId: string,
  ownerId: string,
): Promise<Project> {
  const project = await projects.findById(projectId);

  if (project === null || !project.belongsTo(ownerId)) {
    throw new NotFoundError('Project not found');
  }

  return project;
}
