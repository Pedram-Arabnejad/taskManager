import { Task } from '../../domain/entities/Task';
import { TaskStatus } from '../../domain/enums/TaskStatus';
import { ITaskRepository } from '../../domain/interfaces/ITaskRepository';
import {
  ITaskService,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilters,
} from '../../domain/interfaces/ITaskService';

export class TaskService implements ITaskService {
  constructor(
    private readonly taskRepo: ITaskRepository,
  ) {}

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    const task = Task.create({
      title: input.title,
      description: input.description,
      priority: input.priority,
      userId,
    });

    return this.taskRepo.create(task);
  }

  async getTaskById(taskId: string, userId: string): Promise<Task> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.belongsToUser(userId)) {
      throw new Error('You do not have access to this task');
    }

    return task;
  }

  async getUserTasks(userId: string, filters?: TaskFilters): Promise<Task[]> {
    return this.taskRepo.findByUserId(userId, filters);
  }

  async updateTask(
    taskId: string,
    userId: string,
    input: UpdateTaskInput,
  ): Promise<Task> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.belongsToUser(userId)) {
      throw new Error('You do not have access to this task');
    }

    const updatedTask = Task.create({
      id: task.id,
      title: input.title ?? task.title,
      description: input.description ?? task.description ?? undefined,
      status: input.status ?? task.status,
      priority: input.priority ?? task.priority,
      userId: task.userId,
    });

    // Preserve original timestamps
    const finalTask = new Task(
      updatedTask.id,
      updatedTask.title,
      updatedTask.description,
      updatedTask.status,
      updatedTask.priority,
      updatedTask.userId,
      task.createdAt,
      new Date(),
    );

    return this.taskRepo.update(finalTask);
  }

  async deleteTask(taskId: string, userId: string): Promise<void> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (!task.belongsToUser(userId)) {
      throw new Error('You do not have access to this task');
    }

    await this.taskRepo.delete(taskId);
  }
}
