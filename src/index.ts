import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

dotenv.config();

import { container } from './container';
import { createAuthRoutes } from './presentation/routes/AuthRoutes';
import { createTaskRoutes } from './presentation/routes/TaskRoutes';
import { errorHandler } from './presentation/middlewares/ErrorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

// Global middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', createAuthRoutes(container.authController, container.jwtProvider));
app.use('/api/tasks', createTaskRoutes(container.taskController, container.jwtProvider));

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Task Manager API is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;
