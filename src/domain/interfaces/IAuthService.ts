import { User } from '../entities/User';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthService {
  register(email: string, password: string, name: string): Promise<AuthTokens & { user: Omit<User, 'password'> }>;
  login(email: string, password: string): Promise<AuthTokens & { user: Omit<User, 'password'> }>;
  refresh(refreshToken: string): Promise<AuthTokens>;
  logout(refreshToken: string): Promise<void>;
  logoutAll(userId: string): Promise<void>;
  validateAccessToken(token: string): Promise<TokenPayload>;
}
