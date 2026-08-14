> **Multi-Tenant SaaS HR Platform Documentation**
>
> [01 Project Overview](./01-project-overview.md) • [02 System Architecture](./02-system-architecture.md) • [03 Database Design](./03-database-design.md) • [04 API Reference](./04-api-reference.md) • **[05 Testing Strategy](./05-testing-strategy.md)** • [06 Docker Guide](./06-docker-guide.md) • [07 CI/CD Pipeline](./07-ci-cd-pipeline.md) • [08 Deployment Guide](./08-deployment-guide.md) • [09 Development Roadmap](./09-development-roadmap.md) • [10 Future Enhancements](./10-future-enhancements.md)

---

# Testing Strategy Overview

The **Multi-Tenant SaaS HR Platform** uses automated testing to verify application behavior, database interactions, and critical backend workflows.

The testing strategy is designed to provide confidence that changes can be introduced without unintentionally breaking existing functionality.

Testing is treated as part of the development workflow rather than as a final step performed only before deployment.

---

## Table of Contents

- [Testing Goals & Approach](#testing-goals)
- [Testing Pyramid](#testing-pyramid)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Database Testing](#database-testing)
- [HTTP-Level Testing (Within Integration)](#http-level-testing-within-integration)
- [Test Environment Configuration](#test-environment-configuration)
- [Mocking & Test Isolation](#mocking--test-isolation)
- [Test Data Strategy](#test-data-strategy)
- [Coverage & Quality Gates](#coverage--quality-gates)
- [CI Test Execution](#ci-test-execution)
- [Local Testing Workflow](#local-testing-workflow)
- [Failure Investigation](#failure-investigation)
- [Document Index](#document-index)

---

## Testing Goals

The primary goals of the testing strategy are:

- Verify expected application behavior.
- Detect regressions early.
- Validate database-dependent behavior.
- Verify business rules and error conditions.
- Ensure changes remain compatible with the existing backend architecture.
- Provide a quality gate before production deployment.

## Testing Approach

The backend uses automated tests together with an isolated test database.

The general testing workflow is:

```
Code Change
  │
  ▼
Automated Tests
  │
  ▼
Database Tests / Migrations
  │
  ▼
Build Verification
  │
  ▼
GitHub Actions CI
  │
  ▼
Merge to main
  │
  ▼
Production Deployment
```

This allows failures to be detected before changes reach the production environment.

## Current Test Suite

The current backend test suite contains:

```
24 test files
338 tests
```

The full suite has been verified successfully in the development environment.

The test suite is therefore used as a regression-safety mechanism for ongoing backend development.

> **Note**: The suite statistics above (`24 test files`, `338 tests`) are the canonical reference values for this document. Because each section is designed to be independently readable, these values are repeated in multiple places. The figures above reflect the verified state at the time this document was last updated.

## Test Environment

Automated tests use a dedicated test environment rather than the development or production database.

The test environment is selected through:

```
NODE_ENV=test
```

The environment configuration loads:

```
.env.test
```

This prevents automated tests from unintentionally operating against development or production data.

## Test Database

The test environment uses a dedicated PostgreSQL database.

Database migrations can be executed against the test database through:

```
pnpm migrate:test
```

The migration system tracks applied migrations through the `schema_migrations` table.

This allows the test database schema to be initialized and brought to the same expected structure as the application.

## Test Database Isolation

The test database is separate from the development and production databases.

This separation provides:

- Protection against accidental modification of development data.
- Protection against accidental modification of production data.
- Repeatable database initialization.
- Controlled test data.
- Independent migration execution.

## Migration Verification

Database migrations are treated as part of the test environment setup.

The test migration process verifies that:

1. Migration files can be discovered.
2. Migrations can be executed successfully.
3. Applied migrations are tracked.
4. Previously applied migrations can be skipped safely.
5. The migration process completes cleanly.

A successful test migration run can report:

```
migrate complete — 0 applied, 9 skipped
```

when all expected migrations are already present in the test database.

## Local Testing

Developers are expected to run the automated test suite locally before pushing changes.

The primary verification flow is:

```
pnpm test
    │
    ▼
pnpm migrate:test
    │
    ▼
pnpm build
```

This provides confidence that:

- Application tests pass.
- Database migrations remain valid.
- TypeScript compilation succeeds.

## Continuous Integration

The testing strategy is integrated with GitHub Actions.

Changes pushed to the repository are automatically checked by the CI workflow.

The CI environment executes automated verification before changes are considered ready for production.

The production branch uses the CI result as an additional quality gate before deployment.

## Production Relationship

Testing is not intended to replace production monitoring or health checks.

Production verification is handled separately through:

```text
Health Endpoint
    │
    ▼
Database Connectivity Check
    │
    ▼
Railway Deployment Health
```

The testing strategy therefore provides pre-deployment confidence, while production health checks provide post-deployment operational verification.

## Testing Principle

The central testing principle is:

> **Note**: Changes should be verified automatically before they become production changes.

The testing process should therefore evolve together with the application.

Whenever new modules, business rules, database behavior, or API contracts are introduced, corresponding automated tests should be added or updated.

## Scope of This Document

This document defines the testing strategy and workflow used by the backend.

Detailed sections cover:

- Testing levels
- Database testing
- Test environment configuration
- Migration testing
- Test isolation
- Test data
- CI execution
- Quality gates
- Local testing workflow
- Failure investigation

---

### Testing Pyramid

The backend follows a layered testing approach in which tests are organized according to the scope of the behavior being verified.

The purpose of the testing pyramid is to keep most verification close to the application logic while using broader tests for critical integration boundaries such as PostgreSQL and HTTP behavior.

The current project uses the following two testing layers:

```
                 ┌────────────────────────────────┐
                 │        Integration Tests       │
                 │  DB, service, and HTTP scope   │
                 │  (supertest for HTTP testing)  │
                 └────────────────────────────────┘
                                 ▲
                                 │
                 ┌────────────────────────────────┐
                 │          Unit Tests            │
                 │      Focused logic only        │
                 └────────────────────────────────┘
```

> **Note**: This project does not have a separate API or E2E test directory. HTTP-level tests (route, middleware, authentication, authorization, response contract) are implemented within `tests/integration/` using `supertest`, alongside service- and repository-level integration tests.

## Unit Tests

Unit tests verify focused pieces of application behavior in isolation.

Typical candidates include:

- Pure utility functions
- Validation behavior
- Small business rules
- Data transformations
- Token-related helpers
- Password-related helpers

The goal is to identify failures at the smallest practical scope.

Unit tests should remain fast and should avoid unnecessary external dependencies.

## Integration Tests

Integration tests verify that multiple parts of the backend work together correctly.

For this project, database interaction is an important integration boundary because many business services depend on PostgreSQL transactions, repositories, constraints, and relationships.

Examples include:

- Service + repository behavior
- Transaction handling
- PostgreSQL queries
- Migration behavior
- Organization-scoped data access
- Session persistence
- Audit and activity logging

Integration tests therefore provide stronger confidence than isolated unit tests for database-dependent functionality.

## HTTP-Level Testing (Within Integration)

HTTP-level verification is included within the integration test suite rather than maintained as a separate testing tier.

Integration tests that exercise the HTTP boundary use `supertest` to send real HTTP requests through the full application stack and verify the externally visible API contract.

Examples of HTTP-level behavior covered by integration tests include:

- HTTP method and route
- Request validation
- Authentication requirements
- Authorization requirements
- HTTP status codes
- Response structure
- Tenant isolation
- Error responses

This HTTP-level verification is particularly useful for protecting the public contract documented in `04-api-reference.md`.

## Test Scope Trade-Offs

The broader the test scope, the more application components are exercised at once.

This provides stronger end-to-end confidence but generally increases setup complexity and execution time.

A useful distinction is:

```
Unit
→ "Does this piece of logic work?"

Integration
→ "Do these components work together with the database and HTTP layer?"
```

In this project, HTTP-level confidence is built into the integration test scope rather than maintained as a separate tier.

The testing strategy therefore aims to use the narrowest test scope that can reliably verify a given behavior.

## Database as a Core Integration Boundary

Because the platform is database-driven, PostgreSQL is treated as an important integration boundary rather than being completely replaced by mocks.

This is especially relevant for functionality involving:

- Transactions
- Foreign keys
- Unique constraints
- Tenant scoping
- Session records
- Soft deletion
- Audit logs
- Activity logs

Database-backed verification helps detect failures that cannot be reliably reproduced by isolated unit tests alone.

## Testing Pyramid Principle

The pyramid should be used as a guideline for selecting test scope, not as a rigid requirement that every project maintain a specific percentage of tests at each level.

The priority is:

1. Fast feedback for focused logic.
2. Strong verification of database and module interactions.
3. End-to-end confidence for critical public API behavior.

The test suite should therefore grow according to the application's risk and complexity rather than according to an arbitrary numerical distribution.

## Relationship to CI

All test layers contribute to the CI quality gate.

A change should be considered production-ready only after the relevant automated verification has passed.

The intended flow is:

```
Developer change
    │
    ▼
Unit-level verification
    │
    ▼
Integration verification
(database, service, and HTTP)
    │
    ▼
CI
    │
    ▼
Production branch
```

## Current Project Context

The current backend test suite has been verified at:

```
24 test files
338 tests
```

The suite is evenly structured across 12 unit test files (`tests/unit/**/*.unit.test.ts`) and 12 integration test files (`tests/integration/**/*.integration.test.ts`), providing comprehensive coverage across all 9 domain modules (activity, audit, auth, department, employee, health, organization, profile, and user).

## Implementation Note: Directory Structure

The three-tier conceptual model (Unit / Integration / API) describes the **scope** of each test, not the physical directory layout.

The actual test directory structure uses two top-level directories:

```
tests/unit/          ← isolated logic tests (no database, no HTTP)
tests/integration/   ← service, repository, and HTTP-level tests
```

HTTP-level testing is implemented within `tests/integration/` using `supertest`. There is no separate `tests/api/` directory. Integration test files that exercise the full HTTP boundary follow the `.integration.test.ts` naming convention and are co-located with service- and repository-level integration tests.

---

### Unit Testing

Unit testing verifies focused pieces of backend logic in isolation from broader application infrastructure.

The purpose of unit tests is to provide fast feedback when a small piece of logic changes and to make failures easier to localize.

## Purpose of Unit Tests

Unit tests are appropriate when the behavior can be verified without requiring the complete application stack.

Typical candidates include:

- Pure utility functions
- Validation helpers
- Password-related helpers
- Token-related helpers
- Data transformations
- Small business rules
- Deterministic helper functions

The objective is to test the behavior of the unit itself rather than the behavior of the entire API or database.

## Isolation

A unit test should minimize dependencies on:

- PostgreSQL
- Network services
- External APIs
- Long-running processes
- Unrelated modules

When a dependency is not part of the behavior being tested, it may be replaced with a controlled test double or mock.

This allows the test to remain focused on the unit under examination.

## Example Testing Boundary

A useful unit-testing boundary is a utility function:

```
Input
    │
    ▼
Utility Function
    │
    ▼
Output
```

The test should verify the relationship between the input and output without requiring a running HTTP server or database.

## Deterministic Behavior

Unit tests should favor deterministic inputs and outputs.

For example, a password utility may be tested by verifying that:

- A valid password can be hashed.
- A correct password successfully verifies against its hash.
- An incorrect password fails verification.

The test does not need to exercise the complete authentication endpoint to validate the password utility itself.

## Error Behavior

Unit tests should also verify expected failure behavior when the unit has defined failure conditions.

Examples include:

- Invalid input
- Unsupported values
- Boundary conditions
- Invalid state
- Expected exceptions

Error behavior is especially important for reusable utilities because multiple modules may depend on the same behavior.

## Boundary Testing

Unit tests should include important boundaries rather than only typical successful inputs.

Examples include:

- Minimum valid length
- Maximum valid length
- Empty values
- Invalid values
- Null or optional values where supported
- Boundary dates
- Boundary numeric values

This helps detect regressions in validation and utility behavior.

## Relationship to Integration Tests

A unit test should not attempt to prove behavior that primarily belongs to an integration boundary.

For example:

```
Unit Test
→ Is the business/helper logic correct?

Integration Test
→ Does that logic work correctly with PostgreSQL and other dependencies?
```

Both levels are valuable, but they answer different questions.

## Unit Testing and Refactoring

Unit tests provide a safety net when internal implementation is refactored.

As long as the tested behavior remains unchanged, the implementation may be reorganized without changing the expected test outcome.

This allows internal code structure to evolve while preserving behavior.

## Unit Test Maintenance

Unit tests should be updated when the behavior they verify intentionally changes.

Tests should not be modified simply to make an implementation change pass without verifying that the new behavior is actually correct.

A failing unit test should therefore be treated as a signal to investigate whether:

1. The implementation is incorrect.
2. The expected behavior intentionally changed.
3. The test no longer represents the current requirement.

## Current Project Context

The project currently has a substantial automated test suite, but the exact classification of every test into unit, integration, and API categories should be determined from the actual test files rather than inferred from the total test count.

The current verified suite contains:

```
24 test files
338 tests
```

The unit-testing strategy therefore focuses on maintaining fast, isolated verification for logic that can be tested independently from the database and HTTP layers.

---

### Integration Testing

Integration tests verify interactions between multiple application components and infrastructure boundaries.

While unit tests focus on isolated logic, integration tests verify that independently implemented components work correctly when connected together.

For the Multi-Tenant SaaS HR Platform, the primary integration boundary is the PostgreSQL database.

## Integration Testing Goals

The integration-testing strategy aims to verify:

- Database queries and persistence behavior.
- Repository and service interaction.
- Transaction boundaries.
- Database constraints.
- Tenant-scoped data access.
- Authentication session persistence.
- Activity and audit-log persistence.
- Business rules that depend on database state.

Integration tests provide confidence that the application works correctly with its actual persistence layer rather than only with isolated mocks.

## PostgreSQL Integration

The backend uses PostgreSQL as its primary persistence layer.

Database-dependent integration tests should therefore execute against a dedicated test database rather than the development or production database.

The intended environment boundary is:

```
Application
    │
    ▼
Test Configuration
    │
    ▼
Test PostgreSQL Database
```

This allows database behavior to be tested using a real PostgreSQL instance while keeping test data isolated from other environments.

## Repository Integration

Repositories are responsible for communicating directly with PostgreSQL.

Integration tests should verify that repository operations behave correctly against the actual database.

Examples include:

- Creating records.
- Retrieving records.
- Updating records.
- Soft-deleting records.
- Organization-scoped queries.
- Handling missing records.
- Respecting database constraints.

This is important because SQL behavior, constraints, joins, transactions, and PostgreSQL-specific behavior cannot always be reproduced accurately through mocked repository calls.

## Service + Repository Integration

Business services often combine multiple repository operations inside a transaction.

Integration testing should therefore verify the interaction between:

```
Service
    │
    ▼
Repository
    │
    ▼
PostgreSQL
```

For example, user creation may involve:

```
Validate employee
    │
    ▼
Validate role
    │
    ▼
Check duplicate email
    │
    ▼
Insert user
    │
    ▼
Create profile
    │
    ▼
Write activity log
    │
    ▼
Write audit log
```

An integration test can verify that the complete operation produces the expected database state.

## Transaction Testing

Transactions are a critical integration boundary in the backend.

Many business operations are executed through the shared transaction helper:

```
Operation
    │
    ▼
BEGIN
    │
    ▼
Database changes
    │
    ▼
COMMIT
```

When an operation fails:

```text
Operation
    │
    ▼
BEGIN
    │
    ▼
Database changes
    │
    ▼
Error
    │
    ▼
ROLLBACK
```

Integration tests should verify both successful commits and expected rollback behavior.

This is especially important for workflows that modify multiple related records.

## Tenant Isolation Testing

Because the platform is multi-tenant, integration tests should verify that organization boundaries are enforced at the database-access layer.

A typical test scenario is:

```
Organization A
    │
    ▼
Create resource A

Organization B
    │
    ▼
Attempt to retrieve resource A
```

The second operation should not expose organization A's resource.

This verifies that authenticated organization context is correctly propagated into repository queries.

## Authentication Integration

Authentication involves several components working together:

```
Login Request
    │
    ▼
User Lookup
    │
    ▼
Password Verification
    │
    ▼
Session Creation
    │
    ▼
Refresh Token Persistence
    │
    ▼
Token Response
```

Integration tests should verify that successful authentication produces the expected persistent session state.

Refresh-token behavior should also be tested against the actual session records stored in PostgreSQL.

## Activity and Audit Logging

Business operations generate both activity and audit records.

Integration tests should verify that these records are created consistently with the operation that generated them.

For example:

```
Create Employee
        │
        ▼
Employee record created
        │
        ▼
Activity log created
        │
        ▼
Audit log created
```

When the originating transaction fails, integration tests should also verify that the related database changes do not leave an inconsistent partially completed state.

## Database Constraints

Integration tests are well suited for verifying behavior that depends on PostgreSQL constraints.

Examples include:

- Unique constraints.
- Foreign-key relationships.
- Required fields.
- Referential integrity.
- Soft-delete-related behavior.

These tests complement unit tests because the behavior belongs partly to the database rather than purely to application code.

## Migration Integration

Database migrations are part of the integration environment.

The test database can be initialized using:

```text id="ovh7s2"
pnpm migrate:test
```

The migration process verifies that the expected schema can be established against PostgreSQL.

A successful migration run may report:

```text
migrate complete — 0 applied, 9 skipped
```

when the test database already contains all expected migrations.

Migration tests therefore verify the compatibility between the migration files and the actual PostgreSQL test environment.

## Integration Test Isolation

Integration tests should use isolated database state whenever possible.

The test environment should not depend on:

- Development data.
- Production data.
- Manually modified persistent records.
- External application state.

This makes integration tests repeatable and reduces the chance that a local environment accidentally affects test results.

## When to Prefer Integration Tests

Integration tests should be preferred when the behavior being verified depends strongly on collaboration between components.

Examples include:

```
Repository + PostgreSQL
Service + Repository + PostgreSQL
Authentication + Session + PostgreSQL
Business Transaction + Logs + PostgreSQL
```

A unit test should remain sufficient when external infrastructure does not contribute meaningfully to the behavior under test.

## Integration Test Failures

When an integration test fails, investigation should consider both application and infrastructure causes.

Potential causes include:

- Incorrect database configuration.
- Missing test environment variables.
- Missing migrations.
- Invalid database state.
- SQL query errors.
- Constraint violations.
- Transaction-handling defects.
- Incorrect tenant scoping.

The first step should be identifying whether the failure originates from the application logic, the database schema, or the test environment.

## Current Project Context

The project currently has a verified automated test suite of:

```
24 test files
338 tests
```

The exact number of integration tests within that suite should be derived from the actual test-file classification rather than inferred from the total count.

The integration-testing strategy therefore focuses primarily on validating the PostgreSQL boundary and the multi-component workflows that depend on it.

---

### Database Testing

Database testing verifies that the backend correctly interacts with PostgreSQL and that database-dependent application behavior remains consistent with the intended data model.

Because the platform relies heavily on PostgreSQL for persistence, relationships, constraints, transactions, tenant isolation, sessions, and auditability, database testing is a core part of the backend testing strategy.

## Dedicated Test Database

Automated database-dependent tests use a dedicated PostgreSQL test database rather than the development or production database.

The current test environment targets:

```
hr_platform_test
```

The test environment is selected through:

```
NODE_ENV=test
```

and loads configuration from:

```
.env.test
```

This keeps test database operations isolated from development and production data.

## Database Configuration

The application uses the same centralized database configuration approach across environments.

The test environment can use the database connection configuration appropriate to the test database, while the production environment uses the Railway-provided `DATABASE_URL`.

This allows the same database access layer to be exercised in different environments without changing application code.

## Migration-Based Schema Setup

The test database schema is established through the project's migration system.

The test migration command is:

```
pnpm migrate:test
```

The migration runner:

1. Loads the test environment.
2. Reads migration entries from `database/schema.sql`.
3. Creates the `schema_migrations` table when necessary.
4. Determines which migrations have already been applied.
5. Applies pending migrations sequentially.
6. Records successfully applied migrations.
7. Rolls back the current migration when an error occurs.
8. Closes the database connection after completion.

This makes the test database schema reproducible from the repository's migration files.

## Migration Tracking

The migration system uses a `schema_migrations` table to track applied migration files.

Each applied migration is recorded by filename.

This allows the migration runner to distinguish between:

```
Pending migration
```

and:

```
Already-applied migration
```

A migration that has already been recorded is skipped rather than executed again.

For example:

```
[migrate] skip 0001_create_organizations.sql
[migrate] skip 0002_create_roles.sql
...
[migrate] complete — 0 applied, 9 skipped
```

This provides idempotent migration behavior.

## Transactional Migration Execution

Each migration is executed inside its own database transaction.

The intended lifecycle is:

```
BEGIN
    │
    ▼
Execute migration SQL
    │
    ▼
Record migration
    │
    ▼
COMMIT
```

If a migration fails:

```
BEGIN
    │
    ▼
Execute migration SQL
    │
    ▼
Error
    │
    ▼
ROLLBACK
```

This prevents a failed migration from being recorded as successfully applied and limits rollback to the migration currently being executed.

## Database Connectivity Testing

Database-dependent testing should verify that the application can establish a PostgreSQL connection and execute representative queries.

The health-check implementation uses:

```sql
SELECT 1
```

as a lightweight connectivity check.

The same principle can be applied to database integration tests: verify both connection establishment and the expected database operation rather than only testing in-memory logic.

## Repository Testing

Repository-level database testing should verify actual persistence behavior.

Relevant operations include:

- Insert
- Select
- Update
- Soft delete
- Tenant-scoped lookup
- Relationship lookup
- Duplicate detection
- Not-found behavior

For example, an organization-scoped employee query should only return employees belonging to the supplied organization.

## Constraint Testing

Database testing should verify behaviors enforced by PostgreSQL constraints rather than assuming that application validation alone is sufficient.

Important constraint categories include:

- Unique constraints
- Foreign keys
- Required fields
- Referential integrity
- Valid relationships between tenant-owned records

This is particularly important because database constraints remain a final line of defense even when application-level validation exists.

## Transaction Testing

Transactions should be tested when a business operation changes multiple related records.

For example, user creation can involve:

```
Create user
    │
    ▼
Create profile
    │
    ▼
Write activity log
    │
    ▼
Write audit log
```

These operations share a transactional boundary.

Database integration tests should verify that successful operations are committed together and that expected failures do not leave a partially persisted state.

## Tenant Isolation Testing

Tenant isolation is one of the most important database behaviors in this multi-tenant system.

Database tests should verify that organization-scoped queries cannot accidentally return records belonging to another organization.

A representative scenario is:

```text id="q8s6zo"
Organization A
    │
    ▼
Create employee A

Organization B
    │
    ▼
Query employees
    │
    ▼
Employee A must not appear
```

This tests the actual organization-scoping behavior of repository queries rather than merely checking controller logic.

## Soft Delete Testing

The application uses soft deletion for records such as employees and departments.

Database tests should verify that:

1. The record is marked as deleted/archived rather than physically removed.
2. Normal active-record queries no longer return the archived record.
3. Related data remains consistent.
4. Any required associations are handled correctly.

For department deletion, the current service first clears employee department associations before soft-deleting the department.

That relationship should be covered by database-level integration tests.

## Session and Authentication Data

Authentication relies on persisted session state.

Database testing should therefore verify:

- Session creation
- Refresh-token hash persistence
- Session expiration data
- Session revocation
- Refresh-token updates
- Logout behavior

This is important because authentication correctness depends on both token logic and database state.

## Activity and Audit Log Persistence

Business operations generate activity and audit records.

Database tests should verify that these records are persisted with the expected:

- Organization identifier
- Actor identifier
- Event or action
- Entity information
- Metadata
- Timestamp

Because activity and audit logging can share the transaction of the originating operation, tests should also verify transactional consistency.

## Test Data Isolation

Database tests should not depend on manually maintained development data.

Test data should be created and controlled by the test environment so that:

- Tests are repeatable.
- Results do not depend on previous manual changes.
- One developer's local data does not affect another developer's results.
- Production data is never involved.

## Database Test Lifecycle

The intended database-testing workflow is:

```
Start test environment
    │
    ▼
Load .env.test
    │
    ▼
Run test migrations
    │
    ▼
Run database-dependent tests
    │
    ▼
Verify results
    │
    ▼
Close database resources
```

This makes database setup an explicit part of automated verification rather than an implicit prerequisite.

## Failure Investigation

When a database test fails, the investigation should determine whether the cause is:

- Database configuration
- Missing environment variables
- Migration failure
- SQL query behavior
- Database constraint violation
- Incorrect transaction handling
- Incorrect tenant scoping
- Invalid test data
- Unexpected database state

The database layer should be tested independently enough that failures can be localized between application logic and PostgreSQL behavior.

## Current Project Context

The current project has a verified automated suite of:

```
24 test files
338 tests
```

The test database migration workflow has also been verified successfully, including a clean completion where all nine migrations were already applied.

This provides a controlled PostgreSQL environment for database-dependent testing while keeping production data completely separate.

---

### HTTP-Level Testing (Within Integration)

HTTP-level testing verifies the backend through its externally exposed HTTP interface.

In this project, HTTP-level tests live inside `tests/integration/` and are executed using `supertest`. They share the integration test directory alongside service- and repository-level tests. There is no separate `tests/api/` directory.

These tests verify the complete request-processing path from the client's perspective, covering the full stack:

The general boundary exercised is:

```
HTTP Request
  │
  ▼
Router
  │
  ▼
Middleware
  │
  ▼
Validation
  │
  ▼
Controller
  │
  ▼
Service
  │
  ▼
Database
  │
  ▼
HTTP Response
```

## API Testing Goals

API tests should verify the externally observable behavior of the backend, including:

- HTTP methods and routes
- Request validation
- Authentication
- Authorization
- Tenant isolation
- Business rules
- HTTP status codes
- Response structures
- Error responses
- Database-backed results

The focus is on the API contract rather than the internal implementation details of individual functions.

## Public and Protected Endpoints

The API contains both public and protected endpoints.

Public examples include:

```
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/health
```

Protected resources require an authenticated request, such as:

```
GET /api/v1/profile
GET /api/v1/users
GET /api/v1/employees
GET /api/v1/departments
GET /api/v1/activities
GET /api/v1/audits
```

API tests should explicitly verify the authentication boundary for these resources.

## Authentication Testing

Protected endpoint tests should verify that requests behave correctly when:

- No access token is provided.
- An invalid access token is provided.
- A valid access token is provided.
- The authenticated user has the required role.
- The authenticated user lacks the required role.

This ensures that authentication and authorization middleware are correctly applied at the HTTP boundary.

## Request Validation Testing

API tests should verify that invalid request data is rejected before business logic is executed.

Examples include:

```
Missing required fields
Invalid email
Invalid UUID
Invalid enum value
Invalid date
Future hire date
Invalid query parameter
```

The response should follow the centralized validation-error contract documented in `04-api-reference.md`.

## Successful Request Testing

For valid requests, API tests should verify:

1. The expected HTTP status code is returned.
2. The response indicates success.
3. The expected response message is returned.
4. The `data` structure matches the documented contract.
5. Relevant database state is updated when appropriate.

For example, a successful employee creation should verify both the HTTP response and the resulting employee record.

## Error Response Testing

API tests should cover important failure conditions.

Examples include:

- Resource not found
- Duplicate organization
- Duplicate department
- Duplicate user email
- Invalid credentials
- Inactive user
- Invalid refresh token
- Unauthorized access
- Forbidden access
- Invalid request body

These tests protect the public error contract and help prevent accidental changes to client-visible behavior.

## Tenant Isolation Testing

Multi-tenant behavior should be tested through HTTP requests rather than only through repository tests.

A representative scenario is:

```
Authenticate as Organization A
    │
    ▼
Create resource A
    │
    ▼
Authenticate as Organization B
    │
    ▼
Request resource A
    │
    ▼
Resource A must not be exposed
```

This validates the complete chain:

```
HTTP Request
    │
    ▼
Authentication
    │
    ▼
Organization Context
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Tenant-scoped Repository Query
```

## Role Authorization Testing

The API uses role-based authorization on many endpoints.

Tests should verify both permitted and denied roles.

For example:

```
Owner
Administrator
HR Manager
```

may have different permissions depending on the endpoint.

A test should therefore verify the actual route-level role requirements rather than assuming that every authenticated user has access to every resource.

## Response Contract Testing

API tests should verify the common response structure.

Successful application responses generally use:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Operations that do not return resource data use:

```json
{
  "success": true,
  "message": "...",
  "data": null
}
```

Validation failures use the additional `error` property defined by the centralized error middleware.

This makes API tests useful as regression protection for the contracts documented in `04-api-reference.md`.

## Status Code Testing

Tests should verify the HTTP status associated with important operations.

The backend returns the following HTTP status codes, each of which should be verified by the automated test suite:

```
200 OK                    — successful read/update operations and auth actions
201 Created               — successful resource creation
400 Bad Request           — request validation failures (Zod schema errors)
401 Unauthorized          — missing or invalid access token
403 Forbidden             — authenticated but insufficient role
404 Not Found             — resource does not exist or belongs to another tenant
409 Conflict              — duplicate resource (organization, department, user email)
500 Internal Server Error — unexpected application error
503 Service Unavailable   — database connectivity failure (health endpoint)
```

Each status code corresponds to a specific error class or success path documented in `04-api-reference.md`.

## Health Endpoint Testing

The health endpoint is also suitable for HTTP-level testing.

A healthy environment should return:

```
GET /api/v1/health
→ 200
```

with a healthy status and connected database.

A failed database health check should produce:

```
GET /api/v1/health
→ 503
```

with the database reported as disconnected.

This verifies both the HTTP status behavior and the operational response contract.

## Authentication Workflow Testing

The authentication flow can be tested as a sequence of HTTP operations:

```
Register
    │
    ▼
Login
    │
    ▼
Receive access + refresh tokens
    │
    ▼
Access protected endpoint
    │
    ▼
Refresh token
    │
    ▼
Receive rotated token pair
    │
    ▼
Logout
    │
    ▼
Verify session is no longer valid
```

This provides stronger confidence than testing each authentication function independently because it verifies the complete client-facing workflow.

## API Tests and Database State

For state-changing endpoints, API testing should verify the resulting database state when appropriate.

Examples include:

```
POST /api/v1/employees
        │
        ▼
Employee exists in database

PATCH /api/v1/departments/:departmentId
        │
        ▼
Department name updated

DELETE /api/v1/employees/:employeeId
        │
        ▼
Employee soft-deleted

POST /api/v1/auth/login
        │
        ▼
Session persisted
```

This creates a direct relationship between the HTTP contract and the underlying application state.

## Test Environment

HTTP tests that depend on PostgreSQL should use the dedicated test environment rather than development or production.

The intended environment is:

```
NODE_ENV=test
```

with the corresponding test database configuration.

This prevents API tests from modifying production data.

## API Test Isolation

API tests should avoid depending on arbitrary data left behind by previous manual requests.

Where possible, test data should be created specifically for the test scenario and the resulting state should be isolated or cleaned up appropriately.

This makes failures easier to reproduce and reduces order-dependent tests.

## Failure Investigation

When an API test fails, investigation should proceed from the outer HTTP boundary inward:

```
HTTP status
    │
    ▼
Response body
    │
    ▼
Route / middleware
    │
    ▼
Controller
    │
    ▼
Service
    │
    ▼
Repository
    │
    ▼
Database
```

The returned HTTP status and response body should be examined before modifying implementation code.

This helps distinguish:

- Routing problems
- Authentication problems
- Validation failures
- Authorization failures
- Business-rule failures
- Database failures
- Unexpected server errors

## API Testing Principle

API tests should protect **observable behavior**, not implementation details.

Internal refactoring should not require API tests to change as long as the externally visible contract remains unchanged.

For example, a service may be reorganized internally while the following contract remains stable:

```
POST /api/v1/auth/login
→ 200
→ success: true
→ Login successful.
→ expected token response
```

## Relationship to `04-api-reference.md`

The API reference and API tests should evolve together.

When an externally visible API behavior changes:

```
Implementation
    │
    ▼
API Tests
    │
    ▼
API Reference
```

The test suite verifies the behavior while [Api Reference](./04-api-reference.md) documents the contract.

This reduces the risk of implementation, automated verification, and documentation becoming inconsistent.

---

### Test Environment Configuration

The backend uses a dedicated test environment to ensure that automated tests do not operate against development or production resources.

The test environment is selected through the `NODE_ENV` environment variable.

## Test Environment Selection

The application determines the active environment from:

```
NODE_ENV
```

When the value is:

```
test
```

the centralized environment configuration loads:

```
.env.test
```

This allows test execution to use configuration values specifically intended for automated testing.

## Environment File Strategy

The backend follows an environment-specific configuration model:

```
Development
    │
    ▼
.env

Test
    │
    ▼
.env.test

Production
     │
    ▼
Platform-provided environment variables
```

The test configuration is therefore isolated from the normal development configuration.

## Test Database

The test environment uses a dedicated PostgreSQL database:

```
hr_platform_test
```

Database-dependent tests and migration verification operate against this database rather than the development or production database.

This separation prevents automated tests from unintentionally modifying application data outside the test environment.

## Test Configuration Loading

The centralized environment module determines which environment file should be loaded based on `NODE_ENV`.

The intended behavior is:

```
NODE_ENV=test
    │
    ▼
.env.test
    │
    ▼
Test configuration
    │
    ▼
Application / tests
```

The environment loader also expands environment-variable references when configured through the environment files.

## Database Configuration

The database layer supports the same general configuration model used across environments.

The test environment can provide the database configuration required to connect to `hr_platform_test`.

The production environment uses a `DATABASE_URL` supplied by the deployment platform, while the test environment remains independently configured for automated testing.

This allows the application database layer to remain consistent while the actual database target changes by environment.

## Test Migration Configuration

Database migrations can be executed explicitly against the test environment using:

```
pnpm migrate:test
```

The command sets:

```
NODE_ENV=test
```

before executing the migration runner.

The result is a migration process that targets the test database instead of the development database.

## Test Environment Safety

The test environment provides an explicit boundary between automated verification and other environments.

Tests should never depend on:

- Development database state
- Production database state
- Manually created production records
- Production secrets
- Production-only configuration

The test database and test configuration should contain only values required to execute automated verification.

## Test Secrets

Secrets required by the application during automated tests should remain test-specific.

Production credentials should not be copied into `.env.test`.

Similarly, secrets and credentials used only for local testing should not be committed as real secret values to the repository.

Example configuration files should contain placeholders rather than actual credentials.

## Environment Consistency

The test environment should remain compatible with the application's expected configuration contract.

When a new required environment variable is introduced into the application, the test configuration must be updated accordingly.

Otherwise, automated tests may fail during application initialization before the actual test logic executes.

The intended relationship is:

```
Application Configuration
    │
    ▼
Required Variables
    │
    ▼
.env.test
    │
    ▼
Test Execution
```

## CI Environment

The same environment separation applies when tests execute through GitHub Actions.

CI should provide the environment required by the test suite without using production configuration.

Database-dependent CI tests should connect to an isolated test PostgreSQL environment configured specifically for CI.

The production environment must remain outside the test execution boundary.

## Local Test Workflow

A typical local test workflow is:

```
Set NODE_ENV=test
    │
    ▼
Load .env.test
    │
    ▼
Connect to hr_platform_test
    │
    ▼
Run migrations when necessary
    │
    ▼
Run automated tests
```

This makes the active environment explicit and reduces accidental cross-environment operations.

## Verification

The test environment should be considered correctly configured when:

- `NODE_ENV=test` selects the test environment.
- `.env.test` is loaded.
- The application connects to `hr_platform_test`.
- Test migrations execute successfully.
- Automated tests can complete without production dependencies.

The current project has verified the migration portion of this workflow with:

```text
pnpm migrate:test
```

including successful completion when the expected migrations are already applied.

## Test Runner Scope

The Vitest configuration (`vitest.config.ts`) defines which files are included in the test run.

Test files are discovered from:

```
tests/**/*.ts
```

The following paths are explicitly excluded from the test runner:

```
tests/setup.ts         ← global lifecycle hooks, not a test file
tests/helpers/*.ts     ← shared helper utilities, not test files
tests/mocks/*.ts       ← shared mock definitions, not test files
```

Files placed under `tests/helpers/` or `tests/mocks/` will not be executed as tests, even if they contain `describe` or `it` blocks. All test logic must reside in files under `tests/unit/` or `tests/integration/`.

## Configuration Principle

Environment-specific behavior should be handled through configuration rather than hard-coded application logic.

The application should not contain logic such as:

```
if production:
    use database A

if test:
    use database B
```

Instead, environment-specific values should be supplied through the configuration layer.

This keeps the application code portable across local development, testing, CI, and production environments.

---

### Test Database & Migrations

The backend uses a dedicated PostgreSQL test database to support automated database-dependent testing.

The test database is kept separate from development and production environments and is initialized through the project's migration system.

## Test Database

The current test database is:

```
hr_platform_test
```

The test environment targets this database through the configuration loaded when:

```
NODE_ENV=test
```

is active.

This provides a controlled persistence boundary for automated testing.

## Migration Source of Truth

The migration runner treats:

```
database/schema.sql
```

as the source of truth for migration execution order.

Migration entries are extracted from the `\i migrations/<filename>.sql` declarations contained in `schema.sql`.

This means migration order is explicitly defined by the schema file rather than inferred from filenames or filesystem ordering.

## Migration Files

Individual schema changes are stored under:

```
database/migrations/
```

The current migration set contains nine migrations:

```
0001_create_organizations.sql
0002_create_roles.sql
0003_create_users.sql
0004_create_profiles.sql
0005_create_departments.sql
0006_create_employees.sql
0007_create_sessions.sql
0008_create_activity_logs.sql
0009_create_audit_logs.sql
```

Each migration represents a discrete database schema change.

## Test Migration Command

The test database can be migrated using:

```bash
pnpm migrate:test
```

The command runs the migration process with:

```
NODE_ENV=test
```

which causes the application environment configuration to load `.env.test`.

## Migration Tracking

The migration system creates a dedicated tracking table:

```sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    filename TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Each successfully applied migration is recorded by filename.

This allows the migration runner to determine whether a migration is:

```
Pending
```

or:

```
Already applied
```

## Idempotent Migration Behavior

The migration process is designed to be idempotent.

When a migration is already present in `schema_migrations`, it is skipped rather than executed again.

For example:

```
[migrate] skip 0001_create_organizations.sql
[migrate] skip 0002_create_roles.sql
...
```

A database that already contains all expected migrations can therefore be migrated safely without re-running previously applied schema changes.

## Migration Transactions

Each migration is executed inside its own PostgreSQL transaction.

The execution lifecycle is:

```
BEGIN
    │
    ▼
Execute migration SQL
    │
    ▼
Record migration filename
    │
    ▼
COMMIT
```

If the migration fails:

```
BEGIN
    │
    ▼
Execute migration SQL
    │
    ▼
Error
    │
    ▼
ROLLBACK
```

The migration is only recorded after the SQL executes successfully.

This prevents a failed migration from being marked as applied.

## Migration Order

The migration runner processes migration entries sequentially according to the order parsed from `database/schema.sql`.

This ensures that dependencies between schema changes can be explicitly controlled by the project's declared migration order.

The migration runner does not rely on arbitrary filesystem ordering.

## Database Connection Cleanup

The migration process explicitly releases its PostgreSQL client and closes the connection pool after migration execution.

This is important for automated test environments because the migration process must terminate cleanly after the database operation completes.

The cleanup flow is:

```
Migration complete
    │
    ▼
Release PostgreSQL client
    │
    ▼
Close connection pool
    │
    ▼
Process exits
```

## Test Database Verification

A successful migration run verifies several properties of the test database environment:

- The database is reachable.
- The migration tracking table can be created.
- Migration files can be read.
- Migration SQL can be executed.
- Migration records can be persisted.
- Existing migrations can be skipped safely.
- Database resources can be released correctly.

A fully initialized test database can report:

```text id="x3f4tw"
[migrate] complete — 0 applied, 9 skipped
```

This indicates that all nine expected migrations are already recorded in the test database.

## Migration Failure Handling

If a migration fails, the current migration is rolled back and the process reports the failure.

Previously successful migrations remain recorded.

This allows the database to preserve the successful migration history while preventing an incomplete migration from being treated as valid.

## Test Database Lifecycle

The intended test database lifecycle is:

```
Create / provision test database
    │
    ▼
Load .env.test
    │
    ▼
Run pnpm migrate:test
    │
    ▼
Apply pending migrations
    │
    ▼
Run automated tests
    │
    ▼
Test against current schema
```

The database can then be reused for subsequent local test runs because already-applied migrations are skipped.

## Local and CI Usage

The migration workflow is suitable for both local development and automated CI environments.

Local verification:

```bash
pnpm migrate:test
pnpm test
```

CI can perform the equivalent database setup before executing database-dependent tests.

The test database must remain isolated from development and production databases in both environments.

## Production Relationship

The same migration system can also be used when deploying the production application, but the target database changes according to the production environment configuration.

Production uses the Railway PostgreSQL service through:

```
DATABASE_URL
```

while the test environment uses the dedicated test database configuration.

The migration files therefore remain shared across environments while the target database is environment-specific.

## Migration Maintenance

When a database schema change is introduced:

1. Create a new migration file.
2. Add the migration to the declared order in `database/schema.sql`.
3. Run the migration against the test database.
4. Run the automated test suite.
5. Verify that the resulting schema supports the application changes.
6. Include the migration in the deployment workflow.

Existing migration files should be treated as historical schema changes and should not be casually rewritten after they have been applied to shared environments.

## Current Test Database State

The project currently has nine declared database migrations covering the core organization, role, user, profile, department, employee, session, activity-log, and audit-log schema.

The migration system has been verified against the test database, including successful execution where all nine migrations were already applied and correctly skipped.

---

### Mocking & Test Isolation

The testing strategy uses isolation selectively based on the scope of the behavior being tested.

Mocks and test doubles are appropriate when an external dependency is not the subject of the test, while real infrastructure should be used when the infrastructure itself is part of the behavior being verified.

## Mocking Principle

The primary rule is:

> **Note**: Mock dependencies that are outside the behavior being tested, but prefer real infrastructure when the integration itself is the behavior under test.

For example:

```
Unit test
    │
    ▼
Business/helper logic
    │
    ▼
Mock unrelated dependency
```

while a database integration test should normally use the real PostgreSQL test database:

```
Integration test
    │
    ▼
Repository / service
    │
    ▼
Real PostgreSQL test database
```

This prevents unit tests from becoming unnecessarily slow while preserving confidence in database-dependent behavior.

## What Should Be Mocked

Mocks or test doubles may be appropriate for dependencies such as:

- External services
- Network calls
- Unrelated modules
- Expensive infrastructure not relevant to the test
- Non-deterministic dependencies

The purpose is to isolate the behavior under examination.

A mock should therefore represent a dependency's expected interface rather than reproduce the implementation of that dependency.

## What Should Not Be Mocked Automatically

The database should not be mocked merely to make every test faster.

For this project, PostgreSQL behavior is an important integration boundary because the application relies on:

- SQL queries
- Transactions
- Constraints
- Relationships
- Tenant scoping
- Session persistence
- Soft deletion
- Activity logs
- Audit logs

Those behaviors are better verified against the actual PostgreSQL test database.

## Test Isolation

Test isolation ensures that one test does not unintentionally affect another test.

Tests should not depend on:

- Execution order
- Previous test results
- Manually created database records
- Development database state
- Production data

Each test should establish the state necessary for the behavior it is verifying.

## Database Isolation

Database-dependent tests use the dedicated test database rather than development or production databases.

The environment boundary is:

```
Test execution
    │
    ▼
NODE_ENV=test
    │
    ▼
.env.test
    │
    ▼
hr_platform_test
```

This prevents automated tests from modifying data outside the intended test environment.

## State Isolation

When a test changes persistent state, that state should either:

1. Be isolated within the test's transactional boundary, or
2. Be created and cleaned up as part of the test lifecycle.

The exact mechanism can vary depending on the behavior being tested.

The important requirement is that one test should not rely on state accidentally created by another test.

## Transaction Isolation

Transactions provide an additional isolation mechanism for database operations.

Business services in the application commonly use the shared transaction helper:

```
BEGIN
    │
    ▼
Database operations
    │
    ▼
COMMIT
```

or:

```
BEGIN
    │
    ▼
Database operation fails
    │
    ▼
ROLLBACK
```

Tests should verify transactional behavior when atomicity is part of the business requirement.

## Tenant Test Isolation

Because the platform is multi-tenant, isolation must also exist between organizations.

A useful test pattern is:

```
Organization A
    │
    ▼
Create test resource

Organization B
    │
    ▼
Query same resource ID

Expected:
resource is not exposed
```

This verifies that tenant isolation is enforced by the application and persistence layers rather than relying only on test data conventions.

## Authentication Isolation

Authentication tests should use controlled test identities.

Test credentials and sessions should remain within the test environment and should never depend on production accounts.

Session-related tests should also avoid assuming that a session created by another test remains valid.

## Mock Scope

Mocks should be kept as close as practical to the dependency boundary being isolated.

For example:

```
Service
    │
    ▼
Mock repository
```

may be appropriate for a unit test of service logic.

However:

```
Service
    │
    ▼
Repository
    │
    ▼
Real PostgreSQL
```

is more appropriate when verifying the actual persistence behavior.

This keeps the scope of each test clear.

## Avoiding Over-Mocking

Over-mocking can create tests that pass even when the real application integration is broken.

For example, if every repository call is mocked, a test may not detect:

- Invalid SQL
- Missing database columns
- Incorrect joins
- Broken foreign-key relationships
- Transaction failures
- Tenant-scoping mistakes in actual queries

For this reason, mocks should not replace integration tests for database-critical behavior.

## Deterministic Test Behavior

Isolation also requires deterministic test inputs.

Tests should avoid depending on:

- Real external network responses
- Current production state
- Shared mutable global state
- Random values without controlled expectations
- Wall-clock assumptions that are not part of the behavior under test

When randomness or time is relevant, tests should control or explicitly account for those values where practical.

## Local and CI Isolation

The same isolation principles should apply both locally and in GitHub Actions.

A test that passes locally but depends on a developer's machine-specific state is not considered sufficiently isolated.

CI should execute tests using the same logical test boundaries:

```
Repository
    │
    ▼
Test Environment
    │
    ▼
Test Database
    │
    ▼
Automated Tests
```

This reduces differences between local and CI behavior.

## Failure Investigation

When an isolated test fails intermittently or behaves differently depending on execution order, investigate possible shared state.

Common isolation failures include:

- Reused database records
- Unclosed database resources
- Shared mocks
- Persistent sessions
- Tests modifying global state
- Dependence on execution order

The goal should be to make each test independently reproducible.

## Isolation Principle

A well-isolated test should answer a clear question without depending on accidental state elsewhere in the suite.

The preferred model is:

```
Arrange
    │
    ▼
Controlled test state
    │
    ▼
Act
    │
    ▼
Assert
    │
    ▼
Cleanup / isolation boundary
```

This principle applies differently at each testing level:

```
Unit
→ isolate dependencies

Integration
→ isolate test environment while using real infrastructure where relevant

API
→ isolate request state, authentication state, and database state
```

## Current Project Context

The current project uses a dedicated PostgreSQL test database and a migration-based test environment.

This means the testing strategy does not depend on mocking the entire persistence layer. Instead, mocking is used selectively while real PostgreSQL is retained for database-dependent integration behavior.

The current automated suite contains:

```
24 test files
338 tests
```

The exact mock usage across those tests should be documented from the actual test files rather than assumed from the project structure.

---

### Test Data Strategy

The testing strategy requires controlled and isolated test data so that automated tests remain predictable, repeatable, and independent from development and production data.

Test data should be created specifically for the behavior being verified and should remain within the dedicated test environment.

## Test Data Principles

Test data should follow these principles:

- Deterministic
- Isolated
- Minimal
- Explicit
- Reproducible
- Safe for automated execution

Tests should create only the records necessary for the scenario being tested rather than depending on unrelated pre-existing data.

## Dedicated Test Environment

All database-dependent test data belongs in the dedicated PostgreSQL test environment.

The current test database is:

```
hr_platform_test
```

Test execution uses:

```
NODE_ENV=test
```

which loads the test-specific configuration.

Production records must never be used as test fixtures or test prerequisites.

## Test Data Ownership

Each test should have a clear understanding of the data it owns.

For example:

```
Test
    │
    ▼
Create organization
    │
    ▼
Create employee
    │
    ▼
Run assertion
```

The test should not assume that another test has already created that organization or employee.

This reduces hidden dependencies between test cases.

## Organization-Scoped Test Data

Because the platform is multi-tenant, test data should normally be associated with an explicit organization.

A typical scenario may involve:

```
Organization A
 ├── Employee A
 ├── User A
 └── Department A
```

A separate scenario may use:

```
Organization B
 ├── Employee B
 ├── User B
 └── Department B
```

This makes tenant-boundary behavior easier to verify.

## Tenant Isolation Test Data

Cross-tenant scenarios should intentionally create data belonging to more than one organization.

For example:

```
Create resource in Organization A
    │
    ▼
Authenticate as Organization B
    │
    ▼
Attempt to access resource A
    │
    ▼
Access must not succeed
```

This allows the test suite to verify tenant isolation as an observable behavior.

## Minimal Test Data

Tests should avoid generating unnecessary records.

For a department update test, for example, the test may only require:

```
Organization
   │
   ▼
Department
   │
   ▼
Authenticated actor
```

Additional employees, users, or unrelated resources should only be created when the scenario actually depends on them.

Minimal fixtures make tests easier to understand and reduce execution overhead.

## Reusable Test Data

When multiple tests require the same basic structure, reusable test-data helpers may be introduced.

Examples include helpers for creating:

- Test organizations
- Test users
- Test employees
- Test departments
- Test sessions

Reusable helpers should remain explicit enough that the data requirements of an individual test are still easy to understand.

The helper should not hide important business assumptions.

## Realistic Test Data

Test values should resemble valid application data while remaining safe and clearly synthetic.

Examples:

```
Organization:
Acme Test Corporation

Slug:
acme-test

Email:
owner@example.test
```

Synthetic test values should never contain real user credentials, production secrets, or personally identifiable production information.

## Validation Test Data

Validation tests should include both valid and invalid values.

For example, employee validation can include:

```
Valid:
jobTitle = "Software Engineer"

Invalid:
jobTitle = ""
```

Boundary values are especially useful for fields with explicit constraints.

Examples include:

- Minimum allowed length
- Maximum allowed length
- Empty input
- Invalid UUID
- Invalid enum value
- Future date
- Null where null is not allowed

## Authentication Test Data

Authentication tests should use dedicated synthetic credentials.

A test user may have:

```
organizationSlug
email
password
role
status
```

The password should exist only in the test environment and should never reuse a production credential.

Session and refresh-token test data should likewise remain isolated to the test database.

## Database State

Test data should be created against a known database state.

The migration system establishes the expected schema before database-dependent tests execute.

The intended sequence is:

```
Test database
    │
    ▼
Run migrations
    │
    ▼
Create test data
    │
    ▼
Run tests
```

This ensures that test data is created against the expected database structure.

## Cleanup and Isolation

Test data should not leak unpredictably from one scenario into another.

Where cleanup is required, the chosen strategy should ensure that subsequent tests do not depend on records left behind by earlier tests.

Possible isolation mechanisms include:

- Transaction boundaries
- Explicit cleanup
- Fresh database state
- Unique test records

The specific cleanup mechanism should match the test type and the behavior being verified.

## Unique Test Data

When tests require unique records, data should use values that avoid accidental collisions.

Examples include unique:

- Email addresses
- Organization slugs
- Employee identifiers
- Department names

Where the application generates values automatically, tests should verify the generated behavior rather than manually reproducing generated identifiers.

## Avoiding Production Data

Production data must never be used as test input.

This includes:

- Production user accounts
- Production passwords
- Production database records
- Production tokens
- Production API credentials
- Production secrets

The test strategy relies on environment separation instead.

## CI Test Data

GitHub Actions should execute against test-specific data and configuration.

CI test data should be reproducible from the repository and should not depend on an individual developer's local database state.

The intended model is:

```
GitHub Actions
    │
    ▼
Test Environment
    │
    ▼
Test Database
    │
    ▼
Controlled Test Data
    │
    ▼
Automated Tests
```

This allows CI failures to be reproduced more reliably.

## Test Data and Business Rules

Test data should be designed to exercise actual business rules rather than merely satisfy database constraints.

Examples include:

- Duplicate organization names
- Duplicate organization slugs
- Duplicate user emails within a tenant
- Employees already associated with users
- Inactive users
- Revoked organizations
- Existing department names
- Invalid refresh sessions

These scenarios are more valuable than creating large quantities of unrelated records.

## Test Data Lifecycle

A typical test-data lifecycle is:

```
Arrange
    │
    ▼
Create required synthetic records
    │
    ▼
Act
    │
    ▼
Run operation
    │
    ▼
Assert
    │
    ▼
Cleanup / isolation boundary
```

The test should make its required data explicit instead of relying on hidden global state.

## Current Project Context

The project currently uses:

```
Dedicated test database: hr_platform_test
Environment: NODE_ENV=test
Migration setup: pnpm migrate:test
```

The database schema currently contains nine declared migrations.

The current automated suite contains:

```
24 test files
338 tests
```

The project provides shared test-data helpers under:

```
tests/helpers/
├── test-auth-fixture.ts       ← authentication token and session setup
├── test-database.helper.ts    ← shared fixture creation and cleanup utilities
├── test-request.helper.ts     ← supertest request wrappers
└── test-response.helper.ts    ← response assertion utilities
```

These helpers are excluded from the Vitest test runner (see Test Runner Scope) and are imported by individual test files as needed. They provide the reusable fixture and cleanup patterns described in this section.

The test-data strategy prioritizes isolation, synthetic data, tenant-aware scenarios, and reproducibility.

---

### Coverage & Quality Gates

Test coverage and quality gates are used to determine whether a change has sufficient automated verification before it progresses toward production.

The purpose of a quality gate is not to maximize a single coverage percentage. The goal is to ensure that important application behavior, business rules, persistence boundaries, and public API contracts are adequately verified.

## Current Test Suite

The current automated test suite contains:

```
24 test files
338 tests
```

The suite has been successfully executed during local development and is also integrated into the project's CI workflow.

## Test Coverage

Code coverage measures which portions of the application are exercised by automated tests.

Coverage reports can be generated locally using:

```bash
pnpm test:coverage
```

This runs the full test suite with `@vitest/coverage-v8` instrumentation and produces a report in the `coverage/` directory. No CI threshold is currently enforced; the command is available for local inspection and gap analysis.

Coverage can be useful for identifying untested areas, but coverage percentage alone does not determine whether the application is adequately tested.

For example, a test suite may achieve high line coverage while failing to verify important:

- Error paths
- Authorization rules
- Tenant-isolation behavior
- Transaction rollback behavior
- Database constraints
- Authentication flows

Coverage should therefore be treated as a diagnostic and planning tool rather than the only quality metric.

## Coverage Priorities

Coverage should prioritize behavior with meaningful business or security risk.

High-priority areas include:

- Authentication
- Authorization
- Tenant isolation
- User management
- Employee management
- Department management
- Session management
- Password operations
- Database transactions
- Activity logging
- Audit logging
- Validation and error handling

Critical failure paths should receive dedicated tests even when they do not significantly change the overall coverage percentage.

## Quality Gates

A change should satisfy the project's automated quality checks before being considered ready for production.

The current quality-gate flow is:

```
Code Change
    │
    ▼
Automated Tests
    │
    ▼
Database / Migration Verification
    │
    ▼
Build Verification
    │
    ▼
CI Checks
    │
    ▼
Ready for Main
```

The specific checks executed by GitHub Actions define the current CI quality gate.

## Test Success

The most fundamental quality gate is that the automated test suite completes successfully.

A successful run currently reports:

```
24 test files passed
338 tests passed
```

A failing test should block promotion until the failure is understood and addressed.

Tests should not be bypassed simply to allow a production deployment to proceed.

## Migration Success

Database-dependent changes also require successful migration verification.

The test migration command is:

```bash
pnpm migrate:test
```

A successful migration run verifies that the current schema can be established or recognized as already applied in the test database.

This is especially important when a pull request introduces a new database migration.

## Build Success

The TypeScript application must also compile successfully before production promotion.

The build step verifies that:

- TypeScript compilation succeeds.
- Required source files are included in the build.
- The production JavaScript output can be generated.
- Build-time configuration remains valid.

A successful local build is not a replacement for CI, but it provides fast feedback before code is pushed.

## CI as a Quality Gate

GitHub Actions provides the automated verification layer between development and the production branch.

The intended workflow is:

```
develop
   │
   ▼
Push / Pull Request
   │
   ▼
GitHub Actions
   ├── Database Migrations (pnpm migrate:test)
   ├── Type Checking (pnpm tsc --noEmit)
   ├── Code Quality (pnpm lint)
   ├── Tests & Coverage (pnpm test:coverage)
   └── Container Build (docker build)
   │
   ▼
All required checks pass
   │
   ▼
Merge to main
   │
   ▼
Railway Production
```

The production branch should not be treated as a bypass around failing CI checks.

## Main Branch Protection

The `main` branch represents the production-ready state of the project.

Changes reaching `main` should therefore have passed the repository's required automated checks.

This creates a clear distinction between:

```
develop
→ active development

main
→ production-ready code
```

and:

```
Railway
→ production deployment from main
```

## Coverage Thresholds

No verified numeric coverage threshold is currently documented for the project.

Until a coverage tool and explicit threshold are configured, the documentation should not claim a requirement such as:

```
80% coverage
90% coverage
```

A future coverage threshold should be introduced deliberately and enforced through CI rather than treated as an informal target.

## Meaningful Coverage

When coverage reporting is introduced, the goal should be to identify meaningful gaps rather than simply increase the percentage.

Examples of high-value uncovered behavior include:

- Authentication failure paths
- Role authorization failures
- Cross-tenant access attempts
- Transaction rollback paths
- Duplicate-resource conflicts
- Invalid refresh sessions
- Soft-delete behavior
- Audit-log persistence

These scenarios often provide more risk reduction than additional tests for straightforward getter or setter logic.

## Quality Gate Failure

When a quality gate fails, the failure should be classified before changing the implementation.

Possible categories include:

```
Test failure
Migration failure
Build failure
Lint / formatting failure
Environment failure
Infrastructure failure
```

The appropriate response depends on the category.

For example:

```
Test failure
→ investigate application behavior

Migration failure
→ investigate schema or database configuration

Build failure
→ investigate TypeScript/build configuration

Environment failure
→ investigate test configuration or CI secrets
```

## No Blind Bypass

Failed quality checks should not be ignored simply because the application appears to work locally.

The purpose of CI is to provide a reproducible verification environment that catches regressions before production deployment.

A temporary bypass may be appropriate only when the reason is explicitly understood and the resulting risk is accepted.

## Relationship to Coverage

Coverage and quality gates complement one another:

```
Coverage
→ Where are we not testing enough?

Quality gate
→ Did the required verification pass?
```

A project can therefore have good quality controls without enforcing an arbitrary coverage percentage.

The eventual coverage policy should support the broader testing strategy rather than replace it.

## Current Project Quality Position

The current project has demonstrated:

```
✅ 24 test files
✅ 338 passing tests
✅ Test database migration verification
✅ TypeScript build verification
✅ GitHub Actions CI
✅ Production deployment from main
```

The exact coverage percentage and automated coverage threshold remain intentionally unspecified until coverage reporting is configured and verified in the repository.

## Future Improvement

When a coverage tool is introduced, the project should consider:

1. Generating coverage reports during CI.
2. Publishing coverage information for pull requests.
3. Defining a minimum acceptable threshold.
4. Protecting critical modules from coverage regression.
5. Reviewing coverage trends rather than relying on a single number.

The quality gate should ultimately answer a practical question:

> **Note**: Has this change been sufficiently verified to be safe to promote to production?

---

### CI Test Execution

GitHub Actions provides the continuous integration layer for the backend.

The purpose of CI is to automatically verify changes in a clean environment before they are promoted to the production branch.

The current workflow is centered around automated tests, test-database migration verification, and build validation.

## CI Workflow

The intended flow is:

```
Developer
    │
    ▼
develop
    │
    ▼
Push / Pull Request
    │
    ▼
GitHub Actions
    │
    ▼
Automated verification
    │
    ▼
All required checks pass
    │
    ▼
Merge to main
    │
    ▼
Railway Production
```

The `develop` branch is used for active development, while `main` represents the production branch.

Railway production is connected to `main`, so production deployment is separated from normal development work.

## Test Execution

The CI environment executes the automated test suite using the project's package scripts.

The current test suite has been verified with:

```
24 test files
338 tests
```

A failing test is treated as a CI failure and should be investigated before the associated change is promoted to production.

## Test Database Migration

Database-dependent CI verification uses the dedicated test environment.

The migration command is:

```bash
pnpm migrate:test
```

The command runs with:

```
NODE_ENV=test
```

and therefore loads the test-specific environment configuration.

The migration process verifies that the test database schema is available before database-dependent tests execute.

A previously initialized database may report:

```
migrate complete — 0 applied, 9 skipped
```

This indicates that all expected migrations are already recorded in the test database.

## Environment Isolation

CI should not use production configuration for automated tests.

The test environment is separated through:

```
NODE_ENV=test
    │
    ▼
.env.test
    │
    ▼
Test database
```

Production configuration remains reserved for the deployed application.

This prevents CI from accidentally modifying the production PostgreSQL database or using production credentials during test execution.

## Build Verification

The TypeScript application is also verified through the project build process.

The build step ensures that the source code can be compiled into the production JavaScript output expected by the Docker deployment.

A successful build confirms that the current source tree can produce the required compiled application artifacts.

## CI Failure as a Quality Gate

CI is treated as a quality gate rather than as an informational status only.

The intended promotion path is:

```
Code change
    │
    ▼
CI checks
   ├── Tests
   ├── Migration verification
   └── Build verification
    │
    ▼
Pass
    │
    ▼
Merge to main
```

A failed check should be resolved or explicitly understood before the change reaches `main`.

## Test and Migration Failures

CI failures should be investigated according to the stage that failed.

### Test Failure

If the test suite fails, investigate:

- Application behavior
- Expected business rules
- Test assumptions
- Test data
- Database state

### Migration Failure

If `pnpm migrate:test` fails, investigate:

- Migration SQL
- Migration order
- Test database configuration
- Database connectivity
- Schema state

### Build Failure

If the build fails, investigate:

- TypeScript errors
- Import resolution
- Build configuration
- Missing dependencies
- Compiler configuration

This separation makes CI failures easier to diagnose.

## Production Deployment Relationship

The project separates CI verification from production deployment.

The intended relationship is:

```
develop
   │
   ▼
GitHub Actions
   │
   ▼
Verification
   │
   ▼
main
   ↓
Railway
```

Railway production is connected to `main`, while development work remains on `develop`.

This prevents routine development pushes from directly representing production state.

## Railway CI Integration

Railway provides a **Wait for CI** deployment option for the production service.

When enabled, Railway can wait for the configured GitHub Actions checks to finish successfully before triggering the production deployment.

The resulting flow is:

```
Push / Merge to main
    │
    ▼
GitHub Actions
    │
    ▼
Checks complete
    │
    ▼
Checks pass
    │
    ▼
Railway deployment
```

This creates an additional protection boundary between source changes and production deployment.

## Reproducibility

CI should provide a consistent execution environment so that the same repository state produces comparable results across developers and automated runs.

The test workflow should therefore avoid depending on:

- Local developer databases
- Production data
- Developer-specific environment variables
- Manually modified external state

The dedicated test configuration and database provide the required isolation.

## Local vs CI Verification

Local verification provides fast feedback before pushing changes.

A typical local sequence is:

```bash
pnpm migrate:test
pnpm test
pnpm build
```

CI then provides an independent verification environment after the code is pushed or submitted for review.

The two workflows complement one another:

```
Local
→ fast developer feedback

CI
→ reproducible repository-level verification
```

## CI Maintenance

The CI workflow should evolve together with the backend.

When a new requirement is introduced, the CI pipeline should be updated when necessary to verify the corresponding behavior.

Examples include:

- New database migrations
- New test suites
- New build requirements
- New security checks
- New quality gates

The goal is to ensure that CI remains an accurate representation of the project's minimum production-readiness checks.

## Current CI Position

The project currently has:

```
✅ GitHub Actions CI
✅ 24 test files
✅ 338 passing tests
✅ Test migration verification
✅ Build verification
✅ develop → main workflow
✅ Railway production deployment
```

The exact GitHub Actions job names, matrix configuration, cache strategy, and workflow-file implementation should remain documented from the repository's current workflow files rather than being inferred.

## CI Principle

The central principle is:

> **Note**: Code should be verified automatically before it becomes production code.

The CI system therefore acts as the automated checkpoint between development and production.

---

### Local Testing Workflow

Local testing provides the fastest feedback loop during backend development.

The goal is to verify application behavior, database compatibility, and build integrity before changes are pushed to GitHub and evaluated by CI.

The recommended local verification sequence is:

```
Code Change
    │
    ▼
Test Database Migration
    │
    ▼
Automated Tests
    │
    ▼
Build
    │
    ▼
Docker Verification
    │
    ▼
Commit
    │
    ▼
Push / Pull Request
    │
    ▼
GitHub Actions
```

## 1. Work on the Development Branch

Normal backend development is performed on the `develop` branch.

```bash
git switch develop
```

Changes should be developed and verified here rather than directly on the production `main` branch.

The intended branch relationship is:

```
develop
    │
    ▼
development + verification
    │
    ▼
CI
    │
    ▼
main
    │
    ▼
Railway Production
```

## 2. Verify the Working Tree

Before testing, check the current Git state:

```bash
git status
```

This helps identify:

- Modified files
- Untracked files
- Changes that may be unrelated to the current task

Reviewing the working tree before committing reduces the risk of accidentally including unrelated changes.

## 3. Run Test Database Migrations

Database-dependent tests use the dedicated test environment.

> **First-time setup**: Before running migrations on a new environment, the test database must exist. Create it once using:
>
> ```bash
> pnpm db:create:test
> ```
>
> This creates the `hr_platform_test` PostgreSQL database with `NODE_ENV=test`. It is required only when provisioning a new local or CI environment. Skip this step if the database already exists.

Run:

```bash
pnpm migrate:test
```

This executes the migration runner with:

```
NODE_ENV=test
```

and targets the test database.

A database that is already current may report:

```
migrate complete — 0 applied, 9 skipped
```

This indicates that all expected migrations are already present.

## 4. Run the Automated Test Suite

After the test database is ready, execute:

```bash
pnpm test
```

The current verified suite contains:

```
24 test files
338 tests
```

A successful test run is a required local quality signal before code is promoted.

## 5. Build the Application

After tests pass, verify the production build:

```bash
pnpm build
```

This verifies that the TypeScript source can be compiled into the production JavaScript output.

The build should also produce the expected compiled artifacts used by the Docker image.

## 6. Verify Docker

Because the backend is containerized, Docker verification should be performed after the application tests and build succeed.

The local Docker environment should be rebuilt when changes affect the image or production runtime:

```bash
docker compose up --build
```

The goal is to verify that:

- The Dockerfile still builds.
- Dependencies install correctly.
- The compiled application is available inside the image.
- PostgreSQL connectivity works through the container network.
- The backend starts correctly.

## 7. Verify Runtime Behavior

After the application starts, verify the health endpoint locally.

The local API follows the same versioned route structure:

```
GET /api/v1/health
```

A healthy response indicates that the application process is running and that the database health check succeeds.

This provides a final runtime check before committing the change.

## 8. Review the Git Diff

Before committing, review exactly what changed:

```bash
git diff
```

For staged changes:

```bash
git diff --cached
```

The purpose is to confirm that:

- Only intended files changed.
- No secrets were added.
- Debugging code was not accidentally committed.
- Generated files are not unexpectedly included.
- Configuration changes are intentional.

## 9. Run the Full Verification Sequence

For a substantial backend change, the complete local verification sequence can be:

```bash
pnpm migrate:test
pnpm test
pnpm build
docker compose up --build
```

The Docker command is normally run as an environment verification step rather than as a command that must remain active while committing.

## 10. Commit the Verified Change

Once local verification succeeds, create a focused commit.

Example:

```bash
git add .
git commit -m "feat(user): add user invitation workflow"
```

Commit messages should describe the logical change represented by the commit.

Unrelated changes should not be mixed into the same commit merely because they happen to be present in the working tree.

## 11. Push the Development Branch

Push verified development work:

```bash
git push origin develop
```

This allows GitHub Actions to independently verify the repository state.

The expected flow is:

```
Local verification
    │
    ▼
git push
    │
    ▼
GitHub Actions
    │
    ▼
CI verification
```

## 12. Promote to Main

Once the change has passed the required CI checks, it can be merged from `develop` into `main`.

The production branch represents the production-ready state:

```
develop
    │
    ▼
CI passes
    │
    ▼
merge
    │
    ▼
main
```

Railway production is connected to `main`, so changes reaching `main` can trigger the production deployment workflow.

## Local Workflow Summary

The practical workflow can be summarized as:

```
1. git switch develop
    │
    ▼
2. Make code changes
    │
    ▼
3. git status
    │
    ▼
4. pnpm migrate:test
    │
    │
    ▼
5. pnpm test
    │
    ▼
6. pnpm build
    │
    ▼
7. docker compose up --build
    │
    ▼
8. Verify health endpoint
    │
    ▼
9. git diff
    │
    ▼
10. Commit
    │
    ▼
11. git push origin develop
    │
    ▼
12. GitHub Actions
    │
    ▼
13. Merge to main
    │
    ▼
14. Railway Production
```

## When Every Step Is Necessary

Not every small change requires the exact same amount of verification.

A documentation-only change may not require database migrations or a Docker rebuild.

A database schema change should include migration and database verification.

A production-runtime or Dockerfile change should include Docker verification.

An authentication or authorization change should include the relevant automated tests and, where appropriate, API-level verification.

The scope of local testing should therefore match the risk of the change.

## Local Testing Principle

The local workflow should provide confidence before the change reaches CI.

The principle is:

> **Note**: Fix problems locally before asking CI or production to discover them.

This reduces feedback time, keeps CI failures meaningful, and prevents unnecessary production deployments caused by changes that could have been caught during local development.

---

### Failure Investigation

The testing and deployment workflow relies on systematic failure investigation rather than repeatedly changing configuration until a failure disappears.

When a test, migration, build, or deployment fails, the first objective is to identify the exact layer responsible for the failure.

## Failure Investigation Principle

The general investigation flow is:

```
Failure
    │
    ▼
Identify failing stage
    │
    ▼
Read the exact error
    │
    ▼
Reproduce locally when possible
    │
    ▼
Identify root cause
    │
    ▼
Apply the smallest appropriate fix
    │
    ▼
Run the affected verification again
    │
    ▼
Run broader verification
```

The goal is to fix the underlying problem rather than hiding the symptom.

## Identify the Failing Layer

Backend failures should first be classified according to where they occur.

Common layers include:

```
Application tests
Database / migrations
TypeScript build
Docker build
Container startup
Environment configuration
HTTP networking
CI
Production deployment
```

The failure category determines which evidence should be inspected first.

## Test Failures

When `pnpm test` fails, start with:

1. The failing test name.
2. The assertion or exception.
3. The test setup.
4. The application code exercised by the test.
5. Related database state when applicable.

The first failing test should be investigated before assuming that later failures are independent.

A test failure should not be "fixed" by weakening the assertion unless the expected behavior itself has intentionally changed.

## Migration Failures

When `pnpm migrate:test` fails, inspect:

- The migration filename.
- The SQL statement that failed.
- The PostgreSQL error.
- Migration ordering.
- Current migration-tracking state.
- Test database configuration.

A successful migration can also fail operationally even after the SQL has completed.

For example, the migration runner previously reached:

```
migrate complete — 9 applied, 0 skipped
```

but the process did not exit cleanly.

The investigation then moved beyond the SQL itself and examined resource cleanup and logger behavior. This demonstrated the importance of distinguishing **database success** from **process completion**.

## Environment Failures

Environment failures often appear as missing-variable errors.

An earlier production deployment failed with:

```
Missing environment variable: DATABASE_HOST
```

The investigation showed that the deployed environment and current application configuration were not yet aligned around the `DATABASE_URL` strategy.

The correct approach was to align:

```
Application configuration
        +
Railway environment variables
        +
PostgreSQL service
```

rather than adding unrelated legacy variables simply to make the error disappear.

## Build Failures

When the TypeScript build fails, first verify:

```bash
pnpm build
```

Then inspect:

- Compiler errors.
- Import paths.
- Module resolution.
- Included source files.
- Build configuration.
- Generated output.

A useful verification is to confirm that an expected compiled artifact exists.

For example:

```powershell
Test-Path dist/database/migrate.js
```

A successful result confirms that the local build generated the migration entry point.

## Docker Failures

Docker failures should be separated into:

```
Image build failure
```

and:

```
Container runtime failure
```

A build failure means the image could not be created.

A runtime failure means the image was created but the application failed after startup.

The Dockerfile and build context should be checked carefully when a file exists locally but is missing inside the container.

## Container Runtime Failures

When the container starts but the application crashes, inspect the startup logs.

For example, a runtime error such as:

```
Cannot find module '/app/dist/database/migrate.js'
```

indicates that the problem is no longer Docker image creation but the runtime filesystem or startup configuration.

The investigation should then compare:

```
Local build output
    │
    ▼
Docker build context
    │
    ▼
Production image filesystem
    │
    ▼
Start / migration command
```

## Environment and Container Separation

A local success does not automatically prove that the production container has the same environment.

Production investigation should therefore verify:

- Root directory.
- Docker build context.
- Environment variables.
- Start command.
- Pre-deploy command.
- Injected `PORT`.
- Database connection.
- Compiled output.

This is especially important in monorepo deployments where the application lives under a subdirectory such as `backend/`.

## HTTP and Networking Failures

A `502 Bad Gateway` does not necessarily mean the application code itself is broken.

Investigation should verify:

```
Public domain
    │
    ▼
Railway proxy
    │
    ▼
Container port
    │
    ▼
Application bind address
    │
    ▼
Express server
```

A previous production networking issue was resolved by explicitly binding the Express server to:

```ts
app.listen(env.port, '0.0.0.0', ...)
```

This made the application available through all container network interfaces rather than relying on an implicit bind configuration.

## Port Investigation

Production applications should use the platform-provided `PORT` rather than hard-coding a cloud-specific port.

The application's current configuration uses:

```
process.env.PORT ?? 4000
```

This means:

```
Local
→ 4000 fallback

Railway
→ platform-provided PORT
```

When a production networking failure occurs, the application logs should be checked to determine the actual listening port before changing the networking configuration.

## CI Failures

GitHub Actions failures should be investigated from the failed job and step rather than from the overall red status alone.

The investigation should determine whether the failure is caused by:

- Test behavior
- Migration setup
- Environment configuration
- Build failure
- Dependency installation
- CI-specific infrastructure

A CI failure should be reproduced locally whenever practical.

## Production Deployment Failures

Railway deployment failures should be classified by stage:

```
Source / checkout
    │
    ▼
Build
    │
    ▼
Image creation
    │
    ▼
Container startup
    │
    ▼
Pre-deploy / migration
    │
    ▼
Application startup
    │
    ▼
Health check
    │
    ▼
Public networking
```

This avoids treating every deployment failure as an application-code problem.

## Read the First Meaningful Error

Deployment logs often contain repeated errors because a platform restarts a failed process.

The first meaningful error is usually more valuable than the final repeated stack trace.

For example:

```
Missing environment variable: DATABASE_HOST
```

is more informative than repeatedly seeing:

```
Node.js process exited...
```

The investigation should focus on the earliest actionable failure.

## Reproduction Strategy

When possible, reproduce the failure at the narrowest environment that still demonstrates it.

Examples:

```
Local test failure
→ reproduce with pnpm test

Migration failure
→ reproduce with pnpm migrate:test

Build failure
→ reproduce with pnpm build

Docker failure
→ reproduce with docker compose up --build

HTTP failure
→ reproduce against local or deployed endpoint
```

This reduces debugging time and prevents unrelated production configuration from obscuring the actual cause.

## Smallest-Change Principle

Fixes should be as narrow as possible.

For example, when the migration process finished successfully but did not exit, the investigation did not immediately replace the migration system. Instead, the logger transport was examined and the test environment behavior was adjusted.

Likewise, the Railway `DATABASE_URL` problem was addressed through environment configuration rather than adding unrelated database variables.

The principle is:

> **Note**: Change only what is necessary to correct the identified root cause.

## Verification After a Fix

Every fix should be followed by verification at the same level where the failure occurred.

Then broader verification should be performed where practical.

Example:

```
Fix logger
    │
    ▼
pnpm migrate:test
    │
    ▼
pnpm test
    │
    ▼
pnpm build
    │
    ▼
CI
```

For a networking fix:

```
Fix server bind address
    │
    ▼
pnpm build
    │
    ▼
Docker verification
    │
    ▼
Railway deployment
   ↓
GET /api/v1/health
```

## Avoiding Symptom Fixes

A failure should not be resolved by adding configuration that merely suppresses the immediate error without understanding why the application requested it.

Examples of poor debugging practices include:

- Adding legacy environment variables unnecessarily.
- Disabling a failing test without understanding the behavior.
- Hard-coding production ports.
- Bypassing failed CI checks.
- Ignoring migration failures.
- Removing validation solely to make a request succeed.

Such fixes may hide the problem while leaving the underlying defect intact.

## Documentation of Significant Failures

Significant infrastructure or testing failures should be documented when they reveal important architectural lessons.

Examples include:

- Test-process lifecycle issues.
- Environment configuration mismatches.
- Monorepo Docker build-context problems.
- Production networking configuration.
- Migration execution behavior.

Documenting these failures turns debugging experience into reusable engineering knowledge.

## Current Investigation Model

The project's preferred debugging sequence is:

```
1. Identify the exact failing stage
2. Read the first meaningful error
3. Reproduce locally when possible
4. Inspect the relevant configuration/code
5. Form a root-cause hypothesis
6. Apply the smallest fix
7. Re-run the affected check
8. Run broader verification
9. Commit only after verification passes
10. Promote through CI and production
```

## Failure Investigation Principle

The central principle is:

> **Note**: Diagnose the system layer that actually failed before changing the code.

This keeps debugging deliberate, minimizes unnecessary changes, and makes the testing and deployment workflow more reliable as the platform grows.

---

### Document Index

This document is part of the **Multi-Tenant SaaS HR Platform** technical documentation suite.

| Document                                                | Description                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01 — Project Overview](./01-project-overview.md)       | Business domain, project goals, and overall scope                               |
| [02 — System Architecture](./02-system-architecture.md) | Application architecture, module organization, and request lifecycle            |
| [03 — Database Design](./03-database-design.md)         | Entity relationships, database schema, and design decisions                     |
| [04 — API Reference](./04-api-reference.md)             | REST API conventions, endpoints, request/response standards, and authentication |
| **05 — Testing Strategy** _(this document)_             | Testing approach, project structure, and quality assurance practices            |
| [06 — Docker Guide](./06-docker-guide.md)               | Local development, production containers, and Docker workflow                   |
| [07 — CI/CD Pipeline](./07-ci-cd-pipeline.md)           | GitHub Actions workflow, automated validation, and Docker verification          |
| [08 — Deployment Guide](./08-deployment-guide.md)       | Production deployment process and infrastructure configuration                  |
| [09 — Development Roadmap](./09-development-roadmap.md) | Development phases, completed milestones, and future work                       |
| [10 — Future Enhancements](./10-future-enhancements.md) | Planned improvements, scalability considerations, and long-term vision          |
