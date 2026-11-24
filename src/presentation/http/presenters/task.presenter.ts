import type { Task, TaskPriority, TaskStatus } from '../../../domain/entities/task';

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function toTaskResponse(task: Task): TaskResponse {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate === null ? null : task.dueDate.toISOString(),
    completedAt: task.completedAt === null ? null : task.completedAt.toISOString(),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
