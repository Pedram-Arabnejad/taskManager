import type { Prisma, Project as PrismaProject } from '@prisma/client';

import { Project } from '../../../domain/entities/project';

export function toDomainProject(row: PrismaProject): Project {
  return Project.reconstitute({
    id: row.id,
    ownerId: row.ownerId,
    name: row.name,
    description: row.description,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export function toProjectCreateInput(project: Project): Prisma.ProjectUncheckedCreateInput {
  return {
    id: project.id,
    ownerId: project.ownerId,
    name: project.name,
    description: project.description,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toProjectUpdateInput(project: Project): Prisma.ProjectUncheckedUpdateInput {
  return {
    name: project.name,
    description: project.description,
    updatedAt: project.updatedAt,
  };
}
