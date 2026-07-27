import { TaskStatus } from '../../../domain/enums/TaskStatus';
import { TaskPriority } from '../../../domain/enums/TaskPriority';

export class UpdateTaskDto {
  constructor(
    public readonly title?: string,
    public readonly description?: string,
    public readonly status?: TaskStatus,
    public readonly priority?: TaskPriority,
  ) {}

  static validate(data: any): string[] {
    const errors: string[] = [];
    if (data.title !== undefined && data.title.trim().length === 0) {
      errors.push('Title cannot be empty');
    }
    if (data.status && !Object.values(TaskStatus).includes(data.status)) {
      errors.push('Status must be TODO, IN_PROGRESS, or DONE');
    }
    if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
      errors.push('Priority must be LOW, MEDIUM, or HIGH');
    }
    return errors;
  }
}
