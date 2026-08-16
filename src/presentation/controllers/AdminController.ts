import { Response } from 'express';
import { AdminService } from '../../application/services/AdminService';
import { AuthRequest } from '../middlewares/AuthMiddleware';

export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  async getStats(_req: AuthRequest, res: Response): Promise<void> {
    const stats = await this.adminService.getStats();
    res.status(200).json(stats);
  }
}
