import { Project } from '../../../domain/entities/project';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';

export interface CreateProjectInput {
  ownerId: string;
  name: string;
  description?: string | null;
}

export class CreateProject {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: CreateProjectInput): Promise<Project> {
    const project = Project.create({
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
    });

    return this.projects.create(project);
  }
}
