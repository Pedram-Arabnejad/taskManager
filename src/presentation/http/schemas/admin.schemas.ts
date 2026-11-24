import { z } from 'zod';

import { Role } from '../../../domain/entities/user';

export const listUsersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    q: z.string().trim().max(120).optional(),
  })
  .strict();

export const changeUserRoleBodySchema = z.strictObject({
  role: z.enum(Role),
});

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ChangeUserRoleBody = z.infer<typeof changeUserRoleBodySchema>;
