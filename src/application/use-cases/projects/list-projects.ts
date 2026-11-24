import type { Project } from '../../../domain/entities/project';
import type { Page, PageRequest } from '../../../domain/repositories/pagination';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';

export interface ListProjectsInput {
  ownerId: string;
  search?: string;
  page: PageRequest;
}

export class ListProjects {
  constructor(private readonly projects: ProjectRepository) {}

  async execute(input: ListProjectsInput): Promise<Page<Project>> {
    return this.projects.findByOwner({
      ownerId: input.ownerId,
      search: input.search,
      page: input.page,
    });
  }
}
