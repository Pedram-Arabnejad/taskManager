import type { Project } from '../entities/project';
import type { Page, PageRequest } from './pagination';

export interface ProjectListQuery {
  ownerId: string;
  search?: string;
  page: PageRequest;
}

export interface ProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByOwner(query: ProjectListQuery): Promise<Page<Project>>;
  create(project: Project): Promise<Project>;
  update(project: Project): Promise<Project>;
  delete(id: string): Promise<void>;
}
