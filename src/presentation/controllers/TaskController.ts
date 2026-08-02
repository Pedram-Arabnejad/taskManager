import { Response } from 'express';
import { TaskService } from '../../application/services/TaskService';
import { CreateTaskDto } from '../../application/dtos/task/CreateTaskDto';
import { UpdateTaskDto } from '../../application/dtos/task/UpdateTaskDto';
import { TaskResponse } from '../../application/dtos/task/TaskResponse';
import { AuthRequest } from '../middlewares/AuthMiddleware';
import { TaskStatus } from '../../domain/enums/TaskStatus';
import { TaskPriority } from '../../domain/enums/TaskPriority';

export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  private static queryString(value: unknown): string | undefined {
    return typeof value === 'string' ? value : undefined;
  }

  async createTask(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const errors = CreateTaskDto.validate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ status: 'error', message: errors.join(', ') });
      return;
    }

    try {
      const task = await this.taskService.createTask(req.user.userId, {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
      });
      res.status(201).json(TaskResponse.from(task));
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async getTaskById(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    try {
      const task = await this.taskService.getTaskById(
        req.params.id as string,
        req.user.userId,
      );
      res.status(200).json(TaskResponse.from(task));
    } catch (error: any) {
      const statusCode = error.message === 'Task not found' ? 404 : 403;
      res.status(statusCode).json({ status: 'error', message: error.message });
    }
  }

  async getUserTasks(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const page = TaskController.queryString(req.query.page);
    const limit = TaskController.queryString(req.query.limit);

    const filters = {
      status: TaskController.queryString(req.query.status) as TaskStatus | undefined,
      priority: TaskController.queryString(req.query.priority) as TaskPriority | undefined,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      sortBy: TaskController.queryString(req.query.sortBy),
      sortOrder: TaskController.queryString(req.query.sortOrder) as 'asc' | 'desc' | undefined,
    };

    try {
      const tasks = await this.taskService.getUserTasks(req.user.userId, filters);
      res.status(200).json(tasks.map(TaskResponse.from));
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  async updateTask(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    const errors = UpdateTaskDto.validate(req.body);
    if (errors.length > 0) {
      res.status(400).json({ status: 'error', message: errors.join(', ') });
      return;
    }

    try {
      const task = await this.taskService.updateTask(
        req.params.id as string,
        req.user.userId,
        {
        title: req.body.title,
        description: req.body.description,
        status: req.body.status,
        priority: req.body.priority,
      });
      res.status(200).json(TaskResponse.from(task));
    } catch (error: any) {
      const statusCode = error.message === 'Task not found' ? 404 : 403;
      res.status(statusCode).json({ status: 'error', message: error.message });
    }
  }

  async deleteTask(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ status: 'error', message: 'Authentication required' });
      return;
    }

    try {
      await this.taskService.deleteTask(
        req.params.id as string,
        req.user.userId,
      );
      res.status(200).json({ status: 'success', message: 'Task deleted successfully' });
    } catch (error: any) {
      const statusCode = error.message === 'Task not found' ? 404 : 403;
      res.status(statusCode).json({ status: 'error', message: error.message });
    }
  }
}
