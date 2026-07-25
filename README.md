# Task Manager API

A production-grade Task Manager REST API built with **Express**, **TypeScript**, and **Clean Architecture**.

## Architecture

This project follows Clean Architecture principles with clear separation of concerns:

```
┌─────────────────────────────────────────────┐
│           Presentation (Controllers)         │
├─────────────────────────────────────────────┤
│           Application (Services)             │
├─────────────────────────────────────────────┤
│             Domain (Entities)                │
├─────────────────────────────────────────────┤
│          Infrastructure (Database)           │
└─────────────────────────────────────────────┘
```

### Layers

- **Domain** — Enterprise business rules (entities, interfaces, enums)
- **Application** — Application business rules (services, DTOs)
- **Infrastructure** — External concerns (database, auth providers)
- **Presentation** — HTTP layer (controllers, middleware, routes)

## Tech Stack

- **Runtime:** Node.js + TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (access + refresh tokens) + RBAC

## Features

- [ ] User registration & login with JWT
- [ ] Task CRUD with filtering & pagination
- [ ] Role-based access control (Admin/User)
- [ ] Refresh token rotation
- [ ] Request validation
- [ ] Centralized error handling

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL running locally

### Installation

```bash
# Clone the repository
git clone https://github.com/Pedram-Arabnejad/task-manager.git
cd task-manager

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client & run migrations
npx prisma generate
npx prisma migrate dev --name init

# Start development server
npm run dev
```
