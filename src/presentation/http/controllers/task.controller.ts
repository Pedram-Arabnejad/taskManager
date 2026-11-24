import type { Request, Response } from 'express';

import type { ChangeTaskStatus } from '../../../application/use-cases/tasks/change-task-status';
import type { CreateTask } from '../../../application/use-cases/tasks/create-task';
import type { DeleteTask } from '../../../application/use-cases/tasks/delete-task';
import type { GetTask } from '../../../application/use-cases/tasks/get-task';
import type { ListTasks } from '../../../application/use-cases/tasks/list-tasks';
import type { UpdateTask } from '../../../application/use-cases/tasks/update-task';
import { normalizePageRequest } from '../../../domain/repositories/pagination';
import type { TaskSort } from '../../../domain/repositories/task.repository';
import { toPaginatedResponse } from '../presenters/page.presenter';
import { toTaskResponse } from '../presenters/task.presenter';
import { requireAuth } from '../require-auth';
import type { ListTasksQuery } from '../schemas/pagination.schemas';
import type {
  ChangeTaskStatusBody,
  CreateTaskBody,
  UpdateTaskBody,
} from '../schemas/task.schemas';

export interface TaskControllerDependencies {
  createTask: CreateTask;
  listTasks: ListTasks;
  getTask: GetTask;
  updateTask: UpdateTask;
  changeTaskStatus: ChangeTaskStatus;
  deleteTask: DeleteTask;
}

function toSort(query: ListTasksQuery): TaskSort | undefined {
  if (query.sort === undefined) {
    return undefined;
  }

  return { field: query.sort, order: query.order ?? 'desc' };
}

export class TaskController {
  constructor(private readonly dependencies: TaskControllerDependencies) {}

  async create(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const body = req.body as CreateTaskBody;

    const task = await this.dependencies.createTask.execute({
      projectId: String(req.params.projectId),
      ownerId: userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
    });

    res.status(201).json(toTaskResponse(task));
  }

  async list(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const query = req.validatedQuery as ListTasksQuery;

    const page = await this.dependencies.listTasks.execute({
      projectId: String(req.params.projectId),
      ownerId: userId,
      status: query.status,
      priority: query.priority,
      dueBefore: query.dueBefore,
      search: query.q,
      sort: toSort(query),
      page: normalizePageRequest({ page: query.page, limit: query.limit }),
    });

    res.status(200).json(toPaginatedResponse(page, toTaskResponse));
  }

  async getById(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);

    const task = await this.dependencies.getTask.execute({
      taskId: String(req.params.taskId),
      ownerId: userId,
    });

    res.status(200).json(toTaskResponse(task));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const body = req.body as UpdateTaskBody;

    const task = await this.dependencies.updateTask.execute({
      taskId: String(req.params.taskId),
      ownerId: userId,
      title: body.title,
      description: body.description,
      priority: body.priority,
      dueDate: body.dueDate,
    });

    res.status(200).json(toTaskResponse(task));
  }

  async changeStatus(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);
    const body = req.body as ChangeTaskStatusBody;

    const task = await this.dependencies.changeTaskStatus.execute({
      taskId: String(req.params.taskId),
      ownerId: userId,
      status: body.status,
    });

    res.status(200).json(toTaskResponse(task));
  }

  async remove(req: Request, res: Response): Promise<void> {
    const { userId } = requireAuth(req);

    await this.dependencies.deleteTask.execute({
      taskId: String(req.params.taskId),
      ownerId: userId,
    });

    res.status(204).send();
  }
}
