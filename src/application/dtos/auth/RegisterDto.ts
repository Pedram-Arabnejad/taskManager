export class RegisterDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
    public readonly name: string,
  ) {}

  static validate(data: any): string[] {
    const errors: string[] = [];
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      errors.push('Valid email is required');
    }
    if (!data.password || data.password.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Name is required');
    }
    return errors;
  }
}
