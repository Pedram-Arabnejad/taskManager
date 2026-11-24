import { randomUUID } from 'node:crypto';

import {
  Project,
  PROJECT_DESCRIPTION_MAX_LENGTH,
  PROJECT_NAME_MAX_LENGTH,
} from '../../../src/domain/entities/project';
import { ValidationError } from '../../../src/domain/errors/domain-errors';

const OWNER_ID = randomUUID();

describe('Project', () => {
  it('should generate a uuid and keep the owner when created', () => {
    const project = Project.create({ ownerId: OWNER_ID, name: 'Portfolio' });

    expect(project.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    expect(project.ownerId).toBe(OWNER_ID);
    expect(project.description).toBeNull();
    expect(project.createdAt.getTime()).toBe(project.updatedAt.getTime());
  });

  it('should trim the name when it contains surrounding whitespace', () => {
    expect(Project.create({ ownerId: OWNER_ID, name: '  Portfolio  ' }).name).toBe('Portfolio');
  });

  it('should reject a blank name when created', () => {
    expect(() => Project.create({ ownerId: OWNER_ID, name: '   ' })).toThrow(ValidationError);
  });

  it('should reject a name longer than 100 characters when created', () => {
    expect(() =>
      Project.create({ ownerId: OWNER_ID, name: 'a'.repeat(PROJECT_NAME_MAX_LENGTH + 1) }),
    ).toThrow(ValidationError);
  });

  it('should reject a description longer than 1000 characters when created', () => {
    expect(() =>
      Project.create({
        ownerId: OWNER_ID,
        name: 'Portfolio',
        description: 'a'.repeat(PROJECT_DESCRIPTION_MAX_LENGTH + 1),
      }),
    ).toThrow(ValidationError);
  });

  it('should report ownership only for the owner id', () => {
    const project = Project.create({ ownerId: OWNER_ID, name: 'Portfolio' });

    expect(project.belongsTo(OWNER_ID)).toBe(true);
    expect(project.belongsTo(randomUUID())).toBe(false);
  });

  describe('update', () => {
    it('should rename the project when a new name is provided', () => {
      const project = Project.create({ ownerId: OWNER_ID, name: 'Portfolio' });
      const now = new Date('2026-05-05T00:00:00.000Z');

      project.update({ name: '  Backend portfolio  ' }, now);

      expect(project.name).toBe('Backend portfolio');
      expect(project.updatedAt).toEqual(now);
    });

    it('should clear the description when null is provided', () => {
      const project = Project.create({
        ownerId: OWNER_ID,
        name: 'Portfolio',
        description: 'old description',
      });

      project.update({ description: null });

      expect(project.description).toBeNull();
    });

    it('should reject an update that provides no field at all', () => {
      const project = Project.create({ ownerId: OWNER_ID, name: 'Portfolio' });

      expect(() => project.update({})).toThrow(ValidationError);
    });
  });

  describe('reconstitute', () => {
    it('should rebuild the aggregate without touching timestamps when called', () => {
      const createdAt = new Date('2026-01-01T00:00:00.000Z');
      const updatedAt = new Date('2026-01-02T00:00:00.000Z');

      const project = Project.reconstitute({
        id: randomUUID(),
        ownerId: OWNER_ID,
        name: 'From the database',
        description: null,
        createdAt,
        updatedAt,
      });

      expect(project.createdAt).toEqual(createdAt);
      expect(project.updatedAt).toEqual(updatedAt);
    });
  });
});
