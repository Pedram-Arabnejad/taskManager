import { TaskPriority } from '../../../domain/enums/TaskPriority';

export class CreateTaskDto {
  constructor(
    public readonly title: string,
    public readonly description?: string,
    public readonly priority?: TaskPriority,
  ) {}

  static validate(data: any): string[] {
    const errors: string[] = [];
    if (!data.title || data.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (data.priority && !Object.values(TaskPriority).includes(data.priority)) {
      errors.push('Priority must be LOW, MEDIUM, or HIGH');
    }
    return errors;
  }
}
