import { AuthTokens } from '../../../domain/interfaces/IAuthService';

export class AuthResponse {
  constructor(
    public readonly user: {
      id: string;
      email: string;
      name: string;
      role: string;
      createdAt: Date;
    },
    public readonly tokens: AuthTokens,
  ) {}

  static from(user: {
    id: string;
    email: string;
    name: string;
    role: string;
    createdAt: Date;
  }, tokens: AuthTokens): AuthResponse {
    return new AuthResponse(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
      },
      tokens,
    );
  }
}
