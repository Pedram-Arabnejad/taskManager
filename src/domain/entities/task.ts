import { randomUUID } from 'node:crypto';

import { TaskInvalidTransitionError, ValidationError } from '../errors/domain-errors';

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

/** Spec 1.1, business rule 4. Anything else is a 422 TASK_INVALID_TRANSITION. */
const ALLOWED_TRANSITIONS: Record<TaskStatus, readonly TaskStatus[]> = {
  [TaskStatus.TODO]: [TaskStatus.IN_PROGRESS],
  [TaskStatus.IN_PROGRESS]: [TaskStatus.TODO, TaskStatus.DONE],
  [TaskStatus.DONE]: [TaskStatus.IN_PROGRESS],
};

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 2000;

export interface TaskProps {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

export interface UpdateTaskDetailsInput {
  title?: string;
  description?: string | null;
  priority?: TaskPriority;
  dueDate?: Date | null;
}

function normalizeTitle(raw: string): string {
  const title = raw.trim();

  if (title.length === 0 || title.length > TASK_TITLE_MAX_LENGTH) {
    throw new ValidationError('Task title is invalid', [
      { field: 'title', message: `Title must be between 1 and ${TASK_TITLE_MAX_LENGTH} characters` },
    ]);
  }

  return title;
}

function normalizeDescription(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  const description = raw.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > TASK_DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError('Task description is invalid', [
      {
        field: 'description',
        message: `Description must be at most ${TASK_DESCRIPTION_MAX_LENGTH} characters`,
      },
    ]);
  }

  return description;
}

function normalizeDueDate(raw: Date | null | undefined): Date | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  if (Number.isNaN(raw.getTime())) {
    throw new ValidationError('Due date is invalid', [
      { field: 'dueDate', message: 'Provide a valid ISO-8601 date' },
    ]);
  }

  return raw;
}

function assertKnownStatus(status: TaskStatus): void {
  if (!Object.values(TaskStatus).includes(status)) {
    throw new ValidationError('Task status is invalid', [
      { field: 'status', message: `Allowed values: ${Object.values(TaskStatus).join(', ')}` },
    ]);
  }
}

function assertKnownPriority(priority: TaskPriority): void {
  if (!Object.values(TaskPriority).includes(priority)) {
    throw new ValidationError('Task priority is invalid', [
      { field: 'priority', message: `Allowed values: ${Object.values(TaskPriority).join(', ')}` },
    ]);
  }
}

export class Task {
  private readonly props: TaskProps;

  private constructor(props: TaskProps) {
    this.props = props;
  }

  static create(input: CreateTaskInput): Task {
    const now = new Date();
    const priority = input.priority ?? TaskPriority.MEDIUM;
    assertKnownPriority(priority);

    return new Task({
      id: randomUUID(),
      projectId: input.projectId,
      title: normalizeTitle(input.title),
      description: normalizeDescription(input.description),
      status: TaskStatus.TODO,
      priority,
      dueDate: normalizeDueDate(input.dueDate),
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: TaskProps): Task {
    return new Task({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get projectId(): string {
    return this.props.projectId;
  }

  get title(): string {
    return this.props.title;
  }

  get description(): string | null {
    return this.props.description;
  }

  get status(): TaskStatus {
    return this.props.status;
  }

  get priority(): TaskPriority {
    return this.props.priority;
  }

  get dueDate(): Date | null {
    return this.props.dueDate;
  }

  get completedAt(): Date | null {
    return this.props.completedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  canTransitionTo(next: TaskStatus): boolean {
    return (ALLOWED_TRANSITIONS[this.props.status] ?? []).includes(next);
  }

  /**
   * Applies the status workflow. Becoming DONE stamps `completedAt`,
   * leaving DONE clears it (spec 1.1, business rules 4 and 5).
   */
  changeStatus(next: TaskStatus, now: Date = new Date()): void {
    assertKnownStatus(next);

    if (!this.canTransitionTo(next)) {
      throw new TaskInvalidTransitionError(
        `Cannot change status from ${this.props.status} to ${next}`,
      );
    }

    this.props.status = next;
    this.props.completedAt = next === TaskStatus.DONE ? now : null;
    this.props.updatedAt = now;
  }

  updateDetails(input: UpdateTaskDetailsInput, now: Date = new Date()): void {
    if (
      input.title === undefined &&
      input.description === undefined &&
      input.priority === undefined &&
      input.dueDate === undefined
    ) {
      throw new ValidationError('Nothing to update', [
        { field: 'body', message: 'Provide at least one of title, description, priority or dueDate' },
      ]);
    }

    if (input.title !== undefined) {
      this.props.title = normalizeTitle(input.title);
    }

    if (input.description !== undefined) {
      this.props.description = normalizeDescription(input.description);
    }

    if (input.priority !== undefined) {
      assertKnownPriority(input.priority);
      this.props.priority = input.priority;
    }

    if (input.dueDate !== undefined) {
      this.props.dueDate = normalizeDueDate(input.dueDate);
    }

    this.props.updatedAt = now;
  }
}
