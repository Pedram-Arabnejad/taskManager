import { AuthTokens, PublicUser } from '../../../domain/interfaces/IAuthService';

export class AuthResponse {
  constructor(
    public readonly user: PublicUser,
    public readonly tokens: AuthTokens,
  ) {}

  static from(user: PublicUser, tokens: AuthTokens): AuthResponse {
    return new AuthResponse(user, tokens);
  }
}
