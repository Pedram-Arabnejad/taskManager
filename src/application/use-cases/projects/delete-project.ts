import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import { requireOwnedProject } from './project-access';

export interface DeleteProjectInput {
  projectId: string;
  ownerId: string;
}

export class DeleteProject {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: DeleteProjectInput): Promise<void> {
    await requireOwnedProject(this.projects, input.projectId, input.ownerId);

    await this.projects.delete(input.projectId);
  }
}
