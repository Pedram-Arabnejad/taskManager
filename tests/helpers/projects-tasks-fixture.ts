import { CreateProject } from '../../src/application/use-cases/projects/create-project';
import { DeleteProject } from '../../src/application/use-cases/projects/delete-project';
import { GetProject } from '../../src/application/use-cases/projects/get-project';
import { ListProjects } from '../../src/application/use-cases/projects/list-projects';
import { UpdateProject } from '../../src/application/use-cases/projects/update-project';
import { ChangeTaskStatus } from '../../src/application/use-cases/tasks/change-task-status';
import { CreateTask } from '../../src/application/use-cases/tasks/create-task';
import { DeleteTask } from '../../src/application/use-cases/tasks/delete-task';
import { GetTask } from '../../src/application/use-cases/tasks/get-task';
import { ListTasks } from '../../src/application/use-cases/tasks/list-tasks';
import { UpdateTask } from '../../src/application/use-cases/tasks/update-task';
import { InMemoryProjectRepository } from '../fakes/in-memory-project.repository';
import { InMemoryTaskRepository } from '../fakes/in-memory-task.repository';

export interface ProjectsTasksFixture {
  projects: InMemoryProjectRepository;
  tasks: InMemoryTaskRepository;
  createProject: CreateProject;
  listProjects: ListProjects;
  getProject: GetProject;
  updateProject: UpdateProject;
  deleteProject: DeleteProject;
  createTask: CreateTask;
  listTasks: ListTasks;
  getTask: GetTask;
  updateTask: UpdateTask;
  changeTaskStatus: ChangeTaskStatus;
  deleteTask: DeleteTask;
}

export const DEFAULT_PAGE = { page: 1, limit: 20 } as const;

/** Wires the project/task use cases against in-memory adapters. */
export function createProjectsTasksFixture(): ProjectsTasksFixture {
  const projects = new InMemoryProjectRepository();
  const tasks = new InMemoryTaskRepository();

  return {
    projects,
    tasks,
    createProject: new CreateProject(projects),
    listProjects: new ListProjects(projects),
    getProject: new GetProject(projects),
    updateProject: new UpdateProject(projects),
    deleteProject: new DeleteProject(projects),
    createTask: new CreateTask(tasks, projects),
    listTasks: new ListTasks(tasks, projects),
    getTask: new GetTask(tasks, projects),
    updateTask: new UpdateTask(tasks, projects),
    changeTaskStatus: new ChangeTaskStatus(tasks, projects),
    deleteTask: new DeleteTask(tasks, projects),
  };
}
