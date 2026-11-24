import type { Project } from '../../../domain/entities/project';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import { requireOwnedProject } from './project-access';

export interface GetProjectInput {
  projectId: string;
  ownerId: string;
}

export class GetProject {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: GetProjectInput): Promise<Project> {
    return requireOwnedProject(this.projects, input.projectId, input.ownerId);
  }
}
