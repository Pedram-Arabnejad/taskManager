import type { Task, TaskPriority, TaskStatus } from '../entities/task';
import type { Page, PageRequest } from './pagination';

export type TaskSortField = 'createdAt' | 'dueDate' | 'priority';
export type SortOrder = 'asc' | 'desc';

export interface TaskSort {
  field: TaskSortField;
  order: SortOrder;
}

export interface TaskListQuery {
  projectId: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueBefore?: Date;
  search?: string;
  sort?: TaskSort;
  page: PageRequest;
}

export interface TaskRepository {
  findById(id: string): Promise<Task | null>;
  findByProject(query: TaskListQuery): Promise<Page<Task>>;
  create(task: Task): Promise<Task>;
  update(task: Task): Promise<Task>;
  delete(id: string): Promise<void>;
}
