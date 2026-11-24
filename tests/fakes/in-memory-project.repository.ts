import type { Project } from '../../src/domain/entities/project';
import { toPage, type Page } from '../../src/domain/repositories/pagination';
import type {
  ProjectListQuery,
  ProjectRepository,
} from '../../src/domain/repositories/project.repository';

export class InMemoryProjectRepository implements ProjectRepository {
  readonly items = new Map<string, Project>();

  async findById(id: string): Promise<Project | null> {
    return this.items.get(id) ?? null;
  }

  async findByOwner(query: ProjectListQuery): Promise<Page<Project>> {
    const search = query.search?.trim().toLowerCase();
    const owned = [...this.items.values()]
      .filter((project) => project.ownerId === query.ownerId)
      .filter((project) =>
        search === undefined || search.length === 0
          ? true
          : project.name.toLowerCase().includes(search),
      )
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());

    const start = (query.page.page - 1) * query.page.limit;

    return toPage(owned.slice(start, start + query.page.limit), owned.length, query.page);
  }

  async create(project: Project): Promise<Project> {
    this.items.set(project.id, project);

    return project;
  }

  async update(project: Project): Promise<Project> {
    this.items.set(project.id, project);

    return project;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }
}
