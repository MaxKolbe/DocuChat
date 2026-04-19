# DocuChat

An AI-powered document Q&A system

---

## Table of Contents

- [Setup Guide](#setup-guide)

---

## Setup Guide

### 1. Clone the Repository

```bash
git clone https://github.com/MaxKolbe/DocuChat.git
cd DocuChat
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root (see [Environment Variables](#environment-variables) for the full list):

```env
NODE_ENV=development

# PostgreSQL
PG_DATABASE_DEV_URL=postgresql://postgres:password@localhost:5432/devdb
PG_DATABASE_TEST_URL=postgresql://postgres:password@localhost:5432/testdb
PG_DATABASE_PROD_URL=<your-production-database-url>

# Redis
REDIS_DEV_URL=redis://localhost:6379
REDIS_TEST_URL=redis://localhost:6379
REDIS_PROD_URL=<your-production-redis-url>

# Logging
LOG_LEVEL=debug
SOURCE_TOKEN=<your-logtail-source-token>
INGESTING_HOST=<your-logtail-ingesting-host>

# JWT SECRETS
JWT_ACCESS_SECRET=<your-jwt-access-secret>
JWT_REFRESH_SECRET=<your-jwt-refresh-secret>

PORT=3000
```

### 4. Run Database Migrations

Apply migrations:

```bash
npx prisma migrate dev --name <name-for-your-migration>
```

### 5. Run The Seed Script (optional)

Apply migrations:

```bash
npm run seed 
```

### 6. Start the Development Server

```bash
npm run dev
```

The server will start at `http://localhost:3000`.

### 7. Production Build

```bash
npm run build       # Compile TypeScript to dist/
npm run start       # Run the compiled application
```

---