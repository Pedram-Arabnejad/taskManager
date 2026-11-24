import type { Request, Response } from 'express';

import type { GetCurrentUser } from '../../../application/use-cases/auth/get-current-user';
import type { LoginUser } from '../../../application/use-cases/auth/login-user';
import type { LogoutUser } from '../../../application/use-cases/auth/logout-user';
import type { RefreshSession } from '../../../application/use-cases/auth/refresh-session';
import type { RegisterUser } from '../../../application/use-cases/auth/register-user';
import { UnauthenticatedError } from '../../../domain/errors/domain-errors';
import { toUserResponse } from '../presenters/user.presenter';
import type { LoginBody, LogoutBody, RefreshBody, RegisterBody } from '../schemas/auth.schemas';

export interface AuthControllerDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  refreshSession: RefreshSession;
  logoutUser: LogoutUser;
  getCurrentUser: GetCurrentUser;
}

/**
 * Controllers do three things only: read the validated body, call one use case,
 * and shape the response. No business rules, no repository access.
 */
export class AuthController {
  constructor(private readonly dependencies: AuthControllerDependencies) {}

  async register(req: Request, res: Response): Promise<void> {
    const body = req.body as RegisterBody;
    const user = await this.dependencies.registerUser.execute(body);

    res.status(201).json({ user: toUserResponse(user) });
  }

  async login(req: Request, res: Response): Promise<void> {
    const body = req.body as LoginBody;
    const result = await this.dependencies.loginUser.execute(body);

    res.status(200).json({
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      expiresIn: result.tokens.expiresIn,
      user: toUserResponse(result.user),
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const body = req.body as RefreshBody;
    const tokens = await this.dependencies.refreshSession.execute(body);

    res.status(200).json(tokens);
  }

  async logout(req: Request, res: Response): Promise<void> {
    const body = req.body as LogoutBody;
    await this.dependencies.logoutUser.execute(body);

    res.status(204).send();
  }

  async me(req: Request, res: Response): Promise<void> {
    if (req.auth === undefined) {
      throw new UnauthenticatedError();
    }

    const user = await this.dependencies.getCurrentUser.execute({ userId: req.auth.userId });

    res.status(200).json({ user: toUserResponse(user) });
  }
}
