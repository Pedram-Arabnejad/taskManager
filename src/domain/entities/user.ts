import { randomUUID } from 'node:crypto';

import { ValidationError } from '../errors/domain-errors';
import type { Email } from '../value-objects/email';

export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

const MAX_NAME_LENGTH = 120;

export interface UserProps {
  id: string;
  email: Email;
  passwordHash: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: Email;
  passwordHash: string;
  name: string;
  role?: Role;
}

function normalizeName(raw: string): string {
  const name = raw.trim();

  if (name.length === 0 || name.length > MAX_NAME_LENGTH) {
    throw new ValidationError('Name is invalid', [
      { field: 'name', message: `Name must be between 1 and ${MAX_NAME_LENGTH} characters` },
    ]);
  }

  return name;
}

function assertPasswordHash(passwordHash: string): void {
  if (passwordHash.trim().length === 0) {
    throw new ValidationError('Password hash is invalid', [
      { field: 'password', message: 'Password hash must not be empty' },
    ]);
  }
}

export class User {
  private readonly props: UserProps;

  private constructor(props: UserProps) {
    this.props = props;
  }

  /**
   * Creates a brand new user: generates the id and timestamps and applies defaults.
   * Never use it to rebuild a row coming from the database - use `reconstitute`.
   */
  static create(input: CreateUserInput): User {
    const now = new Date();

    return new User({
      id: randomUUID(),
      email: input.email,
      passwordHash: assertAndReturnPasswordHash(input.passwordHash),
      name: normalizeName(input.name),
      role: input.role ?? Role.USER,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds a user from persisted state without re-running creation rules. */
  static reconstitute(props: UserProps): User {
    return new User({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get name(): string {
    return this.props.name;
  }

  get role(): Role {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === Role.ADMIN;
  }

  changeRole(role: Role, now: Date = new Date()): void {
    if (this.props.role === role) {
      return;
    }

    this.props.role = role;
    this.props.updatedAt = now;
  }
}

function assertAndReturnPasswordHash(passwordHash: string): string {
  assertPasswordHash(passwordHash);
  return passwordHash;
}
