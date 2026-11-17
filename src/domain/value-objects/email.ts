import { InvalidEmailError } from '../errors/domain-errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_EMAIL_LENGTH = 254;

/**
 * Email value object. Normalisation (trim + lowercase) happens exactly once,
 * here, so "Ali@Example.com " and "ali@example.com" are the same account
 * everywhere downstream (spec 1.1, business rule 1).
 */
export class Email {
  private constructor(private readonly address: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();

    if (normalized.length === 0 || normalized.length > MAX_EMAIL_LENGTH) {
      throw new InvalidEmailError();
    }

    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError();
    }

    return new Email(normalized);
  }

  get value(): string {
    return this.address;
  }

  equals(other: Email): boolean {
    return this.address === other.address;
  }

  toString(): string {
    return this.address;
  }
}
