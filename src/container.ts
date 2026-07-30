import { PrismaUserRepository } from './infrastructure/repositories/PrismaUserRepository';
import { PrismaTaskRepository } from './infrastructure/repositories/PrismaTaskRepository';
import { PrismaRefreshTokenRepository } from './infrastructure/repositories/PrismaRefreshTokenRepository';
import { JwtProvider } from './infrastructure/auth/JwtProvider';
import { PasswordHasher } from './infrastructure/auth/PasswordHasher';
import { AuthService } from './application/services/AuthService';
import { TaskService } from './application/services/TaskService';
import { AuthController } from './presentation/controllers/AuthController';
import { TaskController } from './presentation/controllers/TaskController';

export class Container {
  // Infrastructure
  readonly userRepo = new PrismaUserRepository();
  readonly taskRepo = new PrismaTaskRepository();
  readonly refreshTokenRepo = new PrismaRefreshTokenRepository();
  readonly jwtProvider = new JwtProvider(
    process.env.JWT_ACCESS_SECRET || 'fallback-access-secret',
    process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  );
  readonly passwordHasher = new PasswordHasher();

  // Application Services
  readonly authService = new AuthService(
    this.userRepo,
    this.refreshTokenRepo,
    this.jwtProvider,
    this.passwordHasher,
  );
  readonly taskService = new TaskService(this.taskRepo);

  // Presentation Controllers
  readonly authController = new AuthController(this.authService);
  readonly taskController = new TaskController(this.taskService);
}

export const container = new Container();
