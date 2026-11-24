import type { $Enums, Prisma, Task as PrismaTask } from '@prisma/client';

import { Task, TaskPriority, TaskStatus } from '../../../domain/entities/task';

const STATUS_FROM_PRISMA: Record<$Enums.TaskStatus, TaskStatus> = {
  TODO: TaskStatus.TODO,
  IN_PROGRESS: TaskStatus.IN_PROGRESS,
  DONE: TaskStatus.DONE,
};

const STATUS_TO_PRISMA: Record<TaskStatus, $Enums.TaskStatus> = {
  [TaskStatus.TODO]: 'TODO',
  [TaskStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [TaskStatus.DONE]: 'DONE',
};

const PRIORITY_FROM_PRISMA: Record<$Enums.TaskPriority, TaskPriority> = {
  LOW: TaskPriority.LOW,
  MEDIUM: TaskPriority.MEDIUM,
  HIGH: TaskPriority.HIGH,
};

const PRIORITY_TO_PRISMA: Record<TaskPriority, $Enums.TaskPriority> = {
  [TaskPriority.LOW]: 'LOW',
  [TaskPriority.MEDIUM]: 'MEDIUM',
  [TaskPriority.HIGH]: 'HIGH',
};

export function toDomainTask(row: PrismaTask): Task {
  return Task.reconstitute({
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    description: row.description,
    status: STATUS_FROM_PRISMA[row.status],
    priority: PRIORITY_FROM_PRISMA[row.priority],
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toTaskCreateInput(task: Task): Prisma.TaskUncheckedCreateInput {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: STATUS_TO_PRISMA[task.status],
    priority: PRIORITY_TO_PRISMA[task.priority],
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export function toTaskUpdateInput(task: Task): Prisma.TaskUncheckedUpdateInput {
  return {
    title: task.title,
    description: task.description,
    status: STATUS_TO_PRISMA[task.status],
    priority: PRIORITY_TO_PRISMA[task.priority],
    dueDate: task.dueDate,
    completedAt: task.completedAt,
    updatedAt: task.updatedAt,
  };
}

export const taskStatusToPrisma = (status: TaskStatus): $Enums.TaskStatus =>
  STATUS_TO_PRISMA[status];

export const taskPriorityToPrisma = (priority: TaskPriority): $Enums.TaskPriority =>
  PRIORITY_TO_PRISMA[priority];
