export class LoginDto {
  constructor(
    public readonly email: string,
    public readonly password: string,
  ) {}

  static validate(data: any): string[] {
    const errors: string[] = [];
    if (!data.email) errors.push('Email is required');
    if (!data.password) errors.push('Password is required');
    return errors;
  }
}
