import { Task } from '../../domain/entities/Task';
import { TaskStatus } from '../../domain/enums/TaskStatus';
import { TaskPriority } from '../../domain/enums/TaskPriority';
import { ITaskRepository, TaskFilters } from '../../domain/interfaces/ITaskRepository';
import prisma from '../database/prisma/PrismaClient';
import { Prisma } from '@prisma/client';

export class PrismaTaskRepository implements ITaskRepository {
  async findById(id: string): Promise<Task | null> {
    const task = await prisma.task.findUnique({ where: { id } });
    return task ? this.toDomain(task) : null;
  }

  async findByUserId(userId: string, filters?: TaskFilters): Promise<Task[]> {
    const where: Prisma.TaskWhereInput = { userId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.priority) {
      where.priority = filters.priority as TaskPriority;
    }

    const orderBy: Prisma.TaskOrderByWithRelationInput = {};
    if (filters?.sortBy) {
      orderBy[filters.sortBy as keyof Prisma.TaskOrderByWithRelationInput] =
        filters.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy,
      skip: filters?.page ? (filters.page - 1) * (filters.limit || 10) : undefined,
      take: filters?.limit || 10,
    });

    return tasks.map((t) => this.toDomain(t));
  }

  async create(task: Task): Promise<Task> {
    const created = await prisma.task.create({
      data: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
        userId: task.userId,
      },
    });
    return this.toDomain(created);
  }

  async update(task: Task): Promise<Task> {
    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status as any,
        priority: task.priority as any,
      },
    });
    return this.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await prisma.task.delete({ where: { id } });
  }

  async countByUserId(userId: string, status?: TaskStatus): Promise<number> {
    return prisma.task.count({
      where: { userId, ...(status ? { status } : {}) },
    });
  }

  private toDomain(data: any): Task {
    return new Task(
      data.id,
      data.title,
      data.description,
      data.status as TaskStatus,
      data.priority as TaskPriority,
      data.userId,
      data.createdAt,
      data.updatedAt,
    );
  }
}
