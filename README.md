# Task Manager API

A production-grade **Task Manager REST API** built with **Express**, **TypeScript**, and **Clean Architecture** — demonstrating layered architecture, JWT authentication with refresh token rotation, RBAC, and design patterns.

## ✨ Highlights

- 🏗 **Clean Architecture** — Domain / Application / Infrastructure / Presentation layers
- 🔐 **JWT Auth** — Access token (15 min) + refresh token (7 days) with rotation
- 👮 **RBAC** — USER and ADMIN roles with guard middleware
- 🗄 **PostgreSQL + Prisma ORM** — Typed database access with migrations
- 🎨 **Design Patterns** — Repository, Dependency Injection, Factory Method
- 🔒 **Security** — bcrypt hashing, helmet, centralized error handling

## 🏛 Architecture

### Layer Diagram

```
┌──────────────────────────────────────────────────────────┐
│                     PRESENTATION                          │
│    Controllers  ·  Middleware  ·  Routes  ·  ErrorHandler │
├──────────────────────────────────────────────────────────┤
│                     APPLICATION                           │
│      AuthService  ·  TaskService  ·  DTOs (validation)    │
├──────────────────────────────────────────────────────────┤
│                        DOMAIN                             │
│   Entities (User, Task, RefreshToken)  ·  Interfaces      │
├──────────────────────────────────────────────────────────┤
│                    INFRASTRUCTURE                         │
│  Prisma Repositories  ·  JwtProvider  ·  PasswordHasher   │
├──────────────────────────────────────────────────────────┤
│                      PostgreSQL                           │
└──────────────────────────────────────────────────────────┘
```

### Request Flow

```mermaid
sequenceDiagram
    participant Client
    participant Routes
    participant Middleware
    participant Controller
    participant Service
    participant Repository
    participant Database

    Client->>Routes: POST /api/tasks (Bearer token)
    Routes->>Middleware: authMiddleware
    Middleware->>Middleware: Verify JWT signature & expiry
    Middleware-->>Routes: req.user = { userId, role }
    Routes->>Controller: createTask
    Controller->>Controller: DTO validation
    Controller->>Service: createTask(userId, input)
    Service->>Repository: create(task)
    Repository->>Database: INSERT INTO tasks
    Database-->>Repository: saved row
    Repository-->>Service: Task entity
    Service-->>Controller: Task
    Controller-->>Client: 201 { task }
```

### Design Decisions

| Decision | Why |
|----------|-----|
| **Repository Pattern** | Services depend on `IUserRepository` / `ITaskRepository` interfaces, not Prisma directly — swap databases without touching business logic |
| **Dependency Injection** | `Container` class wires all dependencies explicitly — makes services testable and loosely coupled |
| **Factory Methods** | `User.create()`, `Task.create()` encapsulate defaults (UUID, role, status) — no scattered `new Date()` / `randomUUID()` calls |
| **Refresh Token Rotation** | Old refresh token is deleted from DB on every refresh — a stolen token is immediately detected |
| **Separate JWT secrets** | Access and refresh tokens use different secrets — a compromised access secret doesn't expose refresh tokens |
| **DTO validation** | `RegisterDto.validate()` etc. validate input at the presentation edge — services never trust raw request bodies |
| **Numeric error codes** | 401 (not authenticated) vs 403 (not authorized) vs 404 (not found) — precise API semantics |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

### Installation

```bash
# 1. Clone
git clone https://github.com/Pedram-Arabnejad/taskManager.git
cd taskManager

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit DATABASE_URL, JWT secrets with strong random values

# 4. Set up the database
npx prisma migrate dev --name init
npx prisma generate

# 5. (Optional) Seed demo data
npm run prisma:seed

# 6. Start the server
npm run dev
```

Server runs at `http://localhost:3000` — health check at `GET /api/health`.

## 🔌 API Reference

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Login, get tokens |
| POST | `/api/auth/refresh` | — | Rotate refresh token |
| POST | `/api/auth/logout` | — | Revoke refresh token |
| POST | `/api/auth/logout-all` | ✅ | Revoke all sessions |

**Register — `POST /api/auth/register`**

```json
{
  "email": "ali@example.com",
  "password": "strongpass123",
  "name": "Ali"
}
```

**Response `201`**

```json
{
  "user": {
    "id": "7f1f...",
    "email": "ali@example.com",
    "name": "Ali",
    "role": "USER",
    "createdAt": "2026-07-25T10:00:00.000Z",
    "updatedAt": "2026-07-25T10:00:00.000Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOi...",
    "refreshToken": "eyJhbGciOi..."
  }
}
```

**Login — `POST /api/auth/login`**

```json
{
  "email": "ali@example.com",
  "password": "strongpass123"
}
```

### Tasks (all require `Authorization: Bearer <accessToken>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List own tasks (filters below) |
| GET | `/api/tasks/:id` | Get single task |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

**Query params for `GET /api/tasks`**

| Param | Values | Default |
|-------|--------|---------|
| `status` | `TODO` / `IN_PROGRESS` / `DONE` | all |
| `priority` | `LOW` / `MEDIUM` / `HIGH` | all |
| `page` | number | 1 |
| `limit` | number | 10 |
| `sortBy` | `createdAt` / `title` / `priority` | `createdAt` |
| `sortOrder` | `asc` / `desc` | `desc` |

**Create — `POST /api/tasks`**

```json
{
  "title": "Fix login bug",
  "description": "Refresh token not rotating",
  "priority": "HIGH"
}
```

**Update — `PUT /api/tasks/:id`** (all fields optional)

```json
{
  "status": "DONE",
  "priority": "LOW"
}
```

## 🗂 Project Structure

```
task-manager/
├── prisma/
│   ├── schema.prisma          # Database schema (User, Task, RefreshToken)
│   └── seed.ts                # Demo data: admin, user, sample tasks
├── src/
│   ├── index.ts               # Express bootstrap & route wiring
│   ├── container.ts           # Dependency Injection container
│   ├── domain/                # ★ Core — no external dependencies
│   │   ├── entities/          #   User, Task, RefreshToken
│   │   ├── enums/             #   Role, TaskStatus, TaskPriority
│   │   └── interfaces/        #   Repository & Service contracts
│   ├── application/           # ★ Business logic
│   │   ├── services/          #   AuthService, TaskService
│   │   └── dtos/              #   Validation & response shapes
│   ├── infrastructure/        # ★ External concerns
│   │   ├── database/          #   Prisma client
│   │   ├── repositories/      #   Prisma implementations
│   │   └── auth/              #   JwtProvider, PasswordHasher
│   └── presentation/          # ★ HTTP layer
│       ├── controllers/       #   Request handlers
│       ├── middlewares/       #   Auth, Role, ErrorHandler
│       └── routes/            #   Express routers
├── postman/                   # Postman collection
├── .env.example
└── tsconfig.json
```

## 🔑 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:pass@localhost:5432/task_manager` |
| `JWT_ACCESS_SECRET` | Signing secret for access tokens | random 64-char string |
| `JWT_REFRESH_SECRET` | Signing secret for refresh tokens | random 64-char string |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

> ⚠️ Never commit real secrets. Generate with `openssl rand -hex 32`.

## 🧪 Demo Accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@taskmanager.dev` | `Admin@123456` |
| User | `user@taskmanager.dev` | `User@123456` |

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 18+ |
| Language | TypeScript (strict mode) |
| Framework | Express 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Tooling | tsx, nodemon, dotenv |

## 📄 License

MIT
