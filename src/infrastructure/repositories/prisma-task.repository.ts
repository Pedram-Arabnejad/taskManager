import type { Prisma, PrismaClient } from '@prisma/client';

import type { Task } from '../../domain/entities/task';
import { toPage, type Page } from '../../domain/repositories/pagination';
import type {
  TaskListQuery,
  TaskRepository,
  TaskSort,
} from '../../domain/repositories/task.repository';
import {
  taskPriorityToPrisma,
  taskStatusToPrisma,
  toDomainTask,
  toTaskCreateInput,
  toTaskUpdateInput,
} from './mappers/task.mapper';

function buildOrderBy(sort?: TaskSort): Prisma.TaskOrderByWithRelationInput {
  if (sort === undefined) {
    return { createdAt: 'desc' };
  }

  if (sort.field === 'dueDate') {
    return { dueDate: sort.order };
  }

  if (sort.field === 'priority') {
    return { priority: sort.order };
  }

  return { createdAt: sort.order };
}

export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Task | null> {
    const row = await this.prisma.task.findUnique({ where: { id } });

    return row === null ? null : toDomainTask(row);
  }

  async findByProject(query: TaskListQuery): Promise<Page<Task>> {
    const where: Prisma.TaskWhereInput = { projectId: query.projectId };

    if (query.status !== undefined) {
      where.status = taskStatusToPrisma(query.status);
    }

    if (query.priority !== undefined) {
      where.priority = taskPriorityToPrisma(query.priority);
    }

    if (query.dueBefore !== undefined) {
      where.dueDate = { lte: query.dueBefore };
    }

    if (query.search !== undefined && query.search.trim().length > 0) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: buildOrderBy(query.sort),
        skip: (query.page.page - 1) * query.page.limit,
        take: query.page.limit,
      }),
      this.prisma.task.count({ where }),
    ]);

    return toPage(rows.map(toDomainTask), total, query.page);
  }

  async create(task: Task): Promise<Task> {
    const row = await this.prisma.task.create({ data: toTaskCreateInput(task) });

    return toDomainTask(row);
  }

  async update(task: Task): Promise<Task> {
    const row = await this.prisma.task.update({
      where: { id: task.id },
      data: toTaskUpdateInput(task),
    });

    return toDomainTask(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.task.delete({ where: { id } });
  }
}
