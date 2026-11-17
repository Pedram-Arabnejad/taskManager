import { randomUUID } from 'node:crypto';

import {
  Task,
  TaskPriority,
  TaskStatus,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
} from '../../../src/domain/entities/task';
import {
  TaskInvalidTransitionError,
  ValidationError,
} from '../../../src/domain/errors/domain-errors';

const PROJECT_ID = randomUUID();

function taskInStatus(status: TaskStatus): Task {
  const now = new Date('2026-01-01T00:00:00.000Z');

  return Task.reconstitute({
    id: randomUUID(),
    projectId: PROJECT_ID,
    title: 'Write the spec',
    description: null,
    status,
    priority: TaskPriority.MEDIUM,
    dueDate: null,
    completedAt: status === TaskStatus.DONE ? now : null,
    createdAt: now,
    updatedAt: now,
  });
}

describe('Task', () => {
  describe('create', () => {
    it('should generate a uuid and default to TODO and MEDIUM when only a title is given', () => {
      const task = Task.create({ projectId: PROJECT_ID, title: 'Ship it' });

      expect(task.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.completedAt).toBeNull();
      expect(task.description).toBeNull();
      expect(task.dueDate).toBeNull();
    });

    it('should trim the title when it contains surrounding whitespace', () => {
      const task = Task.create({ projectId: PROJECT_ID, title: '   Ship it   ' });

      expect(task.title).toBe('Ship it');
    });

    it('should collapse an empty description to null when one is provided', () => {
      const task = Task.create({ projectId: PROJECT_ID, title: 'Ship it', description: '   ' });

      expect(task.description).toBeNull();
    });

    it('should keep a valid due date in the past when one is provided', () => {
      const dueDate = new Date('2020-05-01T10:00:00.000Z');
      const task = Task.create({ projectId: PROJECT_ID, title: 'Ship it', dueDate });

      expect(task.dueDate).toEqual(dueDate);
    });

    it('should reject a blank title when created', () => {
      expect(() => Task.create({ projectId: PROJECT_ID, title: '   ' })).toThrow(ValidationError);
    });

    it('should reject a title longer than 120 characters when created', () => {
      const title = 'a'.repeat(TASK_TITLE_MAX_LENGTH + 1);

      expect(() => Task.create({ projectId: PROJECT_ID, title })).toThrow(ValidationError);
    });

    it('should reject a description longer than 2000 characters when created', () => {
      const description = 'a'.repeat(TASK_DESCRIPTION_MAX_LENGTH + 1);

      expect(() => Task.create({ projectId: PROJECT_ID, title: 'Ship it', description })).toThrow(
        ValidationError,
      );
    });
  });

  describe('status workflow', () => {
    const cases: Array<{ from: TaskStatus; to: TaskStatus; allowed: boolean }> = [
      { from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS, allowed: true },
      { from: TaskStatus.TODO, to: TaskStatus.DONE, allowed: false },
      { from: TaskStatus.TODO, to: TaskStatus.TODO, allowed: false },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.TODO, allowed: true },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.DONE, allowed: true },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.IN_PROGRESS, allowed: false },
      { from: TaskStatus.DONE, to: TaskStatus.IN_PROGRESS, allowed: true },
      { from: TaskStatus.DONE, to: TaskStatus.TODO, allowed: false },
      { from: TaskStatus.DONE, to: TaskStatus.DONE, allowed: false },
    ];

    for (const testCase of cases) {
      const label = `${testCase.from} -> ${testCase.to}`;

      it(`should ${testCase.allowed ? 'allow' : 'reject'} the transition ${label}`, () => {
        const task = taskInStatus(testCase.from);

        if (!testCase.allowed) {
          expect(() => task.changeStatus(testCase.to)).toThrow(TaskInvalidTransitionError);
          expect(task.status).toBe(testCase.from);
          return;
        }

        task.changeStatus(testCase.to);
        expect(task.status).toBe(testCase.to);
      });
    }

    it('should set completedAt when the task becomes DONE', () => {
      const task = taskInStatus(TaskStatus.IN_PROGRESS);
      const now = new Date('2026-02-02T12:00:00.000Z');

      task.changeStatus(TaskStatus.DONE, now);

      expect(task.completedAt).toEqual(now);
    });

    it('should clear completedAt when the task leaves DONE', () => {
      const task = taskInStatus(TaskStatus.DONE);

      task.changeStatus(TaskStatus.IN_PROGRESS);

      expect(task.completedAt).toBeNull();
    });

    it('should not stamp completedAt when a task moves to IN_PROGRESS', () => {
      const task = taskInStatus(TaskStatus.TODO);

      task.changeStatus(TaskStatus.IN_PROGRESS);

      expect(task.completedAt).toBeNull();
    });

    it('should bump updatedAt when the status changes', () => {
      const task = taskInStatus(TaskStatus.TODO);
      const before = task.updatedAt;
      const now = new Date('2026-03-03T09:30:00.000Z');

      task.changeStatus(TaskStatus.IN_PROGRESS, now);

      expect(task.updatedAt).toEqual(now);
      expect(task.updatedAt.getTime()).toBeGreaterThan(before.getTime());
    });
  });

  describe('updateDetails', () => {
    it('should update the provided fields when called', () => {
      const task = Task.create({ projectId: PROJECT_ID, title: 'Ship it' });

      task.updateDetails({
        title: 'Ship it today',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2026-04-01T00:00:00.000Z'),
      });

      expect(task.title).toBe('Ship it today');
      expect(task.priority).toBe(TaskPriority.HIGH);
      expect(task.dueDate).toEqual(new Date('2026-04-01T00:00:00.000Z'));
    });

    it('should reject an empty update when nothing is provided', () => {
      const task = Task.create({ projectId: PROJECT_ID, title: 'Ship it' });

      expect(() => task.updateDetails({})).toThrow(ValidationError);
    });

    it('should never change the status when details are updated', () => {
      const task = taskInStatus(TaskStatus.DONE);

      task.updateDetails({ title: 'Renamed' });

      expect(task.status).toBe(TaskStatus.DONE);
    });
  });

  describe('reconstitute', () => {
    it('should keep the persisted status and completedAt when rebuilding from the database', () => {
      const completedAt = new Date('2026-01-15T00:00:00.000Z');
      const task = Task.reconstitute({
        id: randomUUID(),
        projectId: PROJECT_ID,
        title: 'Already done',
        description: 'from the database',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueDate: null,
        completedAt,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
        updatedAt: new Date('2026-01-15T00:00:00.000Z'),
      });

      expect(task.status).toBe(TaskStatus.DONE);
      expect(task.completedAt).toEqual(completedAt);
      expect(task.description).toBe('from the database');
    });
  });
});
