import { TaskStatus } from '../enums/TaskStatus';

export interface AdminStats {
  totalUsers: number;
  totalTasks: number;
  tasksByStatus: Record<TaskStatus, number>;
}

export interface IAdminService {
  getStats(): Promise<AdminStats>;
}
