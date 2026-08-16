import { TaskStatus } from '../../domain/enums/TaskStatus';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { ITaskRepository } from '../../domain/interfaces/ITaskRepository';
import { IAdminService, AdminStats } from '../../domain/interfaces/IAdminService';

export class AdminService implements IAdminService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly taskRepo: ITaskRepository,
  ) {}

  async getStats(): Promise<AdminStats> {
    const statuses = Object.values(TaskStatus);

    const [userPage, totalTasks, ...countsByStatus] = await Promise.all([
      this.userRepo.findAll(1, 1),
      this.taskRepo.countAll(),
      ...statuses.map((status) => this.taskRepo.countAll(status)),
    ]);

    const tasksByStatus = {} as Record<TaskStatus, number>;
    statuses.forEach((status, index) => {
      tasksByStatus[status] = countsByStatus[index];
    });

    return {
      totalUsers: userPage.total,
      totalTasks,
      tasksByStatus,
    };
  }
}
