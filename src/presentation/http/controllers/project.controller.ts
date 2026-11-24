import type { Request, Response } from 'express';

import type { CreateProject } from '../../../application/use-cases/projects/create-project';
import type { DeleteProject } from '../../../application/use-cases/projects/delete-project';
import type { GetProject } from '../../../application/use-cases/projects/get-project';
import type { ListProjects } from '../../../application/use-cases/projects/list-projects';
import type { UpdateProject } from '../../../application/use-cases/projects/update-project';
import { normalizePageRequest } from '../../../domain/repositories/pagination';
import { toPaginatedResponse } from '../presenters/page.presenter';
import { toProjectResponse } from '../presenters/project.presenter';
import { requireAuth } from '../require-auth';
import type { ListProjectsQuery } from '../schemas/pagination.schemas';
import type { CreateProjectBody, UpdateProjectBody } from '../schemas/project.schemas';

export interface ProjectControllerDependencies {
  createProject: CreateProject;
  listProjects: ListProjects;
  getProject: GetProject;
  updateProject: UpdateProject;
  deleteProject: DeleteProject;
}

export class ProjectController {
  constructor(private readonly dependencies: ProjectControllerDependencies) {}

  async create(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const body = req.body as CreateProjectBody;

    const project = await this.dependencies.createProject.execute({
      ownerId: userId,
      name: body.name,
      description: body.description,
    });

    res.status(201).json(toProjectResponse(project));
  }

  async list(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const query = req.validatedQuery as ListProjectsQuery;

    const page = await this.dependencies.listProjects.execute({
      ownerId: userId,
      search: query.q,
      page: normalizePageRequest({ page: query.page, limit: query.limit }),
    });

    res.status(200).json(toPaginatedResponse(page, toProjectResponse));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);

    const project = await this.dependencies.getProject.execute({
      projectId: String(req.params.projectId),
      ownerId: userId,
    });

    res.status(200).json(toProjectResponse(project));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const body = req.body as UpdateProjectBody;

    const project = await this.dependencies.updateProject.execute({
      projectId: String(req.params.projectId),
      ownerId: userId,
      name: body.name,
      description: body.description,
    });

    res.status(200).json(toProjectResponse(project));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);

    await this.dependencies.deleteProject.execute({
      projectId: String(req.params.projectId),
      ownerId: userId,
    });

    res.status(204).send();
  }
}
