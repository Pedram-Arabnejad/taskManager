import { TaskPriority, type Task, type TaskStatus } from '../../src/domain/entities/task';
import { toPage, type Page } from '../../src/domain/repositories/pagination';
import type { TaskListQuery, TaskRepository } from '../../src/domain/repositories/task.repository';

const PRIORITY_RANK: Record<TaskPriority, number> = {
  [TaskPriority.LOW]: 0,
  [TaskPriority.MEDIUM]: 1,
  [TaskPriority.HIGH]: 2,
};

function compare(left: Task, right: Task, query: TaskListQuery): number {
  const direction = query.sort?.order === 'asc' ? 1 : -1;

  if (query.sort?.field === 'priority') {
    return (PRIORITY_RANK[left.priority] - PRIORITY_RANK[right.priority]) * direction;
  }

  if (query.sort?.field === 'dueDate') {
    const leftDue = left.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueDate?.getTime() ?? Number.MAX_SAFE_INTEGER;

    return (leftDue - rightDue) * direction;
  }

  return (left.createdAt.getTime() - right.createdAt.getTime()) * direction;
}

export class InMemoryTaskRepository implements TaskRepository {
  readonly items = new Map<string, Task>();

  async findById(id: string): Promise<Task | null> {
    return this.items.get(id) ?? null;
  }

  async findByProject(query: TaskListQuery): Promise<Page<Task>> {
    const search = query.search?.trim().toLowerCase();

    const matching = [...this.items.values()]
      .filter((task) => task.projectId === query.projectId)
      .filter((task) => (query.status === undefined ? true : task.status === query.status))
      .filter((task) => (query.priority === undefined ? true : task.priority === query.priority))
      .filter((task) =>
        query.dueBefore === undefined
          ? true
          : task.dueDate !== null && task.dueDate.getTime() <= query.dueBefore.getTime(),
      )
      .filter((task) =>
        search === undefined || search.length === 0
          ? true
          : task.title.toLowerCase().includes(search),
      )
      .sort((left, right) => compare(left, right, query));

    const start = (query.page.page - 1) * query.page.limit;

    return toPage(matching.slice(start, start + query.page.limit), matching.length, query.page);
  }

  async create(task: Task): Promise<Task> {
    this.items.set(task.id, task);

    return task;
  }

  async update(task: Task): Promise<Task> {
    this.items.set(task.id, task);

    return task;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  statusesOf(projectId: string): TaskStatus[] {
    return [...this.items.values()]
      .filter((task) => task.projectId === projectId)
      .map((task) => task.status);
  }
}
