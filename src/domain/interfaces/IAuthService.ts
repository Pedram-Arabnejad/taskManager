import { User } from '../entities/User';
import { Role } from '../enums/Role';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface PublicUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface IAuthService {
  register(email: string, password: string, name: string): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  validateAccessToken(token: string): Promise<TokenPayload>;
}
