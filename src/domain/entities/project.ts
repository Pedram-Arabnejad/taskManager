import { randomUUID } from 'node:crypto';

import { ValidationError } from '../errors/domain-errors';

export const PROJECT_NAME_MIN_LENGTH = 1;
export const PROJECT_NAME_MAX_LENGTH = 100;
export const PROJECT_DESCRIPTION_MAX_LENGTH = 1000;

export interface ProjectProps {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProjectInput {
  ownerId: string;
  name: string;
  description?: string | null;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
}

function normalizeName(raw: string): string {
  const name = raw.trim();

  if (name.length < PROJECT_NAME_MIN_LENGTH || name.length > PROJECT_NAME_MAX_LENGTH) {
    throw new ValidationError('Project name is invalid', [
      {
        field: 'name',
        message: `Name must be between ${PROJECT_NAME_MIN_LENGTH} and ${PROJECT_NAME_MAX_LENGTH} characters`,
      },
    ]);
  }

  return name;
}

function normalizeDescription(raw: string | null | undefined): string | null {
  if (raw === undefined || raw === null) {
    return null;
  }

  const description = raw.trim();

  if (description.length === 0) {
    return null;
  }

  if (description.length > PROJECT_DESCRIPTION_MAX_LENGTH) {
    throw new ValidationError('Project description is invalid', [
      {
        field: 'description',
        message: `Description must be at most ${PROJECT_DESCRIPTION_MAX_LENGTH} characters`,
      },
    ]);
  }

  return description;
}

export class Project {
  private readonly props: ProjectProps;

  private constructor(props: ProjectProps) {
    this.props = props;
  }

  static create(input: CreateProjectInput): Project {
    const now = new Date();

    return new Project({
      id: randomUUID(),
      ownerId: input.ownerId,
      name: normalizeName(input.name),
      description: normalizeDescription(input.description),
      createdAt: now,
      updatedAt: now,
    });
  }

  static reconstitute(props: ProjectProps): Project {
    return new Project({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null {
    return this.props.description;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  belongsTo(ownerId: string): boolean {
    return this.props.ownerId === ownerId;
  }

  update(input: UpdateProjectInput, now: Date = new Date()): void {
    if (input.name === undefined && input.description === undefined) {
      throw new ValidationError('Nothing to update', [
        { field: 'body', message: 'Provide at least one of name or description' },
      ]);
    }

    if (input.name !== undefined) {
      this.props.name = normalizeName(input.name);
    }

    if (input.description !== undefined) {
      this.props.description = normalizeDescription(input.description);
    }

    this.props.updatedAt = now;
  }
}
