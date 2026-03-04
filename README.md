# nest-basics

Learning-focused NestJS + Mongoose REST API for `items`, with production-oriented defaults and test coverage.

## Quick Start (Local)

Install dependencies:

```bash
npm install
```

Start Mongo with replica set support:

```bash
docker compose -f docker-compose.replset.yml up
```

Then start the API:

```bash
npm run start:dev
```

Mongo transactions require a replica set. This project uses transactions in item creation flow, so `docker-compose.replset.yml` is the recommended local default.

## Overview

This project demonstrates a practical baseline API setup:

- Config validation with Joi (`@nestjs/config`)
- Mongoose integration with environment-aware indexing behavior
- Unified error response shape via global `HttpExceptionFilter`
- Request correlation via `x-request-id` middleware
- Caching (memory in tests, optional Redis in non-test env)
- Throttling support via `@nestjs/throttler`
- Security hardening (CORS policy, Helmet, Compression)
- Structured logging with `nestjs-pino` + redaction policy
- Basic CQRS split (`@nestjs/cqrs`) for commands and queries
- Safe migration + seed scripts (`tsx`) with production guardrails
- Unit, integration, e2e, and OpenAPI contract snapshot tests

## Tech stack

- NestJS 10
- Mongoose
- MongoDB
- Jest + Supertest
- Swagger / OpenAPI
- Redis (optional)

## API endpoints

- `GET /items/health`
- `GET /items`
- `GET /items/search`
- `GET /items/:id`
- `POST /items`
- `PATCH /items/:id`
- `DELETE /items/:id`

Swagger UI (non-test env): `GET /docs`

## Environment setup

Create `.env` (dev/prod-like local) and `.env.test` (test).

Required:

- `MONGO_URI` (Mongo connection string)

Optional:

- `PORT` (default `3000`)
- `REDIS_URL` (enables Redis cache store)
- `CORS_ORIGIN` (comma-separated allowlist or `*`)
- `CORS_METHODS` (default `GET,POST,PATCH,DELETE,OPTIONS`)
- `CORS_CREDENTIALS` (`true` / `false`)
- `COMPRESSION` (`false` disables compression middleware)

## Running locally

Install dependencies:

```bash
npm install
```

Start in watch mode:

```bash
npm run start:dev
```

Build:

```bash
npm run build
```

Production start (after build):

```bash
npm run start
```

## Docker Compose notes

- `docker-compose.yml`: basic MongoDB container
- `docker-compose.redis.yml`: Redis container
- `docker-compose.replset.yml`: Mongo replica set for transaction-capable setup

### Replica set requirement

`ItemsService.create()` uses Mongo transactions (`withTransaction`).
Use replica set Mongo in environments where transactional behavior is required (for local learning: `docker-compose.replset.yml`).

## Scripts

- `npm run start` - run compiled app
- `npm run start:dev` - development watch mode
- `npm run build` - compile TypeScript
- `npm run test` - full test suite (NODE_ENV=test)
- `npm run test:e2e` - e2e-focused test suite
- `npm run test:redis` - redis cache smoke test
- `npm run migrate` - execute migrations via registry tracking
- `npm run seed` - idempotent seed insertion

## Unified error shape

All handled errors are normalized by global filter:

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": ["name must be longer than or equal to 1 characters"],
  "path": "/items",
  "timestamp": "2026-03-04T12:00:00.000Z",
  "requestId": "c83cb856-5688-42a9-a247-ca5842f8b61e"
}
```

`x-request-id` can be provided by clients; otherwise one is generated and echoed in response headers.

## Caching notes

- Test env: in-memory cache
- Non-test env:
  - Redis-backed if `REDIS_URL` is set
  - in-memory fallback if `REDIS_URL` is missing
- Item list responses are version-keyed for invalidation
- Item cache + list-version bump happen on create/update/delete

## Throttling notes

- Throttler is configured for runtime usage outside tests
- In tests (`NODE_ENV=test`), global throttling is intentionally not enabled to avoid interfering with non-throttling scenarios
- Dedicated throttle behavior is covered by `test/throttle.e2e.spec.ts`

## Logging and redaction policy

- Structured HTTP logs via `nestjs-pino`
- Request metadata includes requestId, method, path
- Sensitive fields are redacted (authorization/cookies/tokens/etc.)
- Production unknown errors do not expose internal exception messages

## Migrations and seeding safety

- Write scripts reject `NODE_ENV=production`
- Scripts also validate target `MONGO_URI` pattern to avoid accidental destructive writes
- Migrations are tracked in `migrations` collection (idempotent by migration name)
- Seed uses idempotent upserts by `name`

## Current folder structure (high-level)

```text
src/
	app.module.ts
	app.setup.ts
	main.ts
	common/
		filters/
		middleware/
		interceptors/
		logging/
		cache/
	items/
		commands/
		queries/
		dto/
		domain/
		infrastructure/
		items.controller.ts
		items.service.ts
	audit/
scripts/
	migrate.ts
	seed.ts
	_lib/
migrations/
test/
```

## CQRS scope in this project

The CQRS split is intentionally lightweight:

- Controller delegates to `CommandBus` / `QueryBus`
- Handlers delegate to existing `ItemsService`
- Service + repository remain the source of business/data logic

This keeps behavior and API contract stable while introducing CQRS structure.

## Testing strategy

- Unit tests (`src/**/*.spec.ts`)
- Repository integration tests with real Mongo
- E2E API tests (`test/*.e2e.spec.ts`)
- Contract snapshots including OpenAPI document

Run everything:

```bash
npm run test
```

## Small roadmap (learning path)

- Extract explicit application-layer use cases beyond service methods
- Move toward clearer clean architecture boundaries
- Add CI workflow (lint/typecheck/test)
- Add health/readiness probes and runtime observability extensions
