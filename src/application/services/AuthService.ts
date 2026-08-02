import { User } from '../../domain/entities/User';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { Role } from '../../domain/enums/Role';
import { IUserRepository } from '../../domain/interfaces/IUserRepository';
import { IRefreshTokenRepository } from '../../domain/interfaces/IRefreshTokenRepository';
import {
  IAuthService,
  TokenPayload,
  AuthTokens,
  AuthResult,
} from '../../domain/interfaces/IAuthService';
import { JwtProvider } from '../../infrastructure/auth/JwtProvider';
import { PasswordHasher } from '../../infrastructure/auth/PasswordHasher';

export class AuthService implements IAuthService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    private readonly jwtProvider: JwtProvider,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async register(
    email: string,
    password: string,
    name: string,
  ): Promise<AuthResult> {
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('User with this email already exists');
    }

    const hashedPassword = await this.passwordHasher.hash(password);
    const user = User.create({
      email,
      password: hashedPassword,
      name,
      role: Role.USER,
    });

    const savedUser = await this.userRepo.create(user);
    const tokens = await this.generateTokens(savedUser);

    return { user: this.toPublicUser(savedUser), tokens };
  }

  async login(
    email: string,
    password: string,
  ): Promise<AuthResult> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isValid = await this.passwordHasher.compare(password, user.password);
    if (!isValid) {
      throw new Error('Invalid email or password');
    }

    const tokens = await this.generateTokens(user);
    return { user: this.toPublicUser(user), tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: TokenPayload;
    try {
      payload = this.jwtProvider.verifyRefreshToken(refreshToken);
    } catch {
      throw new Error('Invalid or expired refresh token');
    }

    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);
    if (!storedToken || storedToken.isExpired()) {
      throw new Error('Refresh token has been revoked or expired');
    }

    // Refresh token rotation: delete old, create new
    await this.refreshTokenRepo.delete(storedToken.id);

    const user = await this.userRepo.findById(payload.userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.generateTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    const storedToken = await this.refreshTokenRepo.findByToken(refreshToken);
    if (storedToken) {
      await this.refreshTokenRepo.delete(storedToken.id);
    }
  }

  async logoutAll(userId: string): Promise<void> {
    await this.refreshTokenRepo.deleteByUserId(userId);
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      return this.jwtProvider.verifyAccessToken(token);
    } catch {
      throw new Error('Invalid or expired access token');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtProvider.signAccessToken(payload);
    const refreshToken = this.jwtProvider.signRefreshToken({
      userId: user.id,
    });

    // Store refresh token in database
    const expiresAt = this.jwtProvider.getRefreshExpiryDate();
    const tokenEntity = RefreshToken.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
    });
    await this.refreshTokenRepo.create(tokenEntity);

    return { accessToken, refreshToken };
  }

  private toPublicUser(user: User): AuthResult['user'] {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
