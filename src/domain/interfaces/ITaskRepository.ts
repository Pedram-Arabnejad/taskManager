import { Task } from '../entities/Task';
import { TaskStatus } from '../enums/TaskStatus';

export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByUserId(userId: string, filters?: TaskFilters): Promise<Task[]>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
  countByUserId(userId: string, status?: TaskStatus): Promise<number>;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
