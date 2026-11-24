import { z } from 'zod';

import { TaskPriority, TaskStatus } from '../../../domain/entities/task';

const titleSchema = z
  .string()
  .trim()
  .min(1, 'Title is required')
  .max(120, 'Title must be at most 120 characters');

const descriptionSchema = z
  .string()
  .trim()
  .max(2000, 'Description must be at most 2000 characters')
  .nullish();

export const createTaskBodySchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema,
  priority: z.enum(TaskPriority).optional(),
  dueDate: z.coerce.date().nullish(),
});

/** Status is deliberately absent: it only changes through PATCH /tasks/:id/status. */
export const updateTaskBodySchema = z
  .strictObject({
    title: titleSchema.optional(),
    description: descriptionSchema,
    priority: z.enum(TaskPriority).optional(),
    dueDate: z.coerce.date().nullish(),
  })
  .refine(
    (value) =>
      value.title !== undefined ||
      value.description !== undefined ||
      value.priority !== undefined ||
      value.dueDate !== undefined,
    {
      message: 'Provide at least one of title, description, priority or dueDate',
      path: ['body'],
    },
  );

export const changeTaskStatusBodySchema = z.strictObject({
  status: z.enum(TaskStatus),
});

export type CreateTaskBody = z.infer<typeof createTaskBodySchema>;
export type UpdateTaskBody = z.infer<typeof updateTaskBodySchema>;
export type ChangeTaskStatusBody = z.infer<typeof changeTaskStatusBodySchema>;
