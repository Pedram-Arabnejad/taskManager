import { z } from 'zod';

const AT_LEAST_ONE_FIELD = 'Provide at least one of name or description';

export const createProjectBodySchema = z.strictObject({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must be at most 1000 characters')
    .nullish(),
});

export const updateProjectBodySchema = z
  .strictObject({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .max(1000, 'Description must be at most 1000 characters')
      .nullish(),
  })
  .refine((value) => value.name !== undefined || value.description !== undefined, {
    message: AT_LEAST_ONE_FIELD,
    path: ['body'],
  });

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
