import { randomUUID } from 'node:crypto';

import { TaskPriority, TaskStatus } from '../../../src/domain/entities/task';
import {
  NotFoundError,
  TaskInvalidTransitionError,
} from '../../../src/domain/errors/domain-errors';
import { createProjectsTasksFixture, DEFAULT_PAGE } from '../../helpers/projects-tasks-fixture';

const OWNER = randomUUID();
const STRANGER = randomUUID();

async function ownedProject(fixture: ReturnType<typeof createProjectsTasksFixture>): Promise<string> {
  const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });

  return project.id;
}

describe('task use cases', () => {
  it('should create a TODO task inside the project when the caller owns it', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);

    const task = await fixture.createTask.execute({
      projectId,
      ownerId: OWNER,
      title: 'Write tests',
      priority: TaskPriority.HIGH,
    });

    expect(task.projectId).toBe(projectId);
    expect(task.status).toBe(TaskStatus.TODO);
    expect(task.priority).toBe(TaskPriority.HIGH);
  });

  it('should refuse to create a task inside somebody else s project', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);

    await expect(
      fixture.createTask.execute({ projectId, ownerId: STRANGER, title: 'Sneaky' }),
    ).rejects.toThrow(NotFoundError);
    expect(fixture.tasks.items.size).toBe(0);
  });

  it('should filter tasks by status and sort them by priority when asked', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'low', priority: TaskPriority.LOW });
    await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'high', priority: TaskPriority.HIGH });

    const page = await fixture.listTasks.execute({
      projectId,
      ownerId: OWNER,
      sort: { field: 'priority', order: 'asc' },
      page: DEFAULT_PAGE,
    });

    expect(page.total).toBe(2);
    expect(page.items.map((task) => task.priority)).toEqual([TaskPriority.LOW, TaskPriority.HIGH]);

    const todoPage = await fixture.listTasks.execute({
      projectId,
      ownerId: OWNER,
      status: TaskStatus.DONE,
      page: DEFAULT_PAGE,
    });

    expect(todoPage.total).toBe(0);
  });

  it('should hide tasks of another owner behind a 404 when read by id', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    const task = await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'Mine' });

    await expect(fixture.getTask.execute({ taskId: task.id, ownerId: STRANGER })).rejects.toThrow(
      NotFoundError,
    );
  });

  it('should reject an invalid status transition when changing status', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    const task = await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'Mine' });

    await expect(
      fixture.changeTaskStatus.execute({
        taskId: task.id,
        ownerId: OWNER,
        status: TaskStatus.DONE,
      }),
    ).rejects.toThrow(TaskInvalidTransitionError);
  });

  it('should stamp completedAt when a task reaches DONE', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    const task = await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'Mine' });
    await fixture.changeTaskStatus.execute({ taskId: task.id, ownerId: OWNER, status: TaskStatus.IN_PROGRESS });

    const done = await fixture.changeTaskStatus.execute({
      taskId: task.id,
      ownerId: OWNER,
      status: TaskStatus.DONE,
    });

    expect(done.status).toBe(TaskStatus.DONE);
    expect(done.completedAt).not.toBeNull();
  });

  it('should keep the status untouched when details are updated', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    const task = await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'Mine' });

    const updated = await fixture.updateTask.execute({
      taskId: task.id,
      ownerId: OWNER,
      title: 'Renamed',
      priority: TaskPriority.LOW,
    });

    expect(updated.title).toBe('Renamed');
    expect(updated.status).toBe(TaskStatus.TODO);
  });

  it('should delete the task when the owner asks for it', async () => {
    const fixture = createProjectsTasksFixture();
    const projectId = await ownedProject(fixture);
    const task = await fixture.createTask.execute({ projectId, ownerId: OWNER, title: 'Mine' });

    await fixture.deleteTask.execute({ taskId: task.id, ownerId: OWNER });

    expect(await fixture.tasks.findById(task.id)).toBeNull();
  });
});
