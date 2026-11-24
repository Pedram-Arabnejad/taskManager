import { randomUUID } from 'node:crypto';

import { NotFoundError, ValidationError } from '../../../src/domain/errors/domain-errors';
import { createProjectsTasksFixture, DEFAULT_PAGE } from '../../helpers/projects-tasks-fixture';

const OWNER = randomUUID();
const STRANGER = randomUUID();

describe('project use cases', () => {
  it('should create a project owned by the caller when the input is valid', async () => {
    const fixture = createProjectsTasksFixture();

    const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Portfolio' });

    expect(project.ownerId).toBe(OWNER);
    expect(fixture.projects.items.size).toBe(1);
  });

  it('should list only the projects of the caller when both owners have projects', async () => {
    const fixture = createProjectsTasksFixture();
    await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });
    await fixture.createProject.execute({ ownerId: STRANGER, name: 'Not mine' });

    const page = await fixture.listProjects.execute({ ownerId: OWNER, page: DEFAULT_PAGE });

    expect(page.total).toBe(1);
    expect(page.items[0]?.name).toBe('Mine');
  });

  it('should filter by name when a search term is given', async () => {
    const fixture = createProjectsTasksFixture();
    await fixture.createProject.execute({ ownerId: OWNER, name: 'Portfolio' });
    await fixture.createProject.execute({ ownerId: OWNER, name: 'Errands' });

    const page = await fixture.listProjects.execute({
      ownerId: OWNER,
      search: 'port',
      page: DEFAULT_PAGE,
    });

    expect(page.total).toBe(1);
  });

  it('should return 404 semantics when the project belongs to someone else', async () => {
    const fixture = createProjectsTasksFixture();
    const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });

    await expect(
      fixture.getProject.execute({ projectId: project.id, ownerId: STRANGER }),
    ).rejects.toThrow(NotFoundError);
  });

  it('should update only the provided fields when patching', async () => {
    const fixture = createProjectsTasksFixture();
    const project = await fixture.createProject.execute({
      ownerId: OWNER,
      name: 'Mine',
      description: 'old',
    });

    const updated = await fixture.updateProject.execute({
      projectId: project.id,
      ownerId: OWNER,
      name: 'Renamed',
    });

    expect(updated.name).toBe('Renamed');
    expect(updated.description).toBe('old');
  });

  it('should reject an update that provides no field at all', async () => {
    const fixture = createProjectsTasksFixture();
    const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });

    await expect(
      fixture.updateProject.execute({ projectId: project.id, ownerId: OWNER }),
    ).rejects.toThrow(ValidationError);
  });

  it('should delete the project when the caller owns it', async () => {
    const fixture = createProjectsTasksFixture();
    const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });

    await fixture.deleteProject.execute({ projectId: project.id, ownerId: OWNER });

    expect(await fixture.projects.findById(project.id)).toBeNull();
  });

  it('should refuse to delete a project that belongs to someone else', async () => {
    const fixture = createProjectsTasksFixture();
    const project = await fixture.createProject.execute({ ownerId: OWNER, name: 'Mine' });

    await expect(
      fixture.deleteProject.execute({ projectId: project.id, ownerId: STRANGER }),
    ).rejects.toThrow(NotFoundError);
    expect(await fixture.projects.findById(project.id)).not.toBeNull();
  });
});
