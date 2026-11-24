import { Task, type TaskPriority } from '../../../domain/entities/task';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { requireOwnedProject } from '../projects/project-access';

export interface CreateTaskInput {
  projectId: string;
  ownerId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export class CreateTask {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: CreateTaskInput): Promise<Task> {
    await requireOwnedProject(this.projects, input.projectId, input.ownerId);

    const task = Task.create({
      projectId: input.projectId,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
    });

    return this.tasks.create(task);
  }
}
