import { PrismaClient, Role, TaskPriority, TaskStatus } from '@prisma/client';
import argon2 from 'argon2';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@taskflow.dev';
const DEMO_EMAIL = 'demo@taskflow.dev';
const ARGON2_OPTIONS = { type: argon2.argon2id } as const;

interface SeedTask {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueInDays: number | null;
}

const DEMO_PROJECTS: Array<{ name: string; description: string; tasks: SeedTask[] }> = [
  {
    name: 'Portfolio backend',
    description: 'Three production-shaped services that show architecture decisions, not just CRUD.',
    tasks: [
      {
        title: 'Finish the TaskFlow API',
        description: 'Clean Architecture layers, refresh token rotation and the status workflow.',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        dueInDays: 3,
      },
      {
        title: 'Write the architecture decision records',
        description: 'One short paragraph per decision, with the trade-off spelled out.',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        dueInDays: 7,
      },
      {
        title: 'Set up the CI pipeline',
        description: 'Install, lint, typecheck, test against a real Postgres, build.',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        dueInDays: null,
      },
    ],
  },
  {
    name: 'Personal',
    description: 'Everything that is not the portfolio.',
    tasks: [
      {
        title: 'Review the pull requests',
        description: 'Read the diff, not just the green check.',
        status: TaskStatus.TODO,
        priority: TaskPriority.LOW,
        dueInDays: 1,
      },
      {
        title: 'Update the resume',
        description: 'One line per project, with the technology and the outcome.',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueInDays: 14,
      },
      {
        title: 'Book the dentist',
        description: 'Overdue by two months.',
        status: TaskStatus.DONE,
        priority: TaskPriority.LOW,
        dueInDays: null,
      },
    ],
  },
];

function dueDateFromNow(days: number | null): Date | null {
  if (days === null) {
    return null;
  }

  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

async function seedAdmin(): Promise<void> {
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (password === undefined || password.length < 8) {
    throw new Error('SEED_ADMIN_PASSWORD must be set to at least 8 characters before seeding');
  }

  const passwordHash = await argon2.hash(password, ARGON2_OPTIONS);

  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { passwordHash, role: Role.ADMIN },
    create: { email: ADMIN_EMAIL, passwordHash, name: 'TaskFlow Admin', role: Role.ADMIN },
  });

  console.log(`admin ready: ${ADMIN_EMAIL}`);
}

async function seedDemoUser(): Promise<void> {
  const plainPassword = process.env.SEED_DEMO_PASSWORD ?? 'DemoUser123';
  const passwordHash = await argon2.hash(plainPassword, ARGON2_OPTIONS);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash },
    create: { email: DEMO_EMAIL, passwordHash, name: 'Demo User', role: Role.USER },
  });

  // Re-seeding must be idempotent: projects cascade to their tasks.
  await prisma.project.deleteMany({ where: { ownerId: user.id } });

  for (const project of DEMO_PROJECTS) {
    const createdProject = await prisma.project.create({
      data: {
        ownerId: user.id,
        name: project.name,
        description: project.description,
      },
    });

    for (const task of project.tasks) {
      await prisma.task.create({
        data: {
          projectId: createdProject.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: dueDateFromNow(task.dueInDays),
          completedAt: task.status === TaskStatus.DONE ? new Date() : null,
        },
      });
    }
  }

  console.log(`demo user ready: ${DEMO_EMAIL} (${DEMO_PROJECTS.length} projects, 6 tasks)`);
}

async function main(): Promise<void> {
  await seedAdmin();
  await seedDemoUser();
  console.log('seeding complete');
}

main()
  .catch((error: unknown) => {
    console.error('seeding failed', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
