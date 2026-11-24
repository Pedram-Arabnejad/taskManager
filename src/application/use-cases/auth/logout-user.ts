import type { RefreshTokenRepository } from '../../../domain/repositories/refresh-token.repository';
import type { TokenService } from '../../../domain/services/token-service';

export interface LogoutUserInput {
  refreshToken: string;
}

/** Logout is idempotent: an unknown or already revoked token is not an error (spec 1.7). */
export class LogoutUser {
  constructor(
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  async execute(input: LogoutUserInput): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(input.refreshToken);
    const stored = await this.refreshTokens.findByTokenHash(tokenHash);

    if (stored === null || stored.isRevoked()) {
      return;
    }

    stored.revoke();
    await this.refreshTokens.revoke(stored);
  }
}
