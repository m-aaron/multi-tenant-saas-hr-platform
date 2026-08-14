> **Multi-Tenant SaaS HR Platform Documentation**
>
> [01 Project Overview](./01-project-overview.md) • [02 System Architecture](./02-system-architecture.md) • [03 Database Design](./03-database-design.md) • [04 API Reference](./04-api-reference.md) • [05 Testing Strategy](./05-testing-strategy.md) • **[06 Docker Guide](./06-docker-guide.md)** • [07 CI/CD Pipeline](./07-ci-cd-pipeline.md) • [08 Deployment Guide](./08-deployment-guide.md) • [09 Development Roadmap](./09-development-roadmap.md) • [10 Future Enhancements](./10-future-enhancements.md)

---

# Docker Overview

Docker provides the container runtime used to create a consistent environment for the backend application and its local infrastructure.

In this project, Docker is primarily used for two purposes:

1. Running the backend and PostgreSQL locally in isolated containers.
2. Building the backend into a production-ready container image for deployment.

---

## Table of Contents

- [Docker's Role in the Project](#dockers-role-in-the-project)
- [Dockerfile Architecture](#dockerfile-architecture)
- [Multi-Stage Build](#multi-stage-build)
- [Docker Compose](#docker-compose)
- [Local Development Workflow](#local-development-workflow)
- [Environment Configuration](#environment-configuration)
- [PostgreSQL Container](#postgresql-container)
- [Backend Container](#backend-container)
- [Docker Security](#docker-security)
- [Docker Troubleshooting](#docker-troubleshooting)
- [Production Cloud Deployment](#production-cloud-deployment)
- [Document Index](#document-index)

---

## Docker's Role in the Project

The application repository contains the backend source code, while Docker provides the environment in which that application runs.

The local architecture is:

```text
Docker Compose
    │
    ├── Backend Container
    │
    └── PostgreSQL Container
```

The backend communicates with PostgreSQL through the containerized environment rather than requiring PostgreSQL to be installed directly on the developer's machine.

## Environment Separation

Docker is part of a larger environment strategy:

```text
Local Development
    ↓
Docker + PostgreSQL

Automated Testing
    ↓
Dedicated Test PostgreSQL

Production
    ↓
Cloud Hosting (e.g., Render, Railway) + Managed PostgreSQL
```

Docker therefore does not replace the application's environment configuration. It provides the runtime environment while database credentials, ports, and other environment-specific values remain configurable.

## Application Container

The backend is containerized from:

```text
backend/Dockerfile
```

The Docker image contains the compiled Node.js application and the dependencies required to run it.

The container is designed to run the production version of the backend rather than the TypeScript development workflow.

## Database Container

For local development, PostgreSQL runs as a separate container.

The local database image is:

```text
postgres:16-alpine
```

Keeping PostgreSQL in its own container provides a consistent database environment without coupling the database lifecycle to the backend process.

## Container Communication

The backend and PostgreSQL containers communicate through the Docker environment.

The backend does not treat the PostgreSQL container as `localhost`. Instead, the database is reached through the Docker networking configuration defined by Docker Compose.

This allows the same application architecture to be reproduced consistently across local environments.

## Local Docker Command

The main local Docker command is:

```bash
docker compose up --build
```

This builds the required images and starts the defined services.

It is primarily used to verify that the complete containerized development environment can start successfully.

## Production Relationship

The backend Dockerfile is also used as the basis for production cloud container deployments (e.g., Render, Railway, Fly.io).

The production flow is:

```text
GitHub
   ↓
Cloud Platform (Render / Railway)
   ↓
Docker build
   ↓
Production container
```

This reduces the difference between the containerized application verified locally and the containerized application running in production.

## Docker's Responsibility

Docker is responsible for:

- Packaging the application runtime.
- Providing isolated local infrastructure.
- Creating reproducible application images.
- Defining the container runtime environment.

Docker is not responsible for:

- Application business logic.
- Database schema design.
- Authentication rules.
- API contracts.
- Environment secret management.

Those concerns remain part of the application and infrastructure configuration layers.

---

## Dockerfile Architecture

The backend Dockerfile defines how the application is transformed from source code into a runnable container image.

The file is located at:

```text
backend/Dockerfile
```

Its structure is divided into two functional areas:

```text
Build
  ↓
Runtime
```

The Dockerfile therefore describes both how the application is compiled and what the final container needs in order to run it.

### Build Configuration

The Dockerfile uses:

```dockerfile
FROM node:24-alpine
```

as the base runtime image.

The application working directory is:

```text
/app
```

The Docker build enables pnpm through Corepack so that the container uses the project's package manager.

### Dependency Installation

The dependency manifests are copied before the rest of the source:

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

Dependencies are then installed using the committed lockfile:

```bash
pnpm install --frozen-lockfile
```

This makes the Docker build follow the dependency versions defined by the repository.

### Source and Compilation

After dependency installation, the application source is copied into the build context.

The TypeScript project is then compiled using:

```bash
pnpm build
```

The resulting production artifacts are generated under:

```text
dist/
```

The Dockerfile therefore produces a compiled application before the runtime container is started.

### Runtime Configuration

The production stage configures:

```text
NODE_ENV=production
```

and installs only the dependencies required at runtime.

The compiled application is copied into the final image and becomes the application that Node.js executes.

### Runtime User

The production container switches to:

```text
USER node
```

before the application starts.

This ensures that the backend does not normally run as the root user.

### Health Check

The Dockerfile defines a container health check against:

```text
/api/v1/health
```

The health endpoint is used because it verifies more than process existence: the application's health implementation also checks database connectivity.

### Shutdown Behavior

The container specifies:

```text
STOPSIGNAL SIGTERM
```

to provide the application with a standard termination signal during container shutdown.

### Runtime Startup

The container image specifies the application entry point:

```dockerfile
CMD ["node", "dist/server.js"]
```

The runtime container executes the compiled Express server directly. Schema migrations are managed separately through the migration system (`pnpm migrate` / `pnpm migrate:test`) or via pre-deployment release commands before the application container accepts traffic.

This separation of concerns ensures that the HTTP server entry point remains independent of migration execution.

### Build Context

The Dockerfile is written for the backend directory to be the build context.

The repository structure is:

```text
multi-tenant-saas-hr-platform/
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── database/
    └── src/
```

Therefore cloud deployment platforms configure:

```text
Root Directory: /backend (or Docker context: ./backend)
```

so that the Dockerfile's relative paths resolve against the backend application.

### Dockerfile Responsibility

The Dockerfile defines:

- Base image
- Working directory
- Dependency installation
- Application compilation
- Runtime environment
- Runtime dependencies
- Runtime user
- Health check
- Shutdown signal
- Container startup sequence

It does not define the application itself; it defines how the application is packaged and executed.

---

## Multi-Stage Build

The backend Dockerfile uses a multi-stage build to separate **application compilation** from **application execution**.

The two stages are:

```text
builder
   ↓
production
```

Each stage has a different responsibility.

### Builder Stage

The `builder` stage contains everything required to compile the application.

Its responsibilities are:

```text
Install complete dependencies
        ↓
Load TypeScript source
        ↓
Run build
        ↓
Produce dist/
```

The builder can therefore contain development dependencies and build tooling that are unnecessary at runtime.

### Production Stage

The `production` stage starts from a fresh Node.js image.

It contains only what is required to run the compiled backend:

```text
Production dependencies
        +
Compiled dist/
        +
Runtime configuration
```

The production stage does not need the complete development toolchain used by the builder.

### Artifact Handoff

The key interaction between the stages is the compiled application artifact:

```text
Builder
/app/dist
    │
    │ COPY --from=builder
    ▼
Production
/app/dist
```

This allows the production image to execute the result of the build without performing TypeScript compilation during container startup.

### Why Separate the Stages?

The separation provides a clear boundary:

```text
Builder
→ "How do we create the application?"

Production
→ "What does the application need to run?"
```

This avoids mixing build concerns with runtime concerns.

### Dependency Separation

The builder installs the full dependency set:

```bash
pnpm install --frozen-lockfile
```

The production stage installs only production dependencies and adds `wget` to support the container health check:

```dockerfile
RUN pnpm install --prod --frozen-lockfile \
    && apk add --no-cache wget
```

This ensures development-only packages are excluded while minimal operational utilities like `wget` are available in the Alpine runtime for `HEALTHCHECK` execution.

### Runtime Image Focus

The final image is intentionally focused on runtime execution.

Its important components are:

```text
Node.js runtime
Production dependencies
Compiled application
Runtime configuration
```

The builder's temporary compilation environment is not required after the compiled artifact has been transferred.

### Security Benefit

Separating the build and runtime stages also reduces the amount of tooling present in the production image.

Combined with:

```text
USER node
```

the final container has a smaller and more restricted runtime surface than a single-stage image containing the entire development environment.

### Cache Efficiency

Dependency manifests are copied before application source code.

This gives Docker an opportunity to reuse the dependency-installation layer when only source files change.

Conceptually:

```text
package manifests unchanged
        ↓
reuse dependency layer

source changed
        ↓
rebuild application
```

This can reduce build time during repeated local and CI builds.

### Production Principle

The multi-stage approach follows a simple principle:

> Build with everything you need; run with only what you need.

The builder is optimized for compilation.

The production stage is optimized for execution.

### Relationship to Production Deployments

Modern cloud platforms (such as Render, Railway, Fly.io, AWS App Runner, Google Cloud Run) build and deploy the backend using the same Dockerfile configuration.

When configured with:

```text
Root Directory: /backend
```

the Docker build receives the backend directory as its context.

The same multi-stage process therefore produces the production image used across production container environments.

### What Belongs in Each Stage

| Concern                  |             Builder |   Production |
| ------------------------ | ------------------: | -----------: |
| Node.js runtime          |                  ✅ |           ✅ |
| pnpm                     |                  ✅ |           ✅ |
| Development dependencies |                  ✅ |           ❌ |
| Build tooling            |                  ✅ |           ❌ |
| TypeScript source        |                  ✅ | Not required |
| Compiled `dist/`         |                  ✅ |           ✅ |
| Application runtime      | Not primary purpose |           ✅ |

This separation should be maintained when the Dockerfile evolves.

A dependency required only to compile the application belongs in the builder environment. A dependency required by the running API must be available in the production environment.

---

## Docker Compose

Docker Compose is used to define and run the local containerized environment required by the backend.

Instead of starting each container independently, Compose allows the project's related services to be described as one application environment.

### Purpose

In this project, Docker Compose is primarily used to provide the local infrastructure required by the backend, particularly the application and PostgreSQL database.

The resulting local environment can be represented as:

```text
Docker Compose
    │
    ├── Backend
    │
    └── PostgreSQL
```

The backend and database remain separate services while being managed through the same Compose environment.

### Service Separation

The backend application and PostgreSQL database run as separate containers.

This separation provides clearer responsibility boundaries:

```text
Backend Container
    ↓
Node.js / Express application

PostgreSQL Container
    ↓
Database persistence
```

The backend does not package PostgreSQL inside its own image.

Instead, the application connects to the separate PostgreSQL service through the container network.

### Container Networking

Docker Compose creates a network through which the defined services can communicate.

Within the Compose environment, services should communicate using their Compose service identity rather than assuming that the host machine's `localhost` refers to another container.

Conceptually:

```text
Backend container
      │
      │ database connection
      ▼
PostgreSQL service
```

This is different from local host-based development, where an application may connect through a mapped host port.

### Port Mapping

Docker Compose can expose container ports to the host machine through port mappings.

This allows developers to access services from the host while containers continue communicating through the Docker network internally.

The distinction is:

```text
Host
   ↓
Mapped Port
   ↓
Container Port
```

A host port and a container port do not have to be identical.

This distinction is important when debugging local connectivity.

### Environment Configuration

Compose works together with the project's environment configuration.

The container environment should receive the values required by the backend without hard-coding environment-specific credentials into the image.

The general model is:

```text
Docker Compose
      ↓
Environment values
      ↓
Backend container
      ↓
Application configuration
```

Local Docker configuration should remain separate from:

- Test environment configuration
- CI configuration
- Production cloud environment configuration

### PostgreSQL Dependency

The PostgreSQL container provides the database dependency required by the backend.

The backend therefore depends on PostgreSQL being available before database-dependent application behavior can work correctly.

The overall local relationship is:

```text
PostgreSQL starts
      ↓
Database becomes available
      ↓
Backend connects
      ↓
Application becomes operational
```

Container startup order alone does not guarantee that a database is immediately ready to accept connections. Application startup and database readiness are therefore separate concerns.

### Volumes and Data Persistence

If a Compose PostgreSQL service uses a named volume, the database files can survive container recreation.

The conceptual relationship is:

```text
PostgreSQL Container
        │
        ▼
Persistent Volume
```

This allows local development data to survive operations such as stopping and recreating containers.

The exact volume configuration should remain defined by the project's Compose file.

### Build Integration

Docker Compose can build the backend image using the project's Dockerfile.

The common local command is:

```bash
docker compose up --build
```

The `--build` option ensures that the backend image is rebuilt before the services are started when the image needs to reflect source or Dockerfile changes.

Without rebuilding, Docker may continue using an existing image instead of the latest application image.

### Starting the Environment

The standard local workflow is:

```bash
docker compose up
```

When a rebuild is required:

```bash
docker compose up --build
```

The background form may also be used when the developer wants the environment to continue running without occupying the current terminal:

```bash
docker compose up -d
```

### Stopping the Environment

To stop the Compose environment:

```bash
docker compose down
```

This stops and removes the Compose-managed containers.

Whether database data also disappears depends on how persistent volumes are configured and whether those volumes are explicitly removed.

### Viewing Logs

Compose provides centralized access to service logs.

For the entire environment:

```bash
docker compose logs
```

For a specific service:

```bash
docker compose logs <service>
```

For continuously following logs:

```bash
docker compose logs -f
```

This is useful when diagnosing:

- Application startup failures
- Database startup failures
- Connection problems
- Environment configuration issues
- Container restarts

### Inspecting Running Services

The active Compose services can be inspected with:

```bash
docker compose ps
```

This helps verify:

- Which containers are running
- Which ports are mapped
- Whether a service has exited
- Whether the expected services are present

### Rebuilding After Changes

Not every source-code change requires a complete Docker rebuild during rapid local development, depending on the development configuration.

However, a rebuild should be performed when changes affect:

- Dockerfile instructions
- Dependency manifests
- Lockfiles
- Runtime image configuration
- Build configuration
- Files included in the production image

The recommended verification command for production-like container behavior is:

```bash
docker compose up --build
```

### Compose and Database Migrations

Docker Compose provides the infrastructure in which the backend can connect to PostgreSQL, while the application's migration system remains responsible for schema changes.

The responsibilities are therefore separate:

```text
Docker Compose
    ↓
Starts PostgreSQL

Migration System
    ↓
Creates / updates database schema
```

Compose does not replace the migration system.

### Local Environment vs Production

Docker Compose is primarily a local infrastructure tool in the current project.

Production deployment uses managed cloud services and the backend Docker image.

The environments can therefore be represented as:

```text
Local
    ↓
Docker Compose
    ├── Backend
    └── PostgreSQL

Production
    ↓
Cloud Platform (Render / Railway)
    ├── Backend
    └── Managed PostgreSQL
```

The application remains the same logical backend while the infrastructure and environment-specific configuration differ.

### Troubleshooting Compose

When the local environment fails, investigate the failure at the service level.

Useful commands include:

```bash
docker compose ps
docker compose logs
docker compose logs <service>
docker compose up --build
```

The first question should be whether the problem originates from:

```text
Container build
    or
Container startup
    or
Network connectivity
    or
Database readiness
    or
Application configuration
```

This keeps Compose troubleshooting separate from application-code debugging.

### Compose Principle

The main principle is:

> **Note**: Docker Compose defines the local multi-container environment; each service remains responsible for its own runtime behavior.

This keeps the backend and PostgreSQL responsibilities separate while providing a reproducible environment for local development and verification.

---

## Local Development Workflow

Docker is used during local development to provide a consistent backend and PostgreSQL environment.

The local workflow is centered around starting the required containers, inspecting their state, reviewing logs, rebuilding when necessary, and shutting the environment down cleanly.

### Starting the Environment

The standard command for starting the Docker environment is:

```bash
docker compose up
```

This starts the services defined by the project's Compose configuration.

When the backend image needs to be rebuilt, use:

```bash
docker compose up --build
```

This is particularly useful after changes to:

- `Dockerfile`
- Dependency manifests
- Lockfiles
- Runtime image configuration
- Build configuration
- Files that affect the production image

### Running in the Background

During normal development, the environment can be started in detached mode:

```bash
docker compose up -d
```

This allows the containers to continue running while the developer uses the current terminal for other commands.

The running services can then be inspected with:

```bash
docker compose ps
```

### Checking Service Status

Use:

```bash
docker compose ps
```

to determine whether the expected services are running.

This is the first command to use when the local application is unexpectedly unavailable.

The output can help distinguish between:

```text
Service is running
Service has exited
Service is restarting
Service is not present
```

### Viewing Logs

To view logs from all Compose services:

```bash
docker compose logs
```

To continuously follow logs:

```bash
docker compose logs -f
```

A specific service can also be inspected:

```bash
docker compose logs -f <service>
```

This is useful for identifying:

- Backend startup errors
- PostgreSQL startup errors
- Database connection failures
- Environment configuration problems
- Container restart loops

### Rebuilding the Backend

A rebuild is useful when the currently running image does not contain the latest application or configuration changes.

The standard command is:

```bash
docker compose up --build
```

For a more targeted workflow, the backend service can be rebuilt through Compose when the project configuration supports service-specific builds.

The important distinction is:

```text
Source change
    ↓
Existing image
    ↓
May still contain old application
```

versus:

```text
Source change
    ↓
docker compose up --build
    ↓
New image
    ↓
Updated container
```

### Recreating Containers

When configuration changes are not reflected in an existing container, recreating the service may be necessary.

Compose can recreate the environment as part of:

```bash
docker compose up --build
```

The goal is to ensure that the running containers actually reflect the current configuration.

## Stopping the Environment

To stop the running Compose environment:

```bash
docker compose down
```

This stops and removes the Compose-managed containers.

Whether database data remains available after this operation depends on the project's PostgreSQL volume configuration.

### Restarting the Environment

For a quick restart of the local environment:

```bash
docker compose restart
```

This is useful when the container configuration has not changed but a service process needs to be restarted.

A full rebuild should be preferred when the underlying image itself needs to change.

## Local Health Verification

Once the services are running, verify the backend through its health endpoint:

```text
GET /api/v1/health
```

The health endpoint checks the database connection in addition to reporting application health.

A healthy local environment should therefore demonstrate:

```text
Docker container running
        ↓
Express server running
        ↓
PostgreSQL reachable
        ↓
Health endpoint reports healthy
```

### Application Development vs Container Verification

The project has two related but distinct local workflows.

#### Normal application development

For rapid code changes, developers may work directly with the Node.js development environment when appropriate.

This provides faster feedback for ordinary source-code changes.

#### Container verification

Docker should be used when verifying:

- Dockerfile changes
- Production dependency behavior
- Container startup
- Runtime environment
- PostgreSQL container communication
- Production-like application behavior

The distinction is:

```text
Fast development loop
→ direct application development

Production-like verification
→ Docker
```

### Database Migrations

Docker provides the PostgreSQL runtime, while the migration system manages the database schema.

When database schema changes are being developed, migrations should be verified separately.

The test database workflow uses:

```bash
pnpm migrate:test
```

This is not replaced by Docker Compose.

The responsibilities remain:

```text
Docker
→ provides PostgreSQL

Migration system
→ manages schema
```

### Typical Development Cycle

A typical Docker-assisted development cycle is:

```text
1. Start environment
   ↓
docker compose up -d

2. Check services
   ↓
docker compose ps

3. Review logs if necessary
   ↓
docker compose logs -f

4. Make application changes
   ↓
5. Rebuild when required
   ↓
docker compose up --build

6. Verify health
   ↓
GET /api/v1/health

7. Stop when finished
   ↓
docker compose down
```

### When to Rebuild

A rebuild is generally appropriate when the change affects the image itself.

Examples include:

```text
Dockerfile changes
Dependency changes
Lockfile changes
Production build changes
Runtime configuration changes
```

A rebuild is not necessarily required for every source-code edit if the active development setup already provides a suitable hot-reload workflow.

The goal is to avoid unnecessary rebuilds while still ensuring that production-like verification uses a current image.

### Troubleshooting Workflow

When the backend does not work locally, use a progressively deeper investigation:

```text
docker compose ps
        ↓
Are containers running?
        ↓
docker compose logs
        ↓
Did the application start?
        ↓
Is PostgreSQL available?
        ↓
Is the backend configured correctly?
        ↓
GET /api/v1/health
        ↓
Is the API operational?
```

This prevents immediately changing application code when the actual problem may be a stopped container, stale image, or database startup issue.

### Cleanup

After development work is complete:

```bash
docker compose down
```

should normally be sufficient to stop the local container environment.

Persistent database volumes should only be removed when intentionally resetting the local database state.

Any destructive cleanup operation should therefore be performed deliberately rather than as part of the normal development cycle.

### Local Workflow Principle

The local Docker workflow should provide a predictable progression:

```text
Start
  ↓
Inspect
  ↓
Develop
  ↓
Rebuild when necessary
  ↓
Verify
  ↓
Stop
```

Docker is therefore treated as a repeatable development and verification environment rather than a set of commands that developers execute without understanding the state of the containers.

---

## Environment Configuration

The backend uses environment variables to separate application configuration from application code.

This allows the same application code to run across local development, automated testing, Docker, and production without hard-coding environment-specific values.

### Configuration Principle

The application should read environment-specific values from configuration rather than embedding them directly in source code.

The general model is:

```text
Environment
    ↓
Environment Variables
    ↓
Centralized Configuration
    ↓
Application
```

This keeps deployment-specific information outside the business logic.

### Environment Separation

The project uses different configuration sources for different environments:

```text
Development
    ↓
.env

Testing
    ↓
.env.test

Docker / Local Infrastructure
    ↓
Docker-provided environment

Production
    ↓
Cloud environment variables (Render / Railway)
```

Each environment can therefore provide different database connections, secrets, and runtime settings without changing the application implementation.

### Centralized Configuration

The backend centralizes environment access through its configuration module rather than reading environment variables throughout the application.

Application code can therefore consume typed configuration values rather than repeatedly accessing:

```text
process.env
```

throughout the codebase.

This provides a single place to define:

- Required variables
- Optional variables
- Default values
- Type conversions
- Environment-specific behavior
- Configuration validation

### Required Configuration

Required environment variables are validated during application initialization.

If a required variable is missing, the application should fail early rather than continue with invalid configuration.

This principle is demonstrated during deployment configuration when the application reports:

```text
Missing environment variable: DATABASE_HOST
```

The error occurred during configuration initialization before the application could operate normally.

Fail-fast configuration makes these deployment problems easier to identify.

### Database Configuration

The database configuration supports both environment-specific credentials and a database connection URL.

The preferred production approach uses:

```text
DATABASE_URL
```

In managed cloud platforms, the backend references the PostgreSQL service through the platform's environment variables (e.g. `DATABASE_URL`).

The application then creates its PostgreSQL connection pool using the provided connection string.

This avoids hard-coding production database hostnames, credentials, or ports into the source code.

### Legacy / Local Database Configuration

The configuration layer also supports individual database properties for environments where a full connection string is not used.

These values include:

```
DATABASE_HOST
DATABASE_PORT
DATABASE_NAME
DATABASE_USER
DATABASE_PASSWORD
```

The application can therefore support:

```text
DATABASE_URL
```

or a set of individual database parameters depending on the active environment configuration.

Production uses the platform-provided `DATABASE_URL`.

### JWT Configuration

Authentication relies on environment-specific token configuration.

The production backend currently requires:

```text
ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRES
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES
```

The production secrets are generated separately from local development values.

For example:

```text
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
```

The actual token secrets must never be committed to source control.

### Secret Management

Sensitive values should be provided through the runtime environment rather than stored directly in the repository.

Sensitive configuration includes:

- JWT signing secrets
- Database credentials
- Production connection strings
- Other authentication or infrastructure secrets

The repository may contain example configuration files such as:

```text
.env.example
.env.docker.example
.env.test.example
```

but these files should contain placeholders or non-sensitive example values rather than real production credentials.

### Docker Environment

Docker containers receive their environment through the Docker/Compose configuration.

The application should not assume that a value available on the developer's host automatically exists inside the container.

The effective configuration boundary is:

```text
Host Environment
      ↓
Docker / Compose
      ↓
Container Environment
      ↓
Node.js Application
```

This distinction is particularly important when troubleshooting database and port configuration.

### Local Development

Local development typically uses:

```text
.env
```

for development-specific values.

The local application can use a development PostgreSQL database and the local runtime port while preserving the same application configuration structure used in production.

For example:

```text
Local
DATABASE → local PostgreSQL
PORT     → 4000 fallback
NODE_ENV → development
```

### Test Environment

Automated tests use:

```text
.env.test
```

with:

```text
NODE_ENV=test
```

This configuration points database-dependent tests toward the dedicated test database:

```text
hr_platform_test
```

Test secrets and credentials should remain isolated from both development and production credentials.

### Production Environment

Production configuration is provided by the cloud hosting platform.

The backend currently receives:

```text id="6ewqye"
DATABASE_URL
ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRES
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES
```

The cloud platform also supplies runtime environment values such as the application `PORT`.

The application therefore follows:

```text
Cloud Platform
    ↓
Environment Variables
    ↓
Centralized env configuration
    ↓
Express / PostgreSQL / JWT
```

### PORT Configuration

The application uses the platform-provided `PORT` when available and falls back to a local development port.

Conceptually:

```text
process.env.PORT ?? 4000
```

This creates the following behavior:

```text
Local
→ 4000 fallback

Production (Render / Railway / Cloud Run)
→ Platform-provided PORT
```

The HTTP server binds to:

```text
0.0.0.0
```

so the container can accept traffic through its available network interfaces.

The application should not hard-code a platform-specific production port.

### Environment Configuration and Builds

Build-time configuration and runtime configuration should be treated separately.

The Docker image contains the application and its runtime dependencies, while environment-specific secrets and deployment values are supplied when the container runs.

This allows the same image to be used with different runtime environments without embedding credentials into the image.

### Configuration Failure

A missing or invalid environment variable should normally cause early failure.

This is preferable to silently continuing with an invalid value because configuration errors are usually deployment or environment problems rather than recoverable application conditions.

Typical investigation questions include:

```text
Is the variable defined?
        ↓
Is it defined in the correct environment?
        ↓
Is it passed into the container?
        ↓
Is the configuration module reading it?
        ↓
Is the value valid?
```

### Environment Security Rules

Production secrets must:

- Never be committed to Git.
- Never be placed in Dockerfiles.
- Never be hard-coded in application source.
- Never be stored in public example files.
- Be managed by the deployment environment or an appropriate secret-management system.

Local and test credentials should also remain separate from production credentials.

### Environment Configuration Workflow

When a new configuration variable is introduced:

```text
1. Add the variable to centralized configuration
        ↓
2. Add appropriate example / test configuration
        ↓
3. Provide the value in local development
        ↓
4. Provide the value in CI if required
        ↓
5. Provide the production value in the cloud hosting platform
        ↓
6. Run application and deployment verification
```

A configuration change is incomplete when the application code expects a variable that the relevant environment does not provide.

### Configuration Principle

The central principle is:

> **Note**: Configuration belongs to the environment; application behavior belongs to the code.

Keeping that boundary clear allows the same backend application to run consistently across local Docker development, automated testing, CI, and cloud production.

---

## PostgreSQL Container

PostgreSQL runs as a dedicated Docker container during local development.

The database is intentionally separated from the backend container so that database infrastructure and application runtime remain independently manageable.

### PostgreSQL Image

The local database uses:

```text
postgres:16-alpine
```

This provides a PostgreSQL 16 runtime based on Alpine Linux.

The image is responsible only for the database server. The backend application and its Node.js runtime remain in a separate container.

### Container Responsibility

The PostgreSQL container is responsible for:

- Running the PostgreSQL server.
- Managing database connections.
- Persisting local database data when a persistent volume is configured.
- Executing SQL sent by the backend.
- Enforcing database-level constraints and relationships.

It is not responsible for:

- Running the Node.js application.
- Managing application migrations through application logic.
- Handling HTTP requests.
- Implementing authentication or authorization.

Those responsibilities belong to the backend application and its supporting infrastructure.

### Local Database Separation

The project maintains separate database environments:

```text
Local Development
    ↓
Docker PostgreSQL

Automated Testing
    ↓
hr_platform_test

Production
    ↓
Managed Cloud PostgreSQL
```

The local PostgreSQL container must therefore never be treated as the production database.

This separation makes it safe to experiment with schema changes and application data during development.

### Database Port

The local PostgreSQL container is exposed to the host through the configured Docker port mapping.

In the current development setup, PostgreSQL has been mapped to host port:

```text
5434
```

This allows local tools and scripts running on the host machine to connect to the containerized database.

Conceptually:

```text
Host
localhost:5434
      ↓
PostgreSQL Container
PostgreSQL:5432
```

The host port and the PostgreSQL container port are separate concepts.

The container continues to run PostgreSQL on its normal PostgreSQL port while the host uses the configured mapped port.

### Backend-to-Database Connection

When both backend and PostgreSQL run inside Docker Compose, the backend should communicate with PostgreSQL through the Docker network rather than through the host's published port.

The networking model is therefore:

```text
Backend Container
      │
      │ Docker network
      ▼
PostgreSQL Container
```

The published host port is primarily useful for host-based tools and local development access.

### Database Configuration

The backend database connection is supplied through environment-specific configuration.

For local Docker development, the application receives the database settings required to connect to the PostgreSQL container.

For production, the database target is different:

```text
Managed Cloud PostgreSQL
      ↓
DATABASE_URL
      ↓
Backend
```

The application database layer remains the same while the actual PostgreSQL target changes by environment.

### Database Persistence

Container lifecycle and database data lifecycle are separate concerns.

A PostgreSQL container can be stopped and recreated without necessarily discarding database data when persistent storage is configured.

The conceptual model is:

```text
PostgreSQL Container
        │
        ▼
Persistent Storage
        │
        ▼
Database Files
```

This allows local development data to survive normal container restarts and recreation, depending on the configured Compose volume behavior.

### Database Initialization

A fresh PostgreSQL container may start with an empty application database.

The application schema is not expected to appear merely because PostgreSQL has started.

Database structure is established through the project's migration system.

The separation is:

```text
PostgreSQL Container
    ↓
Provides empty / existing database

Migration Runner
    ↓
Creates and updates schema
```

This keeps infrastructure startup separate from application schema management.

### Migrations

The project's migration system manages schema changes through SQL migration files.

The test environment uses:

```bash
pnpm migrate:test
```

The same migration files are shared conceptually across environments while the target database changes through configuration.

This makes the PostgreSQL container an infrastructure dependency rather than the owner of schema-versioning logic.

### Database Health

The backend's health endpoint performs a lightweight database query:

```sql
SELECT 1
```

A successful query indicates that the application can communicate with PostgreSQL.

Therefore, a healthy backend environment requires both:

```text
Node.js process running
        +
PostgreSQL reachable
```

This relationship is especially useful when verifying the local Docker environment.

### Local Database Workflow

A typical local database workflow is:

```text
Start PostgreSQL container
        ↓
Confirm container is running
        ↓
Run migrations
        ↓
Application connects
        ↓
Run backend / tests
```

Useful commands include:

```bash
docker compose ps
```

to inspect service state, and:

```bash
docker compose logs <postgres-service>
```

to inspect PostgreSQL startup or connection problems.

### PostgreSQL Troubleshooting

When the backend cannot connect to PostgreSQL, investigate the connection in this order:

```text
Is PostgreSQL container running?
        ↓
Is PostgreSQL ready?
        ↓
Is the database configured correctly?
        ↓
Is the backend using the correct host?
        ↓
Is the correct port being used?
        ↓
Do the credentials match?
        ↓
Does the target database exist?
```

A common Docker networking mistake is using the host's mapped port from inside the backend container when the backend should instead use the PostgreSQL service's internal Docker-network address and container port.

### Local vs Test Database

The local development database and automated test database serve different purposes.

```text
Development
→ interactive application development

Test
→ automated verification
```

The test environment should not depend on arbitrary data left in the local development database.

This distinction keeps automated tests reproducible.

### Security Considerations

The local PostgreSQL container should use development-only credentials.

Production database credentials must not be copied into the local Docker configuration.

Likewise, local database ports and passwords should not be assumed to be suitable for production deployment.

Production uses a managed PostgreSQL service and its environment configuration instead.

### PostgreSQL Container Principle

The local PostgreSQL container follows a simple responsibility boundary:

> **Note**: Docker provides the database server; the application and migration system manage how the database is used.

This keeps PostgreSQL infrastructure, schema management, and application business logic separate while still allowing the complete backend environment to be reproduced locally.

---

## Backend Container

The backend container is the runtime environment for the Node.js and Express API.

It is responsible for running the compiled backend application, connecting to PostgreSQL, exposing the HTTP API, and participating in the application's health and deployment lifecycle.

### Backend Container Responsibility

The backend container is responsible for:

- Running the compiled Node.js application.
- Loading runtime configuration.
- Connecting to PostgreSQL.
- Executing the configured startup process.
- Exposing the HTTP API.
- Responding to the health endpoint.
- Handling application shutdown.

The PostgreSQL database remains a separate service.

### Runtime Application

The container runs the compiled application from the `dist` directory rather than executing the TypeScript source directly.

The runtime structure is conceptually:

```text
Backend Container
    │
    ├── Node.js runtime
    ├── Production dependencies
    └── dist/
          │
          ├── server.js
          ├── database/
          └── application modules
```

The TypeScript compilation step occurs during the image build rather than during normal container startup.

### Production Environment

The production container runs with:

```text
NODE_ENV=production
```

This allows the application configuration and supporting libraries to apply production-specific behavior.

Runtime secrets and deployment-specific configuration are supplied through the container environment rather than embedded in the image.

### Port Handling

The application uses the environment-provided `PORT` when available and falls back to the local development port:

```text
process.env.PORT ?? 4000
```

This results in:

```text
Local
→ 4000 fallback

Production (Render / Railway / Cloud Run)
→ Platform-provided PORT
```

The HTTP server explicitly binds to:

```text
0.0.0.0
```

This allows the Express server to accept connections through the container's available network interfaces.

The application should therefore not hard-code a platform-specific production port.

### Application Startup

The container starts the compiled backend application via:

```dockerfile
CMD ["node", "dist/server.js"]
```

The startup sequence initializes configuration, establishes the PostgreSQL connection pool, registers middleware, and starts listening on the configured port.

Database schema migrations are executed independently prior to application startup (e.g., via `pnpm migrate` during deployment setup or via automated CI verification).

### Database Connection

The backend connects to PostgreSQL through the application's centralized database configuration.

In production, the primary connection value is:

```text
DATABASE_URL
```

The backend service receives the database connection string directly through the hosting platform's environment variables.

The backend therefore does not need to know the production database hostname, password, or internal networking details directly.

### Health Endpoint

The backend exposes:

```text
GET /api/v1/health
```

The health check performs a lightweight PostgreSQL query and reports:

```text
Application health
+
Database connectivity
+
Process uptime
+
Environment
```

A healthy application returns HTTP `200`.

An unavailable database causes the health endpoint to return HTTP `503`.

### Production Networking

The backend container sits behind the cloud platform's public proxy / ingress layer in production.

The request path is:

```text
Internet
    ↓
Cloud Reverse Proxy
    ↓
Backend Container
    ↓
Express
```

Inside the container, Express listens on the environment-provided port and binds to `0.0.0.0`.

The production API is exposed through the configured deployment domain (example):

```text id="7d0nu6"
https://api.yourdomain.com (or platform domain e.g., https://your-app.onrender.com / https://your-app.up.railway.app)
```

> **Note**: The exact public domain is assigned by the deployment environment (e.g., platform-generated domain or custom domain).

### Local Runtime

The same backend container can be used during local Docker verification.

The local relationship is:

```text
Host
   ↓
Docker
   ↓
Backend Container
   ↓
PostgreSQL Container
```

The host interacts with the exposed application port, while the backend communicates with PostgreSQL through the Docker network.

### Non-Root Execution

The production container runs the backend as:

```text
USER node
```

rather than the root user.

This reduces unnecessary privileges available to the application process.

### Shutdown

The container uses:

```text
SIGTERM
```

as its configured shutdown signal.

This gives the Node.js process an opportunity to perform its normal shutdown behavior when the container is terminated or replaced.

### Backend Container Verification

A production-like container should be considered healthy only after the following conditions are satisfied:

```text
Image builds successfully
        ↓
Container starts
        ↓
Database migration succeeds
        ↓
Express server starts
        ↓
Health endpoint responds
        ↓
Database check succeeds
```

This verification is stronger than checking only whether the container process exists.

### Common Runtime Failure Categories

Backend container failures should be classified before changing the application.

#### Image Failure

The image cannot be built.

Typical causes include:

- Dependency installation failure
- TypeScript compilation failure
- Incorrect Docker build context
- Invalid Dockerfile instructions

#### Startup Failure

The image builds successfully but the container exits during startup.

Typical causes include:

- Missing environment variables
- Missing compiled files
- Migration failure
- Invalid runtime configuration

#### Networking Failure

The container is running but cannot be reached externally.

Typical causes include:

- Incorrect port configuration
- Incorrect bind address
- Public networking configuration
- Application not listening on the expected port

#### Database Failure

The backend starts but cannot communicate with PostgreSQL.

Typical causes include:

- Incorrect `DATABASE_URL`
- Database unavailable
- Incorrect Docker service networking
- Authentication failure
- Database schema problems

### Backend Container Principle

The backend container has a focused responsibility:

> **Note**: Package and run the compiled backend application in a predictable runtime environment.

The application remains responsible for business behavior, while Docker provides the runtime boundary and PostgreSQL remains an independent database service.

---

## Docker Security

The Docker configuration applies several security practices intended to reduce unnecessary privileges, limit the production image to required runtime components, and keep sensitive configuration outside the container image.

Docker security is treated as one layer of the overall application security model rather than as a replacement for application-level authentication, authorization, and database security.

### Non-Root Runtime

The production container explicitly switches to the built-in Node.js user:

```dockerfile
USER node
```

The backend therefore does not normally run as the root user.

Running application processes without root privileges reduces the impact of a potential application-level compromise because the process has fewer operating-system privileges available inside the container.

The principle is:

```text
Container
    ↓
Node.js application
    ↓
Non-root user
```

### Minimal Production Dependencies

The Dockerfile uses a multi-stage build and installs production dependencies separately in the final image:

```bash
pnpm install --prod --frozen-lockfile
```

Development-only dependencies and build tooling are therefore not intentionally included in the production dependency installation.

This reduces the amount of software present in the runtime environment and helps keep the production image focused on application execution.

### Multi-Stage Isolation

The builder and production stages have different responsibilities.

The builder contains:

- Full dependency set
- TypeScript source
- Build tooling
- Compilation environment

The production stage receives the compiled application and production dependencies.

Conceptually:

```text
Builder
   ↓
Compile application
   ↓
Compiled artifact
   ↓
Production image
```

This prevents the final runtime image from needing the complete development toolchain.

### Secrets Outside the Image

Sensitive configuration should be supplied through the runtime environment rather than embedded into the Dockerfile or application image.

Production values such as:

```text
DATABASE_URL
ACCESS_TOKEN_SECRET
REFRESH_TOKEN_SECRET
```

are provided by the cloud platform's environment configuration.

The Docker image therefore does not need to contain production credentials.

This separation is important because container images may be cached, inspected, or transferred independently of the runtime environment.

### Environment Example Files

The repository may contain environment example files such as:

```text
.env.example
.env.docker.example
.env.test.example
```

These files should contain example or placeholder values rather than actual production secrets.

Real production credentials belong in the deployment environment.

### Frozen Dependency Installation

The Docker build uses:

```bash
pnpm install --frozen-lockfile
```

This ensures that the container build follows the dependency versions recorded in the committed lockfile.

From a security and reproducibility perspective, this helps prevent an unexpected dependency graph from being introduced during the build.

The production stage uses the same locked dependency installation approach while limiting installation to production dependencies.

### Base Image

The backend uses:

```text
node:24-alpine
```

for the builder and production stages.

The Alpine-based image provides a relatively small base environment, reducing the amount of software included in the container compared with a much larger general-purpose image.

The project should still treat the base image as a maintained dependency and update it deliberately when security or runtime requirements change.

### Health Check

The production image defines a health check through the backend health endpoint.

The endpoint checks both application state and database connectivity.

This does not itself provide application security, but it improves operational safety by allowing the container/deployment platform to distinguish a healthy runtime from one that is not functioning correctly.

A failed health check should prevent unhealthy instances from being treated as fully operational by the deployment platform.

### Graceful Shutdown

The Dockerfile defines:

```text
STOPSIGNAL SIGTERM
```

This provides a standard shutdown signal to the application.

Graceful shutdown reduces the likelihood of terminating a process without allowing it to perform its expected cleanup behavior.

This is particularly relevant for services holding database connections or processing requests.

### Network Exposure

The container exposes the application service rather than the PostgreSQL database.

The backend is publicly reachable through the cloud ingress layer, while PostgreSQL is provided as a separate service.

The intended production boundary is:

```text
Internet
   ↓
Cloud Ingress / Reverse Proxy
   ↓
Backend API

Backend
   ↓
Private service-to-service connection
   ↓
PostgreSQL
```

The database should not be made publicly accessible merely because the backend is public.

### Port Configuration

The application uses the environment-provided `PORT` when available.

The application server binds to:

```text
0.0.0.0
```

This is a networking requirement for containerized deployment, not an authorization mechanism.

External accessibility remains controlled by the deployment platform's networking configuration.

### Dockerfile Security Boundaries

The Dockerfile itself should not contain:

- Production passwords
- JWT secrets
- Private API keys
- Database credentials
- Personal credentials

Instead, these values belong in the runtime configuration.

The Dockerfile should describe **how the application is packaged**, not store secrets required by the application.

### Security Responsibilities Outside Docker

Container security does not replace application security.

The backend still relies on other layers for:

- Authentication
- Authorization
- Tenant isolation
- Input validation
- Password hashing
- Session management
- JWT security
- Database constraints
- Audit logging

The security model is therefore layered:

```text
Container Security
        +
Application Security
        +
Database Security
        +
Deployment Security
```

### Docker Security Maintenance

When modifying the container configuration, review whether the change:

- Introduces a new runtime dependency.
- Requires root privileges.
- Adds sensitive configuration.
- Expands network exposure.
- Changes the production base image.
- Adds development tooling to the runtime image.
- Changes the application startup behavior.

Any security-sensitive Docker change should be verified locally and through CI before production deployment.

## Current Security Controls

The current Docker setup provides:

```text
✅ Non-root runtime user
✅ Production-only dependency installation
✅ Multi-stage build
✅ Locked dependency installation
✅ Runtime secrets supplied externally
✅ Health check
✅ SIGTERM shutdown signal
✅ Separate PostgreSQL service
```

These controls reduce unnecessary runtime exposure while keeping the application's security responsibilities in the appropriate application and infrastructure layers.

## Security Principle

The central Docker security principle is:

> **Note**: Keep the production container as minimal and unprivileged as practical, and keep sensitive configuration outside the image.

---

## Docker Troubleshooting

Docker problems should be investigated by first determining whether the failure occurs during image build, container startup, application initialization, database connectivity, or external networking.

The general troubleshooting flow is:

```text
Failure
   ↓
Build or Runtime?
   ↓
Inspect Docker / Container logs
   ↓
Identify first meaningful error
   ↓
Reproduce locally when possible
   ↓
Apply smallest appropriate fix
   ↓
Rebuild / restart
   ↓
Verify application health
```

### Build Failure vs Runtime Failure

The first distinction is whether the image failed to build or whether the image built successfully but the container failed afterward.

#### Build Failure

A build failure occurs before a runnable image is produced.

Typical causes include:

- Dependency installation failure
- TypeScript compilation failure
- Incorrect Docker build context
- Missing files
- Invalid Dockerfile instructions
- Lockfile incompatibility

Useful local commands include:

```bash
docker compose build
```

or:

```bash
docker compose up --build
```

### Runtime Failure

A runtime failure occurs after the image has been created.

Typical causes include:

- Missing environment variables
- Missing compiled files
- Database migration failure
- Invalid runtime configuration
- Application startup failure
- Incorrect port configuration

The first place to inspect is:

```bash
docker compose logs
```

or the relevant production deployment logs.

### Check Container State

Start with:

```bash
docker compose ps
```

This identifies whether services are:

- Running
- Exited
- Restarting
- Missing

A container that repeatedly restarts should then be examined through its logs.

### Check Logs

For the complete Compose environment:

```bash
docker compose logs
```

For continuous output:

```bash
docker compose logs -f
```

For a specific service:

```bash
docker compose logs -f <service>
```

The goal is to identify the **first actionable error**, rather than focusing on repeated restart messages that occur afterward.

### Missing Environment Variables

One deployment failure produced:

```text
Missing environment variable: DATABASE_HOST
```

This indicated that the application was initializing with configuration that expected database variables not supplied by the production environment.

The correct troubleshooting approach was to compare:

```text
Application configuration
        ↓
Required variables
        ↓
Production variables
        ↓
PostgreSQL service
```

rather than simply adding arbitrary variables until startup succeeded.

The production database configuration was ultimately aligned around:

```text
DATABASE_URL
${{multi-tenant-db.DATABASE_URL}}
```

### Missing Compiled Files

Another deployment failure reported:

```text id="m39u9z"
Cannot find module '/app/dist/database/migrate.js'
```

The first check was whether the file existed after the local TypeScript build:

```powershell
pnpm build
Test-Path dist/database/migrate.js
```

The local result confirmed that the file was generated.

This shifted the investigation from TypeScript compilation to Docker build context and deployment configuration.

The repository structure required `backend/` to be the Docker build context:

```text
multi-tenant-saas-hr-platform/
└── backend/
    ├── Dockerfile
    ├── package.json
    ├── database/
    └── src/
```

The deployment is therefore configured with:

```text
Root Directory: /backend
```

This allowed the Dockerfile to resolve its `COPY` paths against the backend application root.

### Migration Process Does Not Exit

The migration workflow previously reached:

```text
[migrate] complete — 9 applied, 0 skipped
```

but the process continued running instead of returning control to the shell.

The migration code already released the PostgreSQL client and closed the pool, so the database connection itself was not the remaining issue.

The investigation identified the test logging transport as the likely source of the persistent process.

The logger was adjusted so `pino-pretty` is not used in the test environment.

After the change:

```text
pnpm migrate:test
```

completed normally with output such as:

```text
[migrate] complete — 0 applied, 9 skipped
```

and the process exited normally.

This illustrates why a successful database operation does not necessarily mean the overall process lifecycle is correct.

### Database Connection Failures

If the backend starts but cannot connect to PostgreSQL, investigate the connection path:

```text
Backend
   ↓
Environment configuration
   ↓
DATABASE_URL / database settings
   ↓
Network
   ↓
PostgreSQL
```

Check:

```text
1. Is PostgreSQL running?
2. Is the application using the correct database configuration?
3. Is the hostname correct for the current environment?
4. Is the correct port being used?
5. Are credentials valid?
6. Does the target database exist?
7. Are required migrations applied?
```

When backend and PostgreSQL are separate Docker services, the backend should communicate using the Docker service/network configuration rather than assuming the host's published PostgreSQL port is the correct internal address.

### Port Problems

Port-related failures often occur when the container is healthy but external traffic cannot reach the application.

The application uses:

```text
process.env.PORT ?? 4000
```

and therefore supports:

```text
Local
→ 4000 fallback

Production (Render / Railway / etc.)
→ platform-provided PORT
```

The server also explicitly binds to:

```text
0.0.0.0
```

When diagnosing a port problem, verify all three layers:

```text
Application listening port
        ↓
Container networking
        ↓
Platform / public networking target
```

Do not solve a platform port issue by blindly hard-coding a cloud-specific port into the application.

### 502 Bad Gateway

A `502 Bad Gateway` indicates that the external proxy could not successfully reach the backend application.

The investigation path is:

```text
Public Domain
    ↓
Cloud Reverse Proxy
    ↓
Container Port
    ↓
Express Server
    ↓
Application
```

A previous production `502` issue was associated with the server's network binding.

The server was changed from:

```ts
app.listen(env.port, ...)
```

to:

```ts
app.listen(env.port, '0.0.0.0', ...)
```

This explicitly binds Express to all available container network interfaces.

### Container Starts but API Is Unreachable

When the container appears healthy but the API cannot be reached, verify:

```text
Is the Node process running?
        ↓
Is Express listening?
        ↓
Is the correct PORT being used?
        ↓
Is Express bound to 0.0.0.0?
        ↓
Is the platform targeting the correct port?
        ↓
Is public networking configured?
```

The health endpoint is the preferred operational test:

```text
GET /api/v1/health
```

### Health Check Failures

The health endpoint checks database connectivity using:

```sql
SELECT 1
```

A health response of:

```text
status = "unhealthy"
database = "disconnected"
```

indicates that the application is running but its database dependency is unavailable.

In this situation, investigate the database connection rather than treating the HTTP server itself as the primary problem.

### Docker Build Context Problems

In a repository where the backend exists under a subdirectory, the Docker build context is important.

Current structure:

```text
repository root
└── backend/
    ├── Dockerfile
    ├── package.json
    └── ...
```

If the build context is the repository root while the Dockerfile expects `backend/package.json` to be its local `package.json`, relative `COPY` instructions can resolve incorrectly.

The Docker build context should therefore match the assumptions made by the Dockerfile.

### Stale Image Problems

A source change does not automatically mean the running container contains that change.

When a Docker image may be stale, rebuild it:

```bash
docker compose up --build
```

Then verify the container is running the newly built image.

This is especially important after changes to:

- Dependencies
- Dockerfile
- Runtime configuration
- Compiled output
- Production startup commands

### Dependency Problems

When dependencies fail during the Docker build, inspect:

```text
package.json
pnpm-lock.yaml
pnpm-workspace.yaml
```

The Docker build intentionally uses:

```bash
pnpm install --frozen-lockfile
```

If the lockfile and package manifest are inconsistent, the build should fail rather than silently resolving a different dependency graph.

This is preferable for reproducibility.

### Node.js / Runtime Problems

The current Docker runtime is based on:

```text
node:24-alpine
```

When runtime errors occur, determine whether the problem is:

- Application code
- Compiled output
- Node.js compatibility
- Dependency behavior
- Environment configuration

A runtime error should not automatically be diagnosed as a Docker problem simply because it occurs inside a container.

### Recommended Investigation Order

For most Docker-related failures, use this order:

```text
1. Check container status
       ↓
2. Read logs
       ↓
3. Identify first meaningful error
       ↓
4. Classify build vs runtime
       ↓
5. Reproduce locally
       ↓
6. Check environment configuration
       ↓
7. Check database / network dependencies
       ↓
8. Apply the smallest fix
       ↓
9. Rebuild / restart
       ↓
10. Verify /api/v1/health
```

### Troubleshooting Principle

The central Docker troubleshooting principle is:

> **Note**: Identify the failing layer before changing the configuration.

A Docker deployment is a chain:

```text id="8qdu5g"
Source
 ↓
Build Context
 ↓
Dockerfile
 ↓
Image
 ↓
Container
 ↓
Environment
 ↓
Database / Network
 ↓
Application
 ↓
Public Proxy
```

A failure should be traced to the layer that actually caused it rather than changing multiple layers simultaneously.

---

## Production Cloud Deployment

The backend is deployed to modern cloud container platforms (such as Render, Railway, Fly.io, AWS App Runner, or Google Cloud Run) using the project's existing multi-stage `backend/Dockerfile`.

The production deployment connects the GitHub repository, backend Docker build, managed PostgreSQL service, environment variables, and ingress networking into a unified deployment workflow.

### Production Architecture

The standard production container architecture is:

```text
GitHub
  │
  │ main branch
  ▼
Cloud Hosting Service (e.g., Render / Railway / Fly.io)
  │
  │ Docker build (backend/Dockerfile)
  ▼
Backend Container
  │
  ├── Node.js / Express
  │
  └── Database connection
          │
          ▼
    Managed PostgreSQL
    (Cloud database instance)
```

The public API is exposed through the cloud provider's reverse proxy and ingress networking.

Example production API endpoint:

```text
https://api.yourdomain.com (or https://your-app.onrender.com / https://your-app.up.railway.app)
```

### GitHub Source Integration

The cloud backend service is connected to the project's GitHub repository:

```text
m-aaron/multi-tenant-saas-hr-platform
```

The production service is connected to the:

```text
main
```

branch.

Changes pushed or merged to `main` trigger the automated production deployment workflow.

The branch lifecycle is:

```text
develop
    ↓
CI verification (GitHub Actions)
    ↓
Merge to main
    ↓
Production container deployment
```

This keeps active development separated from the production deployment source.

### Backend Root Directory

The repository places backend code under:

```text
backend/
```

Cloud hosting platforms are configured with:

```text
Root Directory: /backend (or Docker Build Context: ./backend)
```

This ensures the Docker build context contains all necessary manifests:

```text
backend/
├── Dockerfile
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── database/
└── src/
```

This matches the build assumptions defined in `backend/Dockerfile`.

### Docker Build Execution

Cloud platforms build the backend using:

```text
backend/Dockerfile
```

The Dockerfile executes a multi-stage build:

```text
Builder Stage (node:24-alpine)
    ↓
pnpm install --frozen-lockfile
    ↓
pnpm build (tsc)
    ↓
dist/ artifact
    ↓
Production Stage (node:24-alpine)
    ↓
pnpm install --prod + apk add wget
    ↓
USER node (unprivileged)
    ↓
Production Container Image
```

The final production image contains only compiled code and production dependencies.

### Production Database

The backend connects to a managed PostgreSQL database provided by the cloud platform or a dedicated database provider (e.g., Supabase, Neon, AWS RDS, Render PostgreSQL, Railway PostgreSQL).

The service receives its database connection through:

```text
DATABASE_URL
```

This standard connection string allows the backend to connect to PostgreSQL without hard-coding credentials, hostnames, or ports into the codebase.

### Production Environment Variables

The backend service requires standard production environment variables:

```text
DATABASE_URL
ACCESS_TOKEN_SECRET
ACCESS_TOKEN_EXPIRES
REFRESH_TOKEN_SECRET
REFRESH_TOKEN_EXPIRES
```

Example non-secret configuration:

```text
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=30d
NODE_ENV=production
```

Actual JWT secrets and database credentials are stored exclusively in the cloud platform's environment settings. Production secrets are never committed to version control.

### Database Migration

The backend image contains compiled database migrations:

```text
dist/database/migrate.js
```

The production database schema is prepared using the compiled migration scripts:

```bash
pnpm migrate
```

In standard deployment workflows, migrations are executed against the target PostgreSQL database during release phase commands or pre-deployment tasks before the application container (`node dist/server.js`) starts accepting traffic.

### Application Port & Network Binding

The application listens on the platform-assigned `PORT` when provided, falling back to port `4000` for local execution:

```text
Local Environment
    ↓
PORT not provided → defaults to 4000

Cloud Platform (Render / Railway / Cloud Run)
    ↓
Platform-provided PORT → Application listens on assigned port
```

The Express server explicitly binds to:

```text
0.0.0.0
```

This ensures the container can receive traffic routed through container networking and reverse proxies.

### Public Networking & Ingress

Cloud platforms expose the backend container through an external ingress / reverse proxy:

```text
Internet
    ↓
Cloud Ingress / Reverse Proxy (SSL Termination)
    ↓
Backend Container (Port: $PORT, Host: 0.0.0.0)
    ↓
Express Router (/api/v1/*)
```

The application remains agnostic to the public domain, handling TLS termination and routing at the infrastructure layer.

### Health Check Monitoring

The production backend exposes an operational health endpoint:

```text
GET /api/v1/health
```

The health check verifies application uptime and active database connectivity.

A healthy service returns:

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 123,
  "environment": "production"
}
```

If the database is unreachable, the endpoint returns:

```text
503 Service Unavailable
```

This enables cloud hosting platforms and orchestrators to accurately assess container readiness.

### Production Deployment Verification

A complete production deployment verification covers all operational layers:

```text
GitHub source (main)
    ↓
Container image build
    ↓
Container startup (USER node)
    ↓
Database migration execution
    ↓
Express startup (0.0.0.0:$PORT)
    ↓
Health check verification (/api/v1/health)
    ↓
Public API smoke tests
```

### Production Smoke Test

After deployment, immediate verification is performed via the health endpoint:

```text
GET https://<deployment-domain>/api/v1/health
```

Expected response:

```text
HTTP 200 OK
{"status":"ok","database":"connected",...}
```

Subsequent smoke testing verifies:

```text
Authentication Flow (POST /api/v1/auth/login)
    ↓
Protected Endpoint (GET /api/v1/employees)
    ↓
Multi-Tenant Data Isolation
```

### CI and Automated Deployment

Production deployment is protected by continuous integration gates:

```text
Developer Feature Branch
    ↓
Pull Request to develop
    ↓
GitHub Actions CI Quality Gate
    ├── Code Quality (ESLint)
    ├── Migration Validation
    ├── Automated Test Suite (Vitest)
    └── Docker Build Verification
    ↓
Merge to main
    ↓
Automated Cloud Deployment
```

Platforms supporting CI hooks (such as Render Deploy Hooks or Railway Wait for CI) ensure deployments trigger only after all automated checks pass.

### Production Failure Investigation

Production deployment failures should be diagnosed systematically by layer:

```text
Source Code
    ↓
Docker Build & Context
    ↓
Image Creation
    ↓
Container Runtime
    ↓
Environment Variables
    ↓
Database Schema / Migration
    ↓
Application Initialization
    ↓
Ingress / Reverse Proxy
```

Key diagnostic patterns:
- **Missing Environment Variables**: Verify `DATABASE_URL` and token secrets are defined in platform settings.
- **Build Context Errors**: Ensure the root directory is set to `/backend`.
- **502 Bad Gateway**: Verify Express binds to `0.0.0.0` and listens on `process.env.PORT`.

### Local Docker vs Cloud Production

The local and production environments share the same container packaging foundation:

```text
Local Development
    ↓
Docker Compose
    ├── Backend Container (node:24-alpine)
    └── PostgreSQL Container (postgres:16-alpine)

Cloud Production
    ↓
Cloud Container Platform (Render / Railway / Fly.io)
    ├── Backend Container (node:24-alpine)
    └── Managed PostgreSQL Service
```

Application business logic, security middleware, and container definitions remain identical across environments.

### Deployment Security

Production deployments adhere to standard container security practices:
- All sensitive credentials are provided via platform environment variables.
- Secrets are excluded from images and Git history via `.dockerignore` and `.gitignore`.
- Container processes execute as unprivileged `USER node`.
- Base images use minimal Alpine Linux distributions (`node:24-alpine`).

### Deployment Maintenance

When updating deployment configurations:
1. Verify code changes locally with `pnpm test` and `pnpm build`.
2. Test container builds with `docker compose up --build`.
3. Push changes to `develop` and verify GitHub Actions CI.
4. Merge into `main` to trigger the production deployment.
5. Verify `/api/v1/health` and perform smoke tests.

### Deployment Principle

The production deployment follows the principle:

> **Note**: Build and verify the same containerized application artifact, supply environment configuration at runtime, and verify health through standard operational endpoints.

This ensures portability across any modern container hosting platform without vendor lock-in.

---

### Document Index

This document is part of the **Multi-Tenant SaaS HR Platform** technical documentation suite.

| Document                                                | Description                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01 — Project Overview](./01-project-overview.md)       | Business domain, project goals, and overall scope                               |
| [02 — System Architecture](./02-system-architecture.md) | Application architecture, module organization, and request lifecycle            |
| [03 — Database Design](./03-database-design.md)         | Entity relationships, database schema, and design decisions                     |
| [04 — API Reference](./04-api-reference.md)             | REST API conventions, endpoints, request/response standards, and authentication |
| [05 — Testing Strategy](./05-testing-strategy.md)       | Testing approach, project structure, and quality assurance practices            |
| **06 — Docker Guide** _(this document)_                 | Local development, production containers, and Docker workflow                   |
| [07 — CI/CD Pipeline](./07-ci-cd-pipeline.md)           | GitHub Actions workflow, automated validation, and Docker verification          |
| [08 — Deployment Guide](./08-deployment-guide.md)       | Production deployment process and infrastructure configuration                  |
| [09 — Development Roadmap](./09-development-roadmap.md) | Development phases, completed milestones, and future work                       |
| [10 — Future Enhancements](./10-future-enhancements.md) | Planned improvements, scalability considerations, and long-term vision          |
