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
# Don't add this in hosting service
# development || production || test
NODE_ENV=development

##
PORT=3000

##
### use external url && host is string after @dpg- ending in .com
PG_DATABASE_PROD_URL=postgresql://user:password@dpg-host.com/database?sslmode=verify-full&connection_limit=10&pool_timeout=10 #pool config for prod
PG_DATABASE_DEV_URL=postgresql://user:password@host:port/database
PG_DATABASE_TEST_URL=postgresql://user:password@host:port/database

## REDIS
REDIS_PROD_URL=
REDIS_DEV_URL=
REDIS_TEST_URL=
REDIS_HOST=127.0.0.1
REDIS_PORT=6379 


## LOG LEVELS
# {  error: 0, warn: 1, info: 2, http: 3, verbose: 4, debug: 5, silly: 6 }
LOG_LEVEL=
SOURCE_TOKEN=
INGESTING_HOST=

## JWT SECRETS
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

## OPEN AI 
OPENAI_API_KEY=

## WEBHOOK SECRET
WEBHOOK_SECRET=
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
