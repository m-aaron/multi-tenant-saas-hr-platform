> **Multi-Tenant SaaS HR Platform Documentation**
>
> [01 Project Overview](./01-project-overview.md) • [02 System Architecture](./02-system-architecture.md) • [03 Database Design](./03-database-design.md) • [04 API Reference](./04-api-reference.md) • [05 Testing Strategy](./05-testing-strategy.md) • [06 Docker Guide](./06-docker-guide.md) • [07 CI/CD Pipeline](./07-ci-cd-pipeline.md) • **[08 Deployment Guide](./08-deployment-guide.md)** • [09 Development Roadmap](./09-development-roadmap.md) • [10 Future Enhancements](./10-future-enhancements.md)

---

# Production Deployment & Operations Guide

This document describes the production deployment process, infrastructure architecture, environment configuration, day-to-day development workflow, and operational procedures for the **Multi-Tenant SaaS HR Platform** backend.

The platform is designed to be **cloud-agnostic and vendor-neutral**, supporting seamless containerized deployments across modern cloud PaaS/CaaS providers (such as **Render**, **Railway**, **Fly.io**, **AWS App Runner**, and **Google Cloud Run**) alongside managed PostgreSQL databases.

---

## Table of Contents

- [Deployment Architecture & Strategy](#deployment-architecture--strategy)
- [Prerequisites & Toolchain](#prerequisites--toolchain)
- [Local Development & Pre-Deployment Workflow](#local-development--pre-deployment-workflow)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Environment Configuration & Secrets](#environment-configuration--secrets)
- [Production Cloud Deployment Procedures](#production-cloud-deployment-procedures)
- [Post-Deployment Verification & Smoke Tests](#post-deployment-verification--smoke-tests)
- [Rollback Strategy & Disaster Recovery](#rollback-strategy--disaster-recovery)
- [Deployment Troubleshooting & Triage](#deployment-troubleshooting--triage)
- [Operational Maintenance & Best Practices](#operational-maintenance--best-practices)
- [Document Index](#document-index)

---

## Deployment Architecture & Strategy

The platform employs a **Containerized Modular Monolith** deployment model. The application code compiles into a single unprivileged OCI container image running Node.js 24 and Express, backed by a dedicated PostgreSQL database service.

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           PUBLIC INTERNET                               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ HTTPS (TLS 1.3 / Port 443)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               CLOUD INGRESS / LOAD BALANCER / REVERSE PROXY             │
│               - SSL/TLS Termination                                     │
│               - DDoS & Edge Routing                                     │
│               - Port Forwarding to Container Runtime                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Internal Routing ($PORT)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│               APPLICATION CONTAINER SERVICE (node:24-alpine)            │
│               - Runtime: Node.js 24 (Express API)                       │
│               - Security: Non-Root Execution (USER node)                │
│               - Bind: 0.0.0.0:$PORT                                     │
│               - Health: GET /api/v1/health (HTTP 200)                   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │ Encrypted TCP (SSL Mode: Require)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     MANAGED POSTGRESQL DATABASE                         │
│               - Engine: PostgreSQL 17 / 16                              │
│               - Relational Schema: 9 Version-Controlled Migrations      │
│               - Connection Pooling: pg.Pool (src/databases/)            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles

1. **Cloud-Agnostic & Vendor-Neutral**: The application relies exclusively on standard container specifications, standard environment variables (`DATABASE_URL`, `PORT`), and unprivileged Linux execution, enabling deployment to any modern container hosting provider without vendor lock-in.
2. **12-Factor Configuration**: Application binaries remain identical across all environments; behavior and external connections are configured strictly through environment variables injected at runtime.
3. **Decoupled Database Migrations**: Relational schema migrations are executed independently of HTTP server startup, enabling zero-downtime rolling deploys and horizontal container scaling.
4. **Fail-Fast Startup Validation**: All required configuration settings and secrets are validated at boot time via Zod schemas before opening HTTP listeners or connection pools.

### Environment Separation

The platform enforces strict boundaries across three distinct operational environments:

| Environment           | Purpose                                               | Infrastructure Target                                   | Configuration Source  |
| :-------------------- | :---------------------------------------------------- | :------------------------------------------------------ | :-------------------- |
| **Local Development** | Day-to-day coding, debugging, interactive testing     | Docker Compose (`postgres:16-alpine` on port 5434)      | `backend/.env`        |
| **Automated CI/CD**   | Automated quality gates, linting, tests, build checks | GitHub Actions Service Container (`postgres:17-alpine`) | `backend/.env.test`   |
| **Production Cloud**  | Live customer workloads, multi-tenant operations      | Managed Cloud PaaS/CaaS + Managed Cloud PostgreSQL      | Platform Secret Store |

---

## Prerequisites & Toolchain

Before deploying or developing the platform, verify that the required runtimes and tools are installed.

### Required Software

| Tool                  | Minimum Version      | Purpose                                             |
| :-------------------- | :------------------- | :-------------------------------------------------- |
| **Node.js**           | `v24.x`              | JavaScript / TypeScript runtime                     |
| **pnpm**              | `v11.9.0` (Corepack) | Fast, deterministic package management              |
| **Docker**            | `v24.x+`             | Container packaging and local service orchestration |
| **Docker Compose**    | `v2.x+`              | Multi-container local development environment       |
| **Git**               | `v2.40+`             | Version control and deployment triggering           |
| **PostgreSQL Client** | `v16+` / `v17+`      | Database administrative operations                  |

### Toolchain Verification

Run the following commands in your terminal to confirm your environment:

```bash
node --version       # Expected: v24.x.x
pnpm --version       # Expected: 11.9.0 (or managed via Corepack)
git --version        # Expected: git version 2.x.x
docker --version     # Expected: Docker version 24.x.x+
docker compose version # Expected: Docker Compose version v2.x.x
```

Enable Corepack if `pnpm` is not globally installed:

```bash
corepack enable
corepack prepare pnpm@11.9.0 --activate
```

---

## Local Development & Pre-Deployment Workflow

A reliable production deployment begins with a reproducible local environment.

### 1. Repository Setup

Clone the repository and switch to the active development branch:

```bash
git clone https://github.com/m-aaron/multi-tenant-saas-hr-platform.git
cd multi-tenant-saas-hr-platform/backend
git switch develop
```

### 2. Dependency Installation

Install dependencies using the committed lockfile:

```bash
pnpm install --frozen-lockfile
```

### 3. Local Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Ensure `.env` contains local development defaults:

```ini
NODE_ENV=development
PORT=4000
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/hr_platform_dev?sslmode=disable
ACCESS_TOKEN_SECRET=dev_access_secret_key_minimum_32_characters_long_for_security!
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_SECRET=dev_refresh_secret_key_minimum_32_characters_long_for_security!
REFRESH_TOKEN_EXPIRES=30d
```

### 4. Start Local Infrastructure

From the project root, start the local PostgreSQL service via Docker Compose:

```bash
docker compose up -d
```

Verify that the container is healthy:

```bash
docker compose ps
```

### 5. Run Database Migrations

Apply the 9 version-controlled relational schema migrations:

```bash
pnpm migrate
```

For the isolated automated test database:

```bash
pnpm migrate:test
```

### 6. Local Quality Verification

Before committing or promoting changes to production, execute the full local quality gate suite:

```bash
pnpm tsc --noEmit        # Verify compile-time type safety
pnpm lint                # Execute ESLint static analysis
pnpm test                # Run 338 tests across 24 test suites
pnpm build               # Verify production TypeScript compilation
```

---

## Project Architecture & Directory Structure

The backend follows a **Modular Monolith** architecture. The codebase is organized into domain modules, shared utilities, centralized configuration, and database infrastructure.

```text
backend/
├── Dockerfile                   # Multi-stage production container build
├── package.json                 # Node.js dependencies & scripts
├── pnpm-lock.yaml               # Deterministic dependency lockfile
├── tsconfig.json                # TypeScript compiler configuration
├── tsconfig.build.json          # Production build configuration
├── database/                    # Database migrations & migration runner
│   ├── migrations/              # 9 SQL schema migration files
│   │   ├── 0001_create_organizations.sql
│   │   ├── 0002_create_roles.sql
│   │   ├── 0003_create_users.sql
│   │   ├── 0004_create_profiles.sql
│   │   ├── 0005_create_departments.sql
│   │   ├── 0006_create_employees.sql
│   │   ├── 0007_create_sessions.sql
│   │   ├── 0008_create_activity_logs.sql
│   │   └── 0009_create_audit_logs.sql
│   ├── schema.sql               # Declared migration execution order
│   └── migrate.ts               # Transactional migration runner CLI
└── src/                         # Application source code
    ├── app.ts                   # Express application setup & middleware
    ├── server.ts                # HTTP server entrypoint & port listener
    ├── configs/                 # Centralized environment & Zod validation
    │   └── env.ts               # Fail-fast environment schema
    ├── databases/               # PostgreSQL connection pool & transaction utilities
    │   └── index.ts             # pg.Pool instance configuration
    ├── middlewares/             # Express middlewares (auth, RBAC, error handling)
    ├── modules/                 # Business domain modules
    │   ├── activity/            # Operational activity logs
    │   ├── audit/               # Security & compliance audit logs
    │   ├── auth/                # Authentication & JWT session management
    │   ├── department/          # Department hierarchy & tenant scoping
    │   ├── employee/            # Employee records & workforce management
    │   ├── health/              # Health check probe & DB ping
    │   ├── organization/        # Tenant root entity & lifecycle
    │   ├── profile/             # User profile details
    │   ├── role/                # RBAC roles & access control
    │   ├── session/             # Active user refresh sessions
    │   └── user/                # User accounts & credentials
    └── shared/                  # Cross-cutting utilities, errors, types
```

---

## Environment Configuration & Secrets

Production configurations and secrets are managed via platform environment settings (e.g., Render Environment Variables, Railway Variables, Fly.io Secrets, AWS Secrets Manager, Google Cloud Secret Manager).

### Production Configuration Reference

| Variable Name           | Type   | Required | Description                                       | Example                                                   |
| :---------------------- | :----- | :------: | :------------------------------------------------ | :-------------------------------------------------------- |
| `NODE_ENV`              | String |   Yes    | Runtime environment flag                          | `production`                                              |
| `PORT`                  | Number | Dynamic  | Injected by hosting platform (fallback: `4000`)   | `8080` / `10000`                                          |
| `DATABASE_URL`          | String |   Yes    | PostgreSQL connection string with SSL             | `postgresql://user:pass@host:5432/dbname?sslmode=require` |
| `ACCESS_TOKEN_SECRET`   | Secret |   Yes    | High-entropy 256-bit key for signing access JWTs  | `a1b2c3d4...` (64+ hex characters)                        |
| `ACCESS_TOKEN_EXPIRES`  | String |   Yes    | Access token lifespan                             | `15m`                                                     |
| `REFRESH_TOKEN_SECRET`  | Secret |   Yes    | High-entropy 256-bit key for signing refresh JWTs | `e5f6g7h8...` (64+ hex characters)                        |
| `REFRESH_TOKEN_EXPIRES` | String |   Yes    | Refresh token lifespan                            | `30d`                                                     |

### Generating Secure Secrets

Generate cryptographically secure 256-bit secrets for production JWT tokens:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Fail-Fast Startup Validation

The application validates all required environment variables on boot using Zod in `src/configs/env.ts`:

```text
Process Start (node dist/server.js)
        ↓
Read process.env
        ↓
Zod Schema Validation (envSchema.safeParse)
        ↓
┌───────────────────────┴───────────────────────┐
│ Valid                                         │ Invalid
▼                                               ▼
Connect DB Pool & Start HTTP Listener           Log formatted missing keys & process.exit(1)
```

---

## Production Cloud Deployment Procedures

The deployment workflow connects the GitHub repository to your cloud container platform of choice.

### General Cloud Platform Setup (Render / Railway / Fly.io / AWS App Runner)

```text
GitHub Repository (main)
        ↓ (Webhook Trigger on PR Merge)
Cloud Platform Build Pipeline
        ↓
Root Directory: /backend | Dockerfile: Dockerfile
        ↓
Multi-Stage Docker Build (Builder -> Production Stage)
        ↓
Pre-Deploy Release Phase (Run Migrations: pnpm migrate)
        ↓
Deploy Unprivileged Container (USER node)
        ↓
Edge Ingress Routing & SSL Termination (Port 443 -> $PORT)
        ↓
Health Check Verification (GET /api/v1/health)
        ↓
Live Production Traffic
```

### Step 1: Provision Managed PostgreSQL

1. Provision a PostgreSQL 16 or 17 instance via your cloud provider (e.g., Supabase, Neon, AWS RDS, Render PostgreSQL, Railway PostgreSQL).
2. Copy the production connection string.
3. Ensure SSL connection mode is enabled (`?sslmode=require`).

### Step 2: Configure the Container Web Service

1. Connect your cloud platform to the GitHub repository: `m-aaron/multi-tenant-saas-hr-platform`.
2. Configure service properties:
   - **Production Branch**: `main`
   - **Root Directory**: `backend` (or `/backend`)
   - **Build Type**: `Dockerfile`
   - **Dockerfile Path**: `Dockerfile` (relative to the `backend/` root directory)
3. Set the Environment Variables listed in the [Environment Configuration](#environment-configuration--secrets) section.

### Step 3: Multi-Stage Docker Build Packaging

The backend compiles via the optimized multi-stage `backend/Dockerfile`:

```dockerfile
# Stage 1: Builder
FROM node:24-alpine AS builder
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production Runtime
FROM node:24-alpine AS runner
RUN apk add --no-cache wget && corepack enable && corepack prepare pnpm@11.9.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --from=builder /app/dist ./dist
COPY database ./database
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT:-4000}/api/v1/health || exit 1
CMD ["node", "dist/server.js"]
```

### Step 4: Execute Production Database Migrations

Run database schema migrations against the production database using a pre-deploy release hook or one-off cloud execution task:

```bash
pnpm migrate
```

This sequentially applies all 9 migrations against the production database:

1. `0001_create_organizations.sql`
2. `0002_create_roles.sql`
3. `0003_create_users.sql`
4. `0004_create_profiles.sql`
5. `0005_create_departments.sql`
6. `0006_create_employees.sql`
7. `0007_create_sessions.sql`
8. `0008_create_activity_logs.sql`
9. `0009_create_audit_logs.sql`

### Step 5: Dynamic Port Binding & Ingress

The application reads the platform-assigned port at runtime and binds explicitly to `0.0.0.0`:

```ts
const PORT = Number(process.env.PORT ?? 4000);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  logger.info(`Server running on ${HOST}:${PORT}`);
});
```

Cloud load balancers route public HTTPS traffic directly to the container's bound port.

---

## Post-Deployment Verification & Smoke Tests

After deployment, perform layered verification to confirm infrastructure health, database connectivity, and API correctness.

```text
Step 1: Container Startup & Log Inspection
        ↓
Step 2: GET /api/v1/health (HTTP 200 OK + database: connected)
        ↓
Step 3: POST /api/v1/auth/login (JWT Token Generation)
        ↓
Step 4: GET /api/v1/departments (Tenant-Scoped Protected Query)
        ↓
Step 5: Operational Smoke Test Complete
```

### 1. Health Endpoint Verification

```bash
curl -i https://api.yourdomain.com/api/v1/health
```

**Expected Response (HTTP 200 OK)**:

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 142.8,
  "environment": "production"
}
```

_If the database is unreachable, the endpoint returns **HTTP 503 Service Unavailable** with `"database": "disconnected"`._

### 2. Authentication Verification

Test that password verification (Argon2) and JWT token signing work in the production environment:

```bash
curl -i -X POST https://api.yourdomain.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "ProductionPassword123!"}'
```

**Expected Response**: HTTP `200 OK` with a valid `accessToken` and secure `refreshToken` HTTP-only cookie.

### 3. Tenant-Scoped Protected Endpoint Verification

Test tenant isolation and authorization middleware using the access token:

```bash
curl -i https://api.yourdomain.com/api/v1/departments \
  -H "Authorization: Bearer <YOUR_ACCESS_TOKEN>"
```

**Expected Response**: HTTP `200 OK` with department records scoped strictly to the authenticated user's organization.

### Production Verification Checklist

```text
✅ Cloud deployment rollout status: ACTIVE
✅ Container logs: Clean startup with 0 unhandled exceptions
✅ Server bind: Listening on 0.0.0.0:$PORT
✅ Health endpoint: GET /api/v1/health returns HTTP 200 OK
✅ Database connectivity: Reports "database": "connected"
✅ Authentication: Login returns valid JWT access token
✅ Tenant isolation: Protected queries return organization-scoped data
✅ Security: Container running as unprivileged USER node
```

---

## Rollback Strategy & Disaster Recovery

If a production regression occurs, follow a structured rollback procedure.

### 1. Container Rollback (Application Logic Regression)

Because production deployments are tied to Git commits on `main`, reverting an application bug is straightforward:

1. **Immediate Platform Rollback**: In your cloud platform console, click **Rollback** to redeploy the previous healthy container image SHA instantly.
2. **Git History Alignment**: Create a revert commit in Git:
   ```bash
   git revert <REGRESSION_COMMIT_SHA>
   git push origin main
   ```

### 2. Database Migration Rollback Considerations

Application rollbacks do not automatically reverse database schema changes:

```text
Application Rollback ≠ Database Rollback
```

- **Backward-Compatible Schema Policy**: All database migrations must be additive and backward-compatible (e.g., adding nullable columns, creating new tables).
- **Destructive Changes**: Avoid dropping columns or tables in the same release as application changes. Deprecate fields first, deploy application changes, and remove columns in a subsequent release.

---

## Deployment Troubleshooting & Triage

When diagnosing deployment issues, follow this triage flow to isolate the root cause:

```text
Incident / Failure
        ↓
Identify Failing Layer:
  ├── [Build Phase]      → Monorepo root directory mismatch or dependency issue
  ├── [Startup Phase]    → Missing environment variable (Zod validation failure)
  ├── [Database Layer]   → Connection timeout or missing sslmode=require
  ├── [Networking Layer] → 502 Bad Gateway (Port binding or 127.0.0.1 instead of 0.0.0.0)
  └── [Application Layer]→ Unhandled error or token signing failure
```

### Common Issues & Resolutions

#### 1. 502 Bad Gateway / Service Unavailable

- **Cause**: Application listening on `localhost` (`127.0.0.1`) instead of `0.0.0.0`, or listening on a hardcoded port rather than the platform's `process.env.PORT`.
- **Resolution**: Verify that `src/server.ts` binds explicitly to `0.0.0.0` and uses `Number(process.env.PORT ?? 4000)`.

#### 2. Container Startup Crash (`Environment validation error`)

- **Cause**: Missing or invalid required environment variable (e.g., missing `DATABASE_URL` or JWT secrets).
- **Resolution**: Check the platform's deployment logs for the specific Zod error message. Add the missing variable in the cloud dashboard.

#### 3. Database Connection Error (`self-signed certificate in certificate chain`)

- **Cause**: Cloud PostgreSQL requires SSL, but the client connection does not have SSL enabled.
- **Resolution**: Append `?sslmode=require` to `DATABASE_URL` and ensure `pg.Pool` accepts SSL connections under `NODE_ENV=production`.

#### 4. Docker Build Fails (`Cannot find module`)

- **Cause**: Build context is not configured to `/backend`, causing `package.json` or source files to be missing.
- **Resolution**: Set the service root directory to `backend` in the cloud hosting provider's build settings.

#### 5. Migration Process Hanging During Deployment

- **Cause**: Open logging streams (e.g., `pino-pretty`) or unclosed database pool connections in non-TTY environments.
- **Resolution**: Disable pretty logging in production/release environments and ensure `await pool.end()` is invoked upon migration completion.

---

## Operational Maintenance & Best Practices

To maintain long-term stability, perform regular operational maintenance:

### 1. Dependency & Tooling Updates

- Regularly review and update Node.js (`v24.x`), pnpm (`v11.9.0`), and Alpine base images for security vulnerabilities.
- Keep dependencies updated using `pnpm update` and verify lockfile integrity.

### 2. Secret Rotation Policy

- Rotate production JWT signing secrets and database passwords periodically.
- When rotating secrets, update the platform environment settings and trigger a rolling restart.

### 3. Documentation Synchronization

- When deployment steps or configuration variables change, keep this document ([`08-deployment-guide.md`](./08-deployment-guide.md)), [`06-docker-guide.md`](./06-docker-guide.md), and [`07-ci-cd-pipeline.md`](./07-ci-cd-pipeline.md) synchronized.

---

## Document Index

This document is part of the **Multi-Tenant SaaS HR Platform** technical documentation suite:

| Document                                                | Description                                                      |
| :------------------------------------------------------ | :--------------------------------------------------------------- |
| [01 — Project Overview](./01-project-overview.md)       | Business domain, multi-tenancy model, and system scope           |
| [02 — System Architecture](./02-system-architecture.md) | Layered modular architecture, request lifecycle, and security    |
| [03 — Database Design](./03-database-design.md)         | Relational PostgreSQL schema, indexes, and tenant isolation      |
| [04 — API Reference](./04-api-reference.md)             | REST API conventions, endpoints, request/response specifications |
| [05 — Testing Strategy](./05-testing-strategy.md)       | Test hierarchy, domain coverage, and QA verification             |
| [06 — Docker Guide](./06-docker-guide.md)               | Multi-stage Docker packaging, Compose, and container security    |
| [07 — CI/CD Pipeline](./07-ci-cd-pipeline.md)           | GitHub Actions CI, 5-layer quality gates, and cloud deployment   |
| **08 — Deployment Guide** _(this document)_             | Production cloud deployment, database hosting, and monitoring    |
| [09 — Development Roadmap](./09-development-roadmap.md) | Development phases, completed milestones, and future work        |
| [10 — Future Enhancements](./10-future-enhancements.md) | Enterprise roadmap, Redis caching, microservices, and AI         |
