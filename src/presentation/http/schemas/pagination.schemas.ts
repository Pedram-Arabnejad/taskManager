import { z } from 'zod';

import { TaskPriority, TaskStatus } from '../../../domain/entities/task';

const pageRequestFields = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const listProjectsQuerySchema = z
  .object({
    ...pageRequestFields,
    q: z.string().trim().max(100).optional(),
  })
  .strict();

export const listTasksQuerySchema = z
  .object({
    ...pageRequestFields,
    status: z.enum(TaskStatus).optional(),
    priority: z.enum(TaskPriority).optional(),
    dueBefore: z.coerce.date().optional(),
    q: z.string().trim().max(120).optional(),
    sort: z.enum(['createdAt', 'dueDate', 'priority']).optional(),
    order: z.enum(['asc', 'desc']).optional(),
  })
  .strict();

export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
