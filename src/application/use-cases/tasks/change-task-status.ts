import type { Task, TaskStatus } from '../../../domain/entities/task';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { requireOwnedTask } from './task-access';

export interface ChangeTaskStatusInput {
  taskId: string;
  ownerId: string;
  status: TaskStatus;
}

export class ChangeTaskStatus {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: ChangeTaskStatusInput): Promise<Task> {
    const { task } = await requireOwnedTask(this.tasks, this.projects, input.taskId, input.ownerId);

    task.changeStatus(input.status);

    return this.tasks.update(task);
  }
}
