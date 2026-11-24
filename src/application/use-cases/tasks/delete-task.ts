import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';
import { requireOwnedTask } from './task-access';

export interface DeleteTaskInput {
  taskId: string;
  ownerId: string;
}

export class DeleteTask {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
  ) {}

  async execute(input: DeleteTaskInput): Promise<void> {
    const { task } = await requireOwnedTask(this.tasks, this.projects, input.taskId, input.ownerId);

    await this.tasks.delete(task.id);
  }
}
