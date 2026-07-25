import { TaskStatus } from '../enums/TaskStatus';
import { TaskPriority } from '../enums/TaskPriority';

export class Task {
  constructor(
    public readonly id: string,
    public title: string,
    public description: string | null,
    public status: TaskStatus,
    public priority: TaskPriority,
    public readonly userId: string,
    public readonly createdAt: Date,
    public updatedAt: Date,
  ) {}

  static create(props: {
    id?: string;
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    userId: string;
  }): Task {
    return new Task(
      props.id || crypto.randomUUID(),
      props.title,
      props.description || null,
      props.status || TaskStatus.TODO,
      props.priority || TaskPriority.MEDIUM,
      props.userId,
      new Date(),
      new Date(),
    );
  }

  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }
}
