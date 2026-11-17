import type { Prisma, PrismaClient } from '@prisma/client';

import type { Project } from '../../domain/entities/project';
import { toPage, type Page } from '../../domain/repositories/pagination';
import type {
  ProjectListQuery,
  ProjectRepository,
} from '../../domain/repositories/project.repository';
import {
  toDomainProject,
  toProjectCreateInput,
  toProjectUpdateInput,
} from './mappers/project.mapper';

export class PrismaProjectRepository implements ProjectRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Project | null> {
    const row = await this.prisma.project.findUnique({ where: { id } });

    return row === null ? null : toDomainProject(row);
  }

  async findByOwner(query: ProjectListQuery): Promise<Page<Project>> {
    const where: Prisma.ProjectWhereInput = { ownerId: query.ownerId };

    if (query.search !== undefined && query.search.trim().length > 0) {
      where.name = { contains: query.search, mode: 'insensitive' };
    }

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page.page - 1) * query.page.limit,
        take: query.page.limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return toPage(rows.map(toDomainProject), total, query.page);
  }

  async create(project: Project): Promise<Project> {
    const row = await this.prisma.project.create({ data: toProjectCreateInput(project) });

    return toDomainProject(row);
  }

  async update(project: Project): Promise<Project> {
    const row = await this.prisma.project.update({
      where: { id: project.id },
      data: toProjectUpdateInput(project),
    });

    return toDomainProject(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.project.delete({ where: { id } });
  }
}
