import type { Task, TaskPriority } from '../../../domain/entities/task';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { requireOwnedTask } from './task-access';

export interface UpdateTaskInput {
  taskId: string;
  ownerId: string;
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

/** Status is intentionally absent: it changes only through change-status (spec 1.8). */
export class UpdateTask {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: UpdateTaskInput): Promise<Task> {
    const { task } = await requireOwnedTask(this.tasks, this.projects, input.taskId, input.ownerId);

    task.updateDetails({
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
    });

    return this.tasks.update(task);
  }
}
