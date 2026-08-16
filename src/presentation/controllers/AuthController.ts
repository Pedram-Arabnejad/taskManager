import { Response } from 'express';
import { AuthService } from '../../application/services/AuthService';
import { RegisterDto } from '../../application/dtos/auth/RegisterDto';
import { LoginDto } from '../../application/dtos/auth/LoginDto';
import { AuthResponse } from '../../application/dtos/auth/AuthResponse';
import { AuthRequest } from '../middlewares/AuthMiddleware';

export class AuthController {
  constructor(private readonly authService: AuthService) {}

  async register(req: AuthRequest, res: Response): Promise<void> {
    const errors = RegisterDto.validate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ status: 'error', message: errors.join(', ') });
      return;
    }

    const result = await this.authService.register(
      req.body.email,
      req.body.password,
      req.body.name,
    );
    res.status(201).json(AuthResponse.from(result.user, result.tokens));
  }

  async login(req: AuthRequest, res: Response): Promise<void> {
    const errors = LoginDto.validate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ status: 'error', message: errors.join(', ') });
      return;
    }

    const result = await this.authService.login(
      req.body.email,
      req.body.password,
    );
    res.status(200).json(AuthResponse.from(result.user, result.tokens));
  }

  async refresh(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ status: 'error', message: 'Refresh token is required' });
      return;
    }

    const tokens = await this.authService.refresh(refreshToken);
    res.status(200).json(tokens);
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(400).json({ status: 'error', message: 'Refresh token is required' });
      return;
    }

    await this.authService.logout(refreshToken);
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
  }

  async logoutAll(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    await this.authService.logoutAll(req.user.userId);
    res.status(200).json({ status: 'success', message: 'Logged out from all devices' });
  }
}
