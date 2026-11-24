import type { Project } from '../../../domain/entities/project';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import { requireOwnedProject } from './project-access';

export interface UpdateProjectInput {
  projectId: string;
  ownerId: string;
  name?: string;
  description?: string | null;
}

export class UpdateProject {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: UpdateProjectInput): Promise<Project> {
    const project = await requireOwnedProject(this.projects, input.projectId, input.ownerId);

    project.update({ name: input.name, description: input.description });

    return this.projects.update(project);
  }
}
