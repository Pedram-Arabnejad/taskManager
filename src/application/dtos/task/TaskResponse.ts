import { Task } from '../../../domain/entities/Task';

export class TaskResponse {
  constructor(
    public readonly id: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly status: string,
    public readonly priority: string,
    public readonly userId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  static from(task: Task): TaskResponse {
    return new TaskResponse(
      task.id,
      task.title,
      task.description,
      task.status,
      task.priority,
      task.userId,
      task.createdAt,
      task.updatedAt,
    );
  }
}
