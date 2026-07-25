import { Task } from '../entities/Task';
import { TaskStatus } from '../enums/TaskStatus';
import { TaskPriority } from '../enums/TaskPriority';

export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ITaskService {
  createTask(userId: string, input: CreateTaskInput): Promise<Task>;
  getTaskById(taskId: string, userId: string): Promise<Task>;
  getUserTasks(userId: string, filters?: TaskFilters): Promise<Task[]>;
  updateTask(taskId: string, userId: string, input: UpdateTaskInput): Promise<Task>;
  deleteTask(taskId: string, userId: string): Promise<void>;
}
