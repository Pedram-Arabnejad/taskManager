import type { Task, TaskPriority, TaskStatus } from '../../../domain/entities/task';
import type { Page, PageRequest } from '../../../domain/repositories/pagination';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository, TaskSort } from '../../../domain/repositories/task.repository';
import { requireOwnedProject } from '../projects/project-access';

export interface ListTasksInput {
  projectId: string;
  ownerId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueBefore?: Date;
  search?: string;
  sort?: TaskSort;
  page: PageRequest;
}

export class ListTasks {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: ListTasksInput): Promise<Page<Task>> {
    await requireOwnedProject(this.projects, input.projectId, input.ownerId);

    return this.tasks.findByProject({
      projectId: input.projectId,
      status: input.status,
      priority: input.priority,
      dueBefore: input.dueBefore,
      search: input.search,
      sort: input.sort,
      page: input.page,
    });
  }
}
