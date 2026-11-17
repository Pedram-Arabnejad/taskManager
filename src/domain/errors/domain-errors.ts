/**
 * Domain errors carry two things the edge needs:
 *   - a stable UPPER_SNAKE_CASE `code` that clients can branch on
 *   - an `httpStatus` hint so the error handler does not have to guess
 *
 * The domain layer stays framework-free: nothing here imports Express or Prisma.
 */
export interface ErrorDetail {
  field: string;
  message: string;
}

export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;
  readonly details: ErrorDetail[] | undefined;

  protected constructor(message: string, details?: ErrorDetail[]) {
    super(message);
    this.name = new.target.name;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message = 'Request validation failed', details?: ErrorDetail[]) {
    super(message, details);
  }
}

export class InvalidEmailError extends DomainError {
  readonly code = 'VALIDATION_ERROR';
  readonly httpStatus = 400;

  constructor(message = 'Email address is invalid') {
    super(message, [{ field: 'email', message }]);
  }
}

export class UnauthenticatedError extends DomainError {
  readonly code = 'UNAUTHENTICATED';
  readonly httpStatus = 401;

  constructor(message = 'Authentication is required') {
    super(message);
  }
}

export class InvalidCredentialsError extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';
  readonly httpStatus = 401;

  constructor(message = 'Invalid email or password') {
    super(message);
  }
}

export class InvalidRefreshTokenError extends DomainError {
  readonly code = 'INVALID_REFRESH_TOKEN';
  readonly httpStatus = 401;

  constructor(message = 'Refresh token is invalid or expired') {
    super(message);
  }
}

export class RefreshTokenReusedError extends DomainError {
  readonly code = 'REFRESH_TOKEN_REUSED';
  readonly httpStatus = 401;

  constructor(message = 'Refresh token was already used; all sessions have been revoked') {
    super(message);
  }
}

export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';
  readonly httpStatus = 403;

  constructor(message = 'You are not allowed to perform this action') {
    super(message);
  }
}

export class NotFoundError extends DomainError {
  readonly code = 'NOT_FOUND';
  readonly httpStatus = 404;

  constructor(message = 'Resource not found') {
    super(message);
  }
}

export class ConflictError extends DomainError {
  readonly code = 'CONFLICT';
  readonly httpStatus = 409;

  constructor(message = 'Resource already exists') {
    super(message);
  }
}

export class EmailAlreadyExistsError extends DomainError {
  readonly code = 'EMAIL_ALREADY_EXISTS';
  readonly httpStatus = 409;

  constructor(message = 'An account with this email already exists') {
    super(message);
  }
}

export class DomainRuleViolationError extends DomainError {
  readonly code = 'DOMAIN_RULE_VIOLATION';
  readonly httpStatus = 422;

  constructor(message = 'The request violates a domain rule') {
    super(message);
  }
}

export class TaskInvalidTransitionError extends DomainError {
  readonly code = 'TASK_INVALID_TRANSITION';
  readonly httpStatus = 422;

  constructor(message = 'This task status transition is not allowed') {
    super(message);
  }
}

export class CannotChangeOwnRoleError extends DomainError {
  readonly code = 'CANNOT_CHANGE_OWN_ROLE';
  readonly httpStatus = 422;

  constructor(message = 'An admin cannot change their own role') {
    super(message);
  }
}
