import { randomUUID } from 'node:crypto';

export interface RefreshTokenProps {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedById: string | null;
  createdAt: Date;
}

export interface IssueRefreshTokenInput {
  userId: string;
  tokenHash: string;
  expiresAt: Date;
}

/**
 * Only the SHA-256 hash of the opaque token is ever persisted, so a leaked
 * database dump cannot be replayed as a session (spec 1.7).
 */
export class RefreshToken {
  private readonly props: RefreshTokenProps;

  private constructor(props: RefreshTokenProps) {
    this.props = props;
  }

  static issue(input: IssueRefreshTokenInput, now: Date = new Date()): RefreshToken {
    return new RefreshToken({
      id: randomUUID(),
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
      revokedAt: null,
      replacedById: null,
      createdAt: now,
    });
  }

  static reconstitute(props: RefreshTokenProps): RefreshToken {
    return new RefreshToken({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get userId(): string {
    return this.props.userId;
  }

  get tokenHash(): string {
    return this.props.tokenHash;
  }

  get expiresAt(): Date {
    return this.props.expiresAt;
  }

  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }

  get replacedById(): string | null {
    return this.props.replacedById;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  isRevoked(): boolean {
    return this.props.revokedAt !== null;
  }

  isExpired(now: Date = new Date()): boolean {
    return this.props.expiresAt.getTime() <= now.getTime();
  }

  isActive(now: Date = new Date()): boolean {
    return !this.isRevoked() && !this.isExpired(now);
  }

  revoke(replacedById: string | null = null, now: Date = new Date()): void {
    if (this.props.revokedAt !== null) {
      return;
    }

    this.props.revokedAt = now;
    this.props.replacedById = replacedById;
  }
}
