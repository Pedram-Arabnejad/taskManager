import type { Task } from '../../../domain/entities/task';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { requireOwnedTask } from './task-access';

export interface GetTaskInput {
  taskId: string;
  ownerId: string;
}

export class GetTask {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: GetTaskInput): Promise<Task> {
    const { task } = await requireOwnedTask(this.tasks, this.projects, input.taskId, input.ownerId);

    return task;
  }
}
