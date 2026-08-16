> **Multi-Tenant SaaS HR Platform Documentation**
>
> [01 Project Overview](./01-project-overview.md) • [02 System Architecture](./02-system-architecture.md) • [03 Database Design](./03-database-design.md) • [04 API Reference](./04-api-reference.md) • [05 Testing Strategy](./05-testing-strategy.md) • [06 Docker Guide](./06-docker-guide.md) • **[07 CI/CD Pipeline](./07-ci-cd-pipeline.md)** • [08 Deployment Guide](./08-deployment-guide.md) • [09 Development Roadmap](./09-development-roadmap.md) • [10 Future Enhancements](./10-future-enhancements.md)

---

# CI/CD Pipeline & Quality Engineering

The **Multi-Tenant SaaS HR Platform** uses Continuous Integration and Continuous Deployment (CI/CD) to automate software verification, enforce multi-layer quality gates, and deliver production-ready containerized releases.

The goal of the CI/CD pipeline is to ensure that every code change is independently validated, via static analysis, compile-time type checks, schema migrations, domain test suites, coverage assertions, and container packaging, before promotion to the production environment.

---

## Table of Contents

- [Continuous Integration & Deployment Concepts](#continuous-integration--deployment-concepts)
- [Git Branching & Promotion Strategy](#git-branching--promotion-strategy)
- [GitHub Actions CI Pipeline](#github-actions-ci-pipeline)
- [The 5 CI Quality Gate Layers](#the-5-ci-quality-gate-layers)
- [Test & Build Pipeline](#test--build-pipeline)
- [Secrets & Environment Configuration](#secrets--environment-configuration)
- [Production Cloud Deployment](#production-cloud-deployment)
- [Post-Deployment Verification & Smoke Tests](#post-deployment-verification--smoke-tests)
- [CI/CD Troubleshooting & Triage](#cicd-troubleshooting--triage)
- [CI/CD Maintenance & Operations](#cicd-maintenance--operations)
- [Document Index](#document-index)

---

## Continuous Integration & Deployment Concepts

### Continuous Integration (CI)

Continuous Integration is the automated verification stage of the development lifecycle. Whenever code is pushed to GitHub or submitted via a pull request, GitHub Actions provisions an isolated environment to execute the complete verification suite.

The primary objective of CI is fast, reliable regression detection independent of the developer's local machine state.

```text
Code Change
    ↓
Git Push / Pull Request
    ↓
GitHub Actions Runner (ubuntu-latest)
    ↓
Automated Quality Gates (Lint, TypeCheck, Migrations, Vitest, Docker Build)
    ↓
Pass / Fail Status Gate
```

### Continuous Deployment (CD)

Continuous Deployment connects verified repository states to production hosting infrastructure. In this architecture, production deployment is driven by merges to the `main` branch across cloud container platforms (such as Render, Railway, Fly.io, Google Cloud Run, or AWS App Runner).

```text
develop (verified)
    ↓
Pull Request & Code Review
    ↓
Merge to main
    ↓
Cloud Platform Ingress / Webhook Trigger
    ↓
Multi-Stage Docker Build (backend/Dockerfile)
    ↓
Unprivileged Production Container (USER node)
    ↓
Health Check Verification (/api/v1/health)
    ↓
Live Production Traffic
```

### Separation of Responsibilities

The software lifecycle maintains a strict separation of concerns across each engineering layer:

```text
Git
→ Source control history, branching, and commit traceability

GitHub
→ Team collaboration, pull requests, and branch protection rules

GitHub Actions
→ Automated CI quality gates, static analysis, tests, and build checks

Docker
→ Deterministic container packaging and unprivileged runtime environment

Cloud Container Platform (Render / Railway / Fly.io)
→ Automated container builds, process orchestration, and ingress routing

Managed PostgreSQL
→ Relational database persistence, transaction management, and connection pooling
```

---

## Git Branching & Promotion Strategy

The repository follows a structured two-branch Git strategy designed to isolate work-in-progress development from production-ready code.

```text
feature / fix branch
        ↓
    develop (Active Development)
        ↓
   CI Verification (GitHub Actions)
        ↓
  Pull Request & Code Review
        ↓
     main (Production Source of Truth)
        ↓
Production Cloud Container Deployment
```

### Branch Roles

| Branch    | Role                                               | Deployment Target                  | Protection Rules                                    |
| :-------- | :------------------------------------------------- | :--------------------------------- | :-------------------------------------------------- |
| `develop` | Active development, feature integration, bug fixes | Local / Staging test environments  | Requires passing CI checks before merging           |
| `main`    | Production-ready, verified release candidates      | Production cloud container hosting | Protected branch; requires PR approval + passing CI |

### Feature Development Workflow

1. **Branch Out**: Start development work from `develop`:
   ```bash
   git switch develop
   git pull origin develop
   ```
2. **Local Implementation**: Implement code changes, unit tests, and migration scripts.
3. **Local Pre-Push Verification**: Run all quality gates locally:
   ```bash
   pnpm test
   pnpm migrate:test
   pnpm lint
   pnpm tsc --noEmit
   pnpm build
   ```
4. **Commit**: Use structured Conventional Commit messages:
   ```bash
   git commit -m "feat(auth): implement refresh token rotation and revocation"
   ```
5. **Push & Pull Request**: Push to `develop` and open a Pull Request targeting `main`.
6. **Automated Gate**: GitHub Actions runs the authoritative 5-layer quality gate.
7. **Promotion**: Upon successful review and CI green status, merge into `main` to trigger automated production deployment.

### Commit Message Conventions

Commit messages must clearly convey the technical intent of each change:

```text
feat(auth): add refresh token rotation and revocation
fix(server): bind Express listener explicitly to 0.0.0.0
docs(ci): update quality gate specification for PostgreSQL 17
```

---

## GitHub Actions CI Pipeline

GitHub Actions provides the continuous integration engine for the platform. The pipeline executes on every `push` and `pull_request` against `main` and `develop`.

### Pipeline Architecture

```text
Git Event (Push / Pull Request on main, develop)
        ↓
Concurrency Control (cancel-in-progress: true)
        ↓
PostgreSQL 17 Service Container (postgres:17-alpine on port 5434)
        ↓
Step 1: Setup pnpm (v11.9.0) & Node.js (v24) with Cache
        ↓
Step 2: Install Dependencies (--frozen-lockfile --prefer-offline)
        ↓
Step 3: Database Migrations (pnpm migrate:test)
        ↓
Step 4: TypeScript Type Check (pnpm tsc --noEmit)
        ↓
Step 5: ESLint Static Analysis (pnpm lint)
        ↓
Step 6: Domain Test Suite with Coverage (pnpm test:coverage)
        ↓
Step 7: Upload Coverage Report Artifact (actions/upload-artifact@v4)
        ↓
Step 8: Docker Multi-Stage Build Verification (docker build)
        ↓
Pipeline Status: PASS / FAIL
```

### Workflow Specification

The authoritative workflow is defined in `.github/workflows/backend.yml`:

| Configuration Attribute | Value                                                       | Engineering Rationale                                                      |
| :---------------------- | :---------------------------------------------------------- | :------------------------------------------------------------------------- |
| **Workflow Name**       | `Backend CI`                                                | Authoritative CI verification suite for backend services                   |
| **Triggers**            | `push`, `pull_request` (`main`, `develop`)                  | Validates PRs before merge and validates the post-merge commit             |
| **Permissions**         | `contents: read`                                            | Principle of least privilege; CI token has read-only repository access     |
| **Concurrency**         | `backend-ci-${{ github.ref }}` (`cancel-in-progress: true`) | Automatically cancels redundant in-flight runs when new commits are pushed |
| **Runner OS**           | `ubuntu-latest`                                             | Clean, reproducible virtualized Linux environment                          |
| **Job Timeout**         | `20 minutes`                                                | Prevents hanging processes from consuming unnecessary runner minutes       |
| **Node.js & pnpm**      | Node `24` + pnpm `11.9.0` (Corepack)                        | Matches production Node version with deterministic lockfile enforcement    |

### CI PostgreSQL Service Container

To guarantee true database isolation and prevent mock-only test drift, GitHub Actions provisions a dedicated PostgreSQL container:

```yaml
services:
  postgres:
    image: postgres:17-alpine
    env:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: hr_platform_test
    ports:
      - 5434:5432
    options: >-
      --health-cmd "pg_isready -U postgres"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5
```

This ensures that schema migrations and database-backed integration tests execute against a pristine PostgreSQL instance on every run.

---

## The 5 CI Quality Gate Layers

The CI pipeline enforces five distinct verification gates before any commit is considered production-ready.

```text
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Static Analysis & Type Safety (ESLint + tsc)       │
├─────────────────────────────────────────────────────────────┤
│ Layer 2: Database Schema Integrity (pnpm migrate:test)      │
├─────────────────────────────────────────────────────────────┤
│ Layer 3: Automated Domain & Integration Tests (Vitest)       │
├─────────────────────────────────────────────────────────────┤
│ Layer 4: Code Coverage Reporting & Retention (Artifacts)    │
├─────────────────────────────────────────────────────────────┤
│ Layer 5: Docker Container Packaging Verification (Build)    │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Static Analysis & Type Safety Gate

Static checks ensure compile-time correctness and style adherence before any runtime code is executed:

- **TypeScript Type Verification**:
  ```bash
  pnpm tsc --noEmit
  ```
  Confirms 100% strict type safety across all TypeScript sources without generating disk output.
- **ESLint Code Analysis**:
  ```bash
  pnpm lint
  ```
  Enforces AST-level lint rules, unused variable detection, import formatting, and backend best practices.

### Layer 2: Database Schema & Migration Gate

Validates that SQL migration files execute cleanly against a live PostgreSQL 17 service:

```bash
pnpm migrate:test
```

Under `NODE_ENV=test`, the migration runner applies all 9 relational schema migrations sequentially:

1. `0001_create_organizations.sql` - Tenant root entity; establishes ownership boundaries for all business data
2. `0002_create_roles.sql` - Named access levels scoped to an organization; supports RBAC enforcement
3. `0003_create_users.sql` - Authenticated platform accounts linked to exactly one employee and one role
4. `0004_create_profiles.sql` - Supplementary profile information; one-to-one with users (cascade delete)
5. `0005_create_departments.sql` - Organizational units for grouping employees within a tenant
6. `0006_create_employees.sql` - Workforce records; department assignment is optional (nullable FK)
7. `0007_create_sessions.sql` - Refresh token store for authenticated user sessions; supports revocation
8. `0008_create_activity_logs.sql` - Append-only operational activity event log with JSONB metadata
9. `0009_create_audit_logs.sql` - Append-only security and compliance event log with entity tracking

A fully migrated database confirms schema consistency with zero dangling foreign keys or invalid constraints.

### Layer 3: Automated Test Suite Gate

Executes the entire test suite using Vitest with full domain coverage:

```bash
pnpm test:coverage
```

- **Suite Metrics**: 24 test files containing **338 automated tests**.
- **Coverage Distribution**:
  - 12 Unit Test suites (isolated business logic, schema validation, token generation).
  - 12 Integration Test suites (real HTTP requests, tenant isolation, database transactions).
- **Pass Requirement**: Strict 100% pass rate. Any skipped, flaky, or failing assertion halts the pipeline.

### Layer 4: Coverage Reporting & Artifact Retention Gate

Following test execution, the pipeline archives the generated coverage report for auditability and regression tracking:

```yaml
- name: Upload Coverage Report
  uses: actions/upload-artifact@v4
  if: always()
  with:
    name: backend-coverage-report
    path: backend/coverage
    if-no-files-found: error
    retention-days: 14
```

### Layer 5: Docker Container Packaging Gate

The final CI step verifies that the production `backend/Dockerfile` compiles into a valid, runnable container image:

```bash
docker build --tag hr-platform-backend:${{ github.sha }} .
```

This guarantees that:

- Corepack and pnpm install only production dependencies in the runtime stage (`--prod`).
- Alpine runtime packages (`wget` for health checks) are installed.
- Unprivileged `USER node` security permissions are properly configured.
- The compiled `dist/server.js` binary is present and executable.

### Quality Gate Scope Matrix

| Change Type                   | Required CI Gate Verification                               |
| :---------------------------- | :---------------------------------------------------------- |
| **Documentation Only**        | Markdown link and table-of-contents validation              |
| **Application Logic**         | Lint + TypeCheck + Unit & Integration Tests + Docker Build  |
| **Database Schema**           | Migrations + Integration Tests + Rollback verification      |
| **Dockerfile / Dependencies** | Frozen install + Full test suite + Docker multi-stage build |
| **Production Config**         | CI Quality Gate + Health endpoint verification              |

---

## Test & Build Pipeline

The test-and-build pipeline defines the technical validation steps executed both locally and during CI.

```mermaid
flowchart TD
    Start(["git push / PR<br/>to main or develop"]) --> Runner["GitHub Actions Runner<br/>(Node.js 24)"]
    Runner --> SetupDB["PostgreSQL 17 Alpine Container<br/>(Port 5434)"]
    SetupDB --> Install["Install Dependencies<br/>(pnpm install --frozen-lockfile)"]
    Install --> Gate1["Step 1: Database Migrations<br/>(pnpm migrate:test)"]
    Gate1 --> Gate2["Step 2: TypeScript Type Check<br/>(pnpm tsc --noEmit)"]
    Gate2 --> Gate3["Step 3: Code Linting<br/>(pnpm lint)"]
    Gate3 --> Gate4["Step 4: Automated Tests & Coverage<br/>(Vitest: 338 tests)"]
    Gate4 --> Upload["Step 5: Upload Coverage Artifacts<br/>(14-day retention)"]
    Upload --> Gate5["Step 6: Multi-Stage Docker Build<br/>(backend/Dockerfile)"]
    Gate5 --> Done(["✅ All Quality Gates Passed<br/>(Ready to Deploy)"])
```

### Pipeline Reproducibility

Reproducibility is maintained across all environments by enforcing:

1. **Deterministic Lockfile**: `pnpm-lock.yaml` with `--frozen-lockfile`.
2. **Standardized Runtime**: Node.js `24.x` across local development, CI runners, and Docker containers.
3. **Pristine Test State**: Clean test databases running on PostgreSQL 17 Alpine.
4. **Targeted TypeScript Compilation**: `tsconfig.build.json` generating clean JavaScript output in `dist/`.

---

## Secrets & Environment Configuration

The application follows the **12-Factor App** methodology by strictly separating code from runtime configuration.

### Configuration vs Secrets

```text
Runtime Configuration (Non-sensitive)
├── NODE_ENV (development | test | production)
├── PORT (injected dynamically or fallback 4000)
├── ACCESS_TOKEN_EXPIRES (e.g., 15m)
└── REFRESH_TOKEN_EXPIRES (e.g., 30d)

Sensitive Secrets (Strictly protected)
├── DATABASE_URL (postgresql://user:pass@host:port/dbname)
├── ACCESS_TOKEN_SECRET (Cryptographically random 256-bit key)
└── REFRESH_TOKEN_SECRET (Cryptographically random 256-bit key)
```

### Environment Matrix

| Environment            | Configuration Source                              | Database Target                             | Secret Isolation                |
| :--------------------- | :------------------------------------------------ | :------------------------------------------ | :------------------------------ |
| **Local Development**  | `backend/.env`                                    | Local Docker PostgreSQL (`localhost:5434`)  | Development mock secrets        |
| **CI Automated Tests** | `backend/.env.test`                               | CI Service Container (`postgres:17-alpine`) | Test-only ephemeral secrets     |
| **Production Cloud**   | Platform Secret Store (Render / Railway / Fly.io) | Managed Cloud PostgreSQL                    | High-entropy production secrets |

### Production Database Connection

The production backend receives its database connection through the standard `DATABASE_URL` environment variable:

```text
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?sslmode=require
```

This standard connection string allows the application to connect to PostgreSQL without hardcoding credentials, hostnames, or ports into the codebase.

### Fail-Fast Configuration Validation

Runtime environment variables are validated immediately on application startup using Zod in `src/config/env.ts`:

```text
Application Startup (node dist/server.js)
        ↓
Load Environment Variables (process.env)
        ↓
Zod Schema Validation (envSchema.safeParse)
        ↓
┌───────────────────────┴───────────────────────┐
│ Valid                                         │ Invalid
▼                                               ▼
Initialize PostgreSQL Pool & Express            Log formatted missing keys & exit(1)
```

This prevents the server from starting in an undefined or insecure state.

---

## Production Cloud Deployment

Modern cloud container platforms (such as Render, Railway, Fly.io, Google Cloud Run, and AWS App Runner) deploy the backend API using the repository's existing multi-stage `backend/Dockerfile`.

The production deployment connects the GitHub repository, Docker build, managed PostgreSQL service, runtime environment variables, health checks, and ingress networking into a reliable continuous delivery workflow.

### Monorepo Build Context

The backend codebase is located in `/backend`. Cloud hosting platforms configure the root directory and build context to:

```text
Root Directory: /backend
Docker Context: ./backend
Dockerfile: Dockerfile
```

```text
backend/
├── Dockerfile              # Multi-stage container definition
├── package.json            # Node.js manifest & dependencies
├── pnpm-lock.yaml          # Deterministic lockfile
├── tsconfig.build.json     # Production build configuration
├── database/               # Relational SQL schema migrations
└── src/                    # Application source code
```

### Multi-Stage Container Build

The container image is built using the optimized multi-stage `backend/Dockerfile`:

```text
[Stage 1: Builder]
├── Base: node:24-alpine
├── Install: Corepack + pnpm
├── Action: pnpm install --frozen-lockfile
└── Build: pnpm build (compiles TS -> dist/)

[Stage 2: Production Runtime]
├── Base: node:24-alpine
├── Utilities: apk add --no-cache wget (for health checks)
├── Install: pnpm install --prod --frozen-lockfile
├── Artifacts: COPY --from=builder /app/dist ./dist
├── Security: USER node (non-root unprivileged execution)
└── Startup: CMD ["node", "dist/server.js"]
```

### Decoupled Schema Migration Execution

To support zero-downtime rolling updates and multi-instance scaling, database schema migrations are decoupled from HTTP server startup:

- **CI Verification**: Migrations are verified against a fresh container using `pnpm migrate:test`.
- **Production Release**: Migrations are executed via pre-deploy release commands or deployment hooks (`pnpm migrate`), ensuring schema changes complete before new container instances receive HTTP traffic.

### Dynamic Port Binding & Ingress

Cloud platforms assign dynamic container ports at runtime via the `PORT` environment variable.

The backend resolves the port dynamically and binds explicitly to `0.0.0.0`:

```ts
const PORT = Number(process.env.PORT ?? 4000);
const HOST = "0.0.0.0";

app.listen(PORT, HOST, () => {
  logger.info(`Server listening on ${HOST}:${PORT}`);
});
```

This ensures the container accepts traffic forwarded by cloud load balancers and reverse proxies (handling TLS termination and HTTPS redirection at the edge).

```text
Public Client (HTTPS:443)
        ↓
Cloud Edge / Reverse Proxy (SSL Termination)
        ↓
Backend Container (Host: 0.0.0.0, Port: $PORT, USER: node)
        ↓
Express API Router (/api/v1/*)
```

---

## Post-Deployment Verification & Smoke Tests

Deployment verification ensures that the newly deployed container is fully operational, connected to the database, and responding correctly to external requests.

### Smoke-Test Sequence

```text
Step 1: Container Startup & Log Review
        ↓
Step 2: GET /api/v1/health (HTTP 200 + database: connected)
        ↓
Step 3: POST /api/v1/auth/login (JWT token issuance)
        ↓
Step 4: GET /api/v1/profile (Authenticated protected request)
        ↓
Step 5: Database-Backed Query (Tenant isolation validation)
        ↓
Verification Complete: Healthy Active Deployment
```

### 1. Health Endpoint Probe

The primary health check verifies application uptime and active PostgreSQL connectivity:

```http
GET /api/v1/health HTTP/1.1
Host: api.yourdomain.com
```

**Healthy Response (HTTP 200 OK)**:

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 248.5,
  "environment": "production"
}
```

If PostgreSQL connectivity fails, the endpoint returns **HTTP 503 Service Unavailable** with `"database": "disconnected"`, allowing platform load balancers to withhold traffic.

### 2. Authentication Smoke Test

Verify that user authentication, password verification (argon2), and JWT token signing are functioning correctly:

```http
POST /api/v1/auth/login HTTP/1.1
Host: api.yourdomain.com
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "SecurePassword123!"
}
```

**Expected Response**: HTTP `200 OK` containing `accessToken` and setting the secure `refreshToken` HTTP-only cookie.

### 3. Protected Endpoint & Tenant Isolation Probe

Using the access token from step 2, query a tenant-scoped resource:

```http
GET /api/v1/departments HTTP/1.1
Host: api.yourdomain.com
Authorization: Bearer <access_token>
```

**Expected Response**: HTTP `200 OK` returning only departments belonging to the authenticated tenant.

### Production Verification Checklist

```text
✅ Cloud deployment rollout status: ACTIVE
✅ Container logs: Clean startup with 0 unhandled exceptions
✅ Server bind: Successfully listening on 0.0.0.0:$PORT
✅ Health endpoint: GET /api/v1/health returns HTTP 200 OK
✅ Database status: Reports "database": "connected"
✅ Authentication: Login returns valid JWT access token
✅ Tenant isolation: Protected queries return scoped data
✅ Container security: Verified running as unprivileged USER node
```

---

## CI/CD Troubleshooting & Triage

When a pipeline or deployment failure occurs, follow this systematic triage hierarchy to isolate the root cause:

```text
Failure Occurs
      ↓
Identify Failing Layer:
  ├── [Source / Lint]     → ESLint or TypeScript compile error
  ├── [Database / Schema] → Migration syntax error or connection timeout
  ├── [Domain Tests]      → Assertion failure or tenant scoping regression
  ├── [Docker Build]      → Missing dependency or context path mismatch
  ├── [Deployment]        → Missing production environment variable
  ├── [Runtime]           → Port binding or unhandled exception
  └── [Networking]        → 502 Bad Gateway / Ingress DNS failure
      ↓
Reproduce locally at the narrowest layer
      ↓
Apply targeted fix and re-verify
```

### Common Failure Scenarios & Resolutions

#### 1. TypeScript Build or TypeCheck Failure

- **Symptom**: CI Step `pnpm tsc --noEmit` fails with `TS2322` or `TS2345`.
- **Diagnosis**: Compile-time type mismatch or missing interface property.
- **Resolution**: Run `pnpm tsc --noEmit` locally. Fix the type error without using `any` or `@ts-ignore`.

#### 2. Test Migration Process Hanging in CI

- **Symptom**: CI migration step completes all 9 migrations but fails to exit (timeout).
- **Diagnosis**: Open event loop handles or asynchronous logging transports (such as `pino-pretty`) keeping the process open in non-TTY CI environments.
- **Resolution**: Ensure `pino-pretty` is disabled in test/CI environments (`NODE_ENV=test`) and explicitly terminate database pools after migration runs.

#### 3. Docker Container Missing Compiled Artifacts

- **Symptom**: Container crashes on startup with `Cannot find module '/app/dist/server.js'`.
- **Diagnosis**: Incorrect monorepo root directory or Docker build context omitting `backend/src`.
- **Resolution**: Verify root directory is configured as `/backend` and `backend/Dockerfile` copies the compiled `dist/` directory from the builder stage.

#### 4. Missing Production Environment Variables

- **Symptom**: Container startup fails immediately with `Environment validation error`.
- **Diagnosis**: Required variables (e.g. `DATABASE_URL`, `ACCESS_TOKEN_SECRET`) are missing in the cloud dashboard.
- **Resolution**: Configure missing secrets in the platform environment console.

#### 5. 502 Bad Gateway / Connection Refused

- **Symptom**: Public URL returns `502 Bad Gateway` while container logs show server running.
- **Diagnosis**: Application listening on `localhost` (`127.0.0.1`) instead of `0.0.0.0`, or listening on a hardcoded port rather than `process.env.PORT`.
- **Resolution**: Bind Express explicitly to `0.0.0.0` and use `process.env.PORT ?? 4000`.

---

## CI/CD Maintenance & Operations

The CI/CD pipeline is production infrastructure and requires regular operational maintenance.

### Maintenance Checklist

- **Runtime & Tooling Updates**:
  - Keep Node.js (`v24.x`), pnpm (`v11.9.0`), and Alpine base images updated with the latest security patches.
  - Review third-party GitHub Actions (`actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-artifact@v4`).
- **Secret Rotation**:
  - Periodically rotate JWT signing secrets (`ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`) and database credentials in platform settings.
- **Documentation Synchronization**:
  - When test commands change, update [`05-testing-strategy.md`](./05-testing-strategy.md).
  - When container configurations change, update [`06-docker-guide.md`](./06-docker-guide.md).
  - When CI gates or promotion steps change, update this document ([`07-ci-cd-pipeline.md`](./07-ci-cd-pipeline.md)).

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
| **07 — CI/CD Pipeline** _(this document)_               | GitHub Actions CI, 5-layer quality gates, and cloud deployment   |
| [08 — Deployment Guide](./08-deployment-guide.md)       | Production cloud deployment, database hosting, and monitoring    |
| [09 — Development Roadmap](./09-development-roadmap.md) | Development phases, completed milestones, and future work        |
| [10 — Future Enhancements](./10-future-enhancements.md) | Enterprise roadmap, Redis caching, microservices, and AI         |
