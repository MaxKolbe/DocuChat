# DocuChat

A backend service that lets you chat with your documents. Upload PDFs, Word files, or plain text, and DocuChat processes them so you can ask questions and get answers backed by your own content, complete with source citations.

## System Architecture

```mermaid
flowchart LR
    Client["Web Client"]
    API["API Server (Express)"]
    DB[("PostgreSQL")]
    Redis[("Redis Cache / Queue")]
    OpenAI["OpenAI API"]
    Worker["BullMQ Worker"]
    Client --> API
    API --> DB
    API --> Redis
    API --> OpenAI
    API --> Worker
    Worker --> DB
    Worker --> OpenAI
    Worker --> Redis

    style Client fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
    style API fill:#2e1065,stroke:#8b5cf6,stroke-width:2px,color:#fff
    style DB fill:#0f172a,stroke:#3b82f6,stroke-width:2px,color:#fff
    style Redis fill:#4c0519,stroke:#ef4444,stroke-width:2px,color:#fff
    style OpenAI fill:#451a03,stroke:#f59e0b,stroke-width:2px,color:#fff
    style Worker fill:#1e1b4b,stroke:#6366f1,stroke-width:2px,color:#fff
```

The API server handles all client requests, verifies authentication and permissions, and offloads heavy work to a background worker. PostgreSQL stores everything from user accounts to documents and conversation history, while Redis caches embeddings and permissions and backs the job queue. The worker processes uploaded documents – chunking them, generating embeddings via OpenAI, and updating document status.

## Features

### Document Ingestion Pipeline
Upload a document and the system automatically extracts text, splits it into manageable chunks, generates embedding vectors, and marks it ready for Q&A. Processing happens asynchronously so the API stays responsive.

```mermaid
sequenceDiagram
    actor User
    User->>API: POST /documents (multipart file)
    API->>DB: Create document (status: pending)
    API->>Queue: Enqueue document processing job
    API-->>User: 202 Accepted (jobId)
    Queue->>Worker: Process document job
    Worker->>DB: Update status to processing
    Worker->>Worker: Extract text from file
    Worker->>Worker: Chunk text (max 500 tokens, overlap 50)
    Worker->>DB: Store chunks
    Worker->>OpenAI: Generate embeddings for each chunk
    OpenAI-->>Worker: Embedding vectors
    Worker->>DB: Update chunks with embeddings, set doc status to ready
```

### Ask Questions to Your Documents (RAG Chat)
Start a conversation, send a message, and the system retrieves the most relevant chunks from your uploaded documents, assembles them into context, and generates an answer with citations.

```mermaid
sequenceDiagram
    actor User
    User->>API: POST /conversations/:id/messages
    API->>API: Authenticate & validate
    API->>DB: Store user message
    API->>DB: Retrieve recent conversation history
    API->>Embedding: Generate embedding for the query
    Embedding->>DB: Cosine similarity search (pgvector)
    DB-->>API: Top-K relevant chunks
    API->>API: Assemble context (budgeted tokens, deduplication)
    API->>MCP: Send messages + context to model management layer
    MCP->>OpenAI: Chat completion with fallback
    OpenAI-->>MCP: Generated answer
    MCP-->>API: Answer, tokens, cost
    API->>DB: Store assistant message (with metadata)
    API-->>User: Message response (answer + citations)
```

### Role-Based Access Control
Assign roles to users (admin, member, viewer) with granular permissions like `documents:create`, `conversations:read`, or `roles:manage`. Permissions are cached and checked at every authenticated request.

### Rate Limiting & Tiered Quotas
Built-in rate limiters protect authentication, general API, document uploads, and AI queries. Limits scale with user tier (free, pro, enterprise). AI usage is also budgeted monthly to prevent cost overruns.

### Research Agent
An autonomous agent that can search your documents and reason over multiple retrieval steps. It uses a think-act-observe loop with tool calling, enforces iteration/cost/timeout limits, and gives a final answer when satisfied.

### Monitoring & Observability
Prometheus metrics, correlation IDs on every request, structured logging, and a Bull Board dashboard for queue monitoring give you full visibility into the system.

## Installation

1. **Clone the repository**

```bash
git clone https://github.com/MaxKolbe/DocuChat.git
cd DocuChat
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Copy the example environment file and fill in the required values:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL and Redis connection strings, JWT secrets, and OpenAI API key. See [Environment Variables](#environment-variables) for all options.

4. **Run database migrations**

```bash
npx prisma migrate dev --name init
```

5. **Seed the database (optional but recommended)**

This creates an admin user (`admin@docuchat.dev` / `Admin123!`), a test user (`test@docuchat.dev` / `Test1234!`), default roles, permissions, and prompt templates.

```bash
npm run seed
```

6. **Start the development server**

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

## Usage

All API endpoints are served under `/api/v1`. Swagger documentation is available at `/api-docs` when the server is running. For the raw OpenAPI spec, visit `/api-docs.json`.

To interact with the service, you'll first need to register a user and obtain an access token, then include it as a Bearer token in subsequent requests.

Below is a simple conversation workflow using `curl`:

Register a new user:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "StrongPass1"}'
```

Log in to get tokens:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "StrongPass1"}'
```

Upload a document (using the access token from the login response):

```bash
curl -X POST http://localhost:3000/api/v1/documents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -F "uploaded_file=@/path/to/document.pdf"
```

Wait a few seconds for processing, then create a conversation and send a message:

```bash
curl -X POST http://localhost:3000/api/v1/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title": "My first chat"}'
```

```bash
curl -X POST http://localhost:3000/api/v1/conversations/CONVERSATION_ID/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "What does the document say about security?"}'
```

The response will contain the assistant's answer and source citations.

## Environment Variables

| Variable                 | Description                                      | Required | Example                                                      |
|--------------------------|--------------------------------------------------|----------|--------------------------------------------------------------|
| `NODE_ENV`               | Environment (`development`, `production`, `test`) | Yes      | `development`                                                |
| `PORT`                   | Server port                                      | No       | `3000`                                                       |
| `PG_DATABASE_PROD_URL`   | Production PostgreSQL connection URL             | Yes¹     | `postgresql://user:pass@host/db?sslmode=verify-full`        |
| `PG_DATABASE_DEV_URL`    | Development PostgreSQL URL                       | Yes¹     | `postgresql://user:pass@localhost:5432/db`                   |
| `PG_DATABASE_TEST_URL`   | Test PostgreSQL URL                              | Yes¹     | `postgresql://user:pass@localhost:5432/db_test`              |
| `REDIS_PROD_URL`         | Production Redis URL                             | Yes¹     | `redis://user:pass@host:6379`                                |
| `REDIS_DEV_URL`          | Development Redis URL                            | Yes¹     | `redis://localhost:6379`                                     |
| `REDIS_TEST_URL`         | Test Redis URL                                   | Yes¹     | `redis://localhost:6379`                                     |
| `REDIS_HOST`             | Redis host (used by queues)                      | Yes      | `127.0.0.1`                                                  |
| `REDIS_PORT`             | Redis port (used by queues)                      | Yes      | `6379`                                                       |
| `JWT_ACCESS_SECRET`      | Secret for signing access tokens                 | Yes      | (random string)                                              |
| `JWT_REFRESH_SECRET`     | Secret for signing refresh tokens                | Yes      | (random string)                                              |
| `OPENAI_API_KEY`         | OpenAI API key                                   | Yes      | `sk-...`                                                     |
| `WEBHOOK_SECRET`         | Secret for verifying incoming webhooks           | No       | (random string)                                              |
| `LOG_LEVEL`              | Winston log level                                | No       | `info`                                                       |

¹ Use the URL that corresponds to your `NODE_ENV`.

## API Endpoints

All endpoints except health, metrics, and authentication routes require a valid access token sent as a Bearer token in the `Authorization` header.

### Authentication

#### `POST /api/v1/auth/register`

Register a new user.

**Request**

```json
{
  "email": "user@example.com",
  "password": "StrongPass1"
}
```

**Response**

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "tier": "free"
  },
  "meta": {
    "correlationId": "..."
  }
}
```

**Errors**
- `400` – Validation error (e.g., weak password)
- `409` – Email already registered

#### `POST /api/v1/auth/login`

Authenticate and receive tokens.

**Request**

```json
{
  "email": "user@example.com",
  "password": "StrongPass1"
}
```

**Response**

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "tier": "free"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  },
  "meta": { "correlationId": "..." }
}
```

**Errors**
- `400` – Invalid credentials
- `429` – Too many auth attempts

#### `POST /api/v1/auth/refresh`

Obtain a new access/refresh token pair.

**Request**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response**

```json
{
  "success": true,
  "message": "Refresh successful",
  "data": {
    "accessToken": "new eyJ...",
    "refreshToken": "new eyJ..."
  }
}
```

**Errors**
- `400` – Missing refresh token
- `401` – Expired or revoked token

#### `POST /api/v1/auth/logout`

Invalidate a refresh token.

**Request**

```json
{
  "refreshToken": "eyJ..."
}
```

**Response**

```json
{
  "success": true,
  "message": "Logged out"
}
```

### Documents

#### `GET /api/v1/documents`

List the authenticated user’s documents.

**Query Parameters**
- `page` (int, default 1)
- `limit` (int, default 20, max 100)
- `status` (`pending`, `processing`, `ready`, `failed`)
- `search` (string, searches title)
- `sortBy` (`createdAt`, `title`, `chunkCount`, default `createdAt`)
- `sortOrder` (`asc` or `desc`, default `desc`)

**Response**

```json
{
  "success": true,
  "message": "Documents listed successfully",
  "data": [
    {
      "id": "uuid",
      "title": "my-report",
      "filename": "my-report.pdf",
      "status": "ready",
      "chunkCount": 27,
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:05.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 5, "correlationId": "..." }
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `documents:read` permission

#### `GET /api/v1/documents/:docId`

Get a single document by ID.

**Response**

```json
{
  "success": true,
  "message": "document found successfully",
  "data": {
    "id": "...",
    "userId": "...",
    "title": "...",
    "filename": "...",
    "content": "...",
    "status": "ready",
    "chunkCount": 27,
    ...
  }
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `documents:read` permission
- `404` – Document not found or access denied

#### `POST /api/v1/documents`

Upload a new document (multipart form data). The field name must be `uploaded_file`.

**Request**
```
Content-Type: multipart/form-data
```

**Response**

```json
{
  "success": true,
  "message": "document Accepted! (still processing)",
  "data": {
    "newDocument": { "id": "...", "status": "pending", ... },
    "jobId": "..."
  }
}
```

**Errors**
- `400` – No file provided
- `401` – Not authenticated
- `403` – Missing `documents:create` permission

#### `DELETE /api/v1/documents/:docId`

Soft-delete a document.

**Response**

```json
{
  "success": true,
  "message": "Deleted successfully"
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `documents:delete` permission
- `404` – Document not found

#### `GET /api/v1/documents/:id/processing-status`

Poll the processing status of an uploaded document.

**Response**

```json
{
  "success": true,
  "message": "Returned poll result successfully",
  "data": {
    "status": "processing",
    "error": null,
    "progress": 30
  }
}
```

### Conversations

#### `GET /api/v1/conversations`

List user conversations.

**Query Parameters**
- `page` (int, default 1)
- `limit` (int, default 20, max 100)

**Response**

```json
{
  "success": true,
  "message": "Conversations found successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Welcome to DocuChat",
      "lastMessage": { "content": "...", "role": "assistant", "createdAt": "..." },
      "updatedAt": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `conversations:read` permission

#### `POST /api/v1/conversations`

Create a new conversation.

**Request**

```json
{
  "title": "Project Q&A"
}
```

**Response**

```json
{
  "success": true,
  "message": "Conversation created successfully",
  "data": { "id": "uuid", "title": "Project Q&A", ... }
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `conversations:create` permission

#### `POST /api/v1/conversations/:conversationId/messages`

Send a message and receive an AI-generated response.

**Request**

```json
{
  "content": "What is the revenue projection?",
  "documentId": "optional-doc-id"
}
```

**Response**

```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "userMessage": { "id": "...", ... },
    "assistantMessage": {
      "id": "...",
      "content": "The revenue projection is ...",
      "citations": [
        {
          "documentTitle": "budget.pdf",
          "chunkIndex": 5,
          "score": 0.92
        }
      ]
    }
  }
}
```

**Errors**
- `400` – Empty message
- `401` – Not authenticated
- `404` – Conversation not found or doesn’t belong to user

### Research Agent

#### `POST /api/v1/research`

Run the research agent that can search across your documents in a multi-step reasoning loop.

**Request**

```json
{
  "question": "Compare the security features mentioned in Q1 and Q4 reports"
}
```

**Response**

```json
{
  "success": true,
  "data": {
    "answer": "Both reports mention ...",
    "sources": ["security-audit-2024.pdf", "q1-report.txt"],
    "confidence": "high",
    "metadata": {
      "iterations": 2,
      "costUsd": 0.0034,
      "terminationReason": "completed"
    }
  }
}
```

**Errors**
- `401` – Not authenticated
- `403` – Missing `conversations:create` permission

### Admin

All admin endpoints require the `roles:manage` permission.

#### `GET /api/v1/admin/roles`

List all roles with their permissions and user count.

**Response**

```json
{
  "success": true,
  "message": "All roles found",
  "data": [
    {
      "id": "...",
      "name": "admin",
      "description": "Full system access",
      "isDefault": false,
      "userCount": 2,
      "permissions": ["documents:create", "documents:read", ...]
    }
  ]
}
```

#### `POST /api/v1/admin/users/:userId/roles`

Assign a role to a user.

**Request**

```json
{
  "roleName": "member"
}
```

**Response**

```json
{
  "success": true,
  "message": "Role 'member' assigned to user"
}
```

**Errors**
- `404` – User or role not found
- `403` – Missing `roles:manage` permission

#### `DELETE /api/v1/admin/users/:userId/roles/:roleName`

Revoke a role from a user.

**Response**

```json
{
  "success": true,
  "message": "Role 'member' revoked"
}
```

### Health & Monitoring

#### `GET /api/v1/health/live`

Liveness probe.

```json
{"status":"ok","timestamp":"2025-01-01T00:00:00.000Z","uptime":1234.5}
```

#### `GET /api/v1/health/ready`

Readiness probe. Checks database and Redis connectivity.

```json
{
  "status": "ok",
  "checks": {
    "database": {"status": "ok"},
    "redis": {"status": "ok"}
  }
}
```

Returns `503` if any check fails.

#### `GET /metrics`

Prometheus metrics endpoint.

#### `/admin/queues`

Bull Board queue monitoring dashboard (protected by authentication).

## Technologies Used

| Technology                                                                                     | Purpose                         |
|-----------------------------------------------------------------------------------------------|---------------------------------|
| [![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/) | Language                        |
| [![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js)](https://nodejs.org/)               | Runtime                         |
| [![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express)](https://expressjs.com/)            | Web framework                   |
| [![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=flat&logo=postgresql)](https://www.postgresql.org/) | Database (with pgvector)        |
| [![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)               | ORM                             |
| [![Redis](https://img.shields.io/badge/Redis-DC382D?style=flat&logo=redis)](https://redis.io/)                        | Caching & queue backend         |
| [![BullMQ](https://img.shields.io/badge/BullMQ-000000?style=flat&logo=bullmq)](https://bullmq.io/)                    | Job queue                       |
| [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai)](https://openai.com/)                   | Embeddings & chat completions   |
| [![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat&logo=docker)](https://www.docker.com/)              | (optional)                      |
