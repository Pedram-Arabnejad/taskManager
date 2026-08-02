import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { Role, TaskStatus, TaskPriority } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Admin user
  const adminPassword = await bcrypt.hash('Admin@123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@taskmanager.dev' },
    update: {},
    create: {
      email: 'admin@taskmanager.dev',
      password: adminPassword,
      name: 'Admin User',
      role: Role.ADMIN,
    },
  });
  console.log(`✅ Admin user created: ${admin.email} (password: Admin@123456)`);

  // Regular user
  const userPassword = await bcrypt.hash('User@123456', 12);
  const user = await prisma.user.upsert({
    where: { email: 'user@taskmanager.dev' },
    update: {},
    create: {
      email: 'user@taskmanager.dev',
      password: userPassword,
      name: 'Regular User',
      role: Role.USER,
    },
  });
  console.log(`✅ Regular user created: ${user.email} (password: User@123456)`);

  // Sample tasks for the regular user
  const tasks = [
    {
      title: 'Set up project architecture',
      description: 'Define Clean Architecture folder structure and interfaces',
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
    },
    {
      title: 'Implement JWT authentication',
      description: 'Access + refresh token flow with rotation',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
    },
    {
      title: 'Write API documentation',
      description: 'Complete README with architecture diagram and endpoints',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
    },
    {
      title: 'Add integration tests',
      description: 'Test the full auth and task flows',
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        userId: user.id,
      },
    });
  }
  console.log(`✅ ${tasks.length} sample tasks created for ${user.email}`);

  console.log('🎉 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
