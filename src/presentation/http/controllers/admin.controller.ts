import type { Request, Response } from 'express';

import type { ChangeUserRole } from '../../../application/use-cases/admin/change-user-role';
import type { ListUsers } from '../../../application/use-cases/admin/list-users';
import { normalizePageRequest } from '../../../domain/repositories/pagination';
import { toPaginatedResponse } from '../presenters/page.presenter';
import { toUserResponse } from '../presenters/user.presenter';
import { requireAuth } from '../require-auth';
import type { ChangeUserRoleBody, ListUsersQuery } from '../schemas/admin.schemas';

export interface AdminControllerDependencies {
  listUsers: ListUsers;
  changeUserRole: ChangeUserRole;
}

export class AdminController {
  constructor(private readonly dependencies: AdminControllerDependencies) {}

  async listUsers(req: Request, res: Response): Promise<void> {
    const query = req.validatedQuery as ListUsersQuery;

    const page = await this.dependencies.listUsers.execute({
      search: query.q,
      page: normalizePageRequest({ page: query.page, limit: query.limit }),
    });

    res.status(200).json(toPaginatedResponse(page, toUserResponse));
  }

  async changeRole(req: Request, res: Response): Promise<void> {
    const actor = requireAuth(req);
    const body = req.body as ChangeUserRoleBody;

    const user = await this.dependencies.changeUserRole.execute({
      actorId: actor.userId,
      targetUserId: String(req.params.userId),
      role: body.role,
    });

    res.status(200).json({ user: toUserResponse(user) });
  }
}
