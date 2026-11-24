import type { Project } from '../../../domain/entities/project';
import type { Task } from '../../../domain/entities/task';
import { NotFoundError } from '../../../domain/errors/domain-errors';
import type { ProjectRepository } from '../../../domain/repositories/project.repository';
import type { TaskRepository } from '../../../domain/repositories/task.repository';

export interface OwnedTask {
  task: Task;
  project: Project;
}

/**
 * A task is reachable only through a project the caller owns. A task from
 * somebody else's project is indistinguishable from a missing one: 404.
 */
export async function requireOwnedTask(
  tasks: TaskRepository,
  projects: ProjectRepository,
  taskId: string,
  ownerId: string,
): Promise<OwnedTask> {
  const task = await tasks.findById(taskId);

  if (task === null) {
    throw new NotFoundError('Task not found');
  }

  const project = await projects.findById(task.projectId);

  if (project === null || !project.belongsTo(ownerId)) {
    throw new NotFoundError('Task not found');
  }

  return { task, project };
}
