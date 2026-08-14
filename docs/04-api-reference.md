> **Multi-Tenant SaaS HR Platform Documentation**
>
> [01 Project Overview](./01-project-overview.md) • [02 System Architecture](./02-system-architecture.md) • [03 Database Design](./03-database-design.md) • **[04 API Reference](./04-api-reference.md)** • [05 Testing Strategy](./05-testing-strategy.md) • [06 Docker Guide](./06-docker-guide.md) • [07 CI/CD Pipeline](./07-ci-cd-pipeline.md) • [08 Deployment Guide](./08-deployment-guide.md) • [09 Development Roadmap](./09-development-roadmap.md) • [10 Future Enhancements](./10-future-enhancements.md)

---

# API Reference

## API Reference Overview

The **Multi-Tenant SaaS HR Platform** exposes its backend functionality through a versioned REST API. This document serves as the reference for the HTTP interface exposed by the backend, including endpoint structure, request and response conventions, authentication requirements, validation behavior, and available resources.

The API is organized under the `/api/v1` prefix to provide an explicit version boundary for the public interface.

### Base URL

The API version prefix is:

`/api/v1`

### API Responsibilities

The API acts as the boundary between client applications and the backend application modules. It is responsible for exposing business capabilities through HTTP while enforcing the architectural concerns defined elsewhere in the project, including authentication, authorization, request validation, error handling, and tenant isolation.

### Resource-Oriented Design

API endpoints are organized around business resources rather than internal implementation details. Controllers and services may change internally without requiring unnecessary changes to the external API contract.

### Versioning

The API uses explicit URI versioning through the `/api/v1` prefix.

This provides a stable boundary for existing clients while allowing future versions to evolve independently when backward-incompatible changes become necessary.

### Production Deployment

The API is deployed as a containerized backend service and is connected to the platform's managed PostgreSQL database through a production `DATABASE_URL` configuration.

When deployed to production, the API is intended for demonstration, portfolio review, API testing, and continued development of the platform.

### Scope of This Document

This document describes the API contract exposed by the current implementation. Endpoint details should remain synchronized with the actual backend routes and application behavior.

The API reference is therefore treated as a living document and should be updated whenever externally visible API behavior changes.

---

## Table of Contents

- [Authentication Endpoints (`/api/v1/auth`)](#authentication)
- [Organization Endpoints (`/api/v1/organizations`)](#organization-endpoints)
- [User Endpoints (`/api/v1/users`)](#user-endpoints)
- [Employee Endpoints (`/api/v1/employees`)](#employee-endpoints)
- [Department Endpoints (`/api/v1/departments`)](#department-endpoints)
- [Profile Endpoints (`/api/v1/profile`)](#profile-endpoints)
- [Activity Log Endpoints (`/api/v1/activities`)](#activity-endpoints)
- [Audit Log Endpoints (`/api/v1/audits`)](#audit-endpoints)
- [Health Endpoints (`/api/v1/health`)](#health-endpoints)
- [Common Request and Response Conventions](#common-request-and-response-conventions)
- [Error Response Standard](#error-response-standard)
- [HTTP Status Codes](#http-status-codes)
- [Pagination, Filtering & Sorting](#pagination-filtering--sorting)
- [API Examples](#api-examples)
- [API Evolution](#api-evolution)
- [Document Index](#document-index)

---

## Authentication

The Authentication API manages organization registration, user login, token renewal, session termination, and session invalidation across the platform.

Authentication endpoints are exposed under the `/api/v1/auth` resource path.

The authentication system uses short-lived access tokens together with refresh tokens backed by persistent application sessions. This allows authenticated clients to access protected resources while supporting token renewal and explicit session revocation.

### Authentication Endpoints

The current authentication API provides the following endpoints:

| Method | Endpoint                  | Authentication         |
| ------ | ------------------------- | ---------------------- |
| POST   | `/api/v1/auth/register`   | Public                 |
| POST   | `/api/v1/auth/login`      | Public                 |
| POST   | `/api/v1/auth/refresh`    | Public                 |
| POST   | `/api/v1/auth/logout`     | Refresh Token Required |
| POST   | `/api/v1/auth/logout-all` | Required               |

The route definitions apply request validation to the registration, login, refresh, and logout endpoints. The `logout-all` endpoint additionally requires an authenticated request.

### Organization Registration

`POST /api/v1/auth/register`

Registers a new organization together with its initial owner account and employee record.

The registration workflow executes within a database transaction. It verifies that the organization name and slug are not already in use, creates the organization, seeds the default roles, creates the initial employee, creates the owner user, creates the associated profile, and records the corresponding audit events.

A successful registration returns HTTP `201 Created` with the message:

`Organization registered successfully.`

The current response does not return resource data and instead returns `data: null`.

### User Login

`POST /api/v1/auth/login`

Authenticates a user using the supplied organization slug and email credentials.

The authentication workflow first resolves the organization and user, verifies the supplied password, and confirms that the user account is active. Invalid credentials result in an authentication failure, while an inactive account results in an authorization-related failure.

When authentication succeeds, the service creates a persistent session and issues an access token and refresh token. The response also includes the authenticated user's identifiers and authorization context, including the organization, employee, and role identifiers.

A successful login returns HTTP `200 OK` with the message:

`Login successful.`

### Token Refresh

`POST /api/v1/auth/refresh`

Renews an authentication session using a valid refresh token.

The refresh workflow verifies the refresh token, locates the corresponding session, checks that the session has not been revoked or expired, and compares the supplied refresh token against the stored token hash. A successful refresh issues a new access-token and refresh-token pair and updates the stored session information.

### Logout

`POST /api/v1/auth/logout`

Terminates the session associated with a supplied refresh token.

The service verifies the refresh token, validates the corresponding session, and revokes that session. A corresponding audit event is recorded for the logout operation.

A successful logout returns HTTP `200 OK` with the message:

`Logout successful.`

### Logout All Sessions

`POST /api/v1/auth/logout-all`

Terminates all active sessions belonging to the authenticated user.

This endpoint requires authentication and obtains the user and organization identifiers from the authenticated request context. The service revokes all sessions for the user and records an audit event for the operation.

A successful operation returns HTTP `200 OK` with the message:

`All sessions logged out successfully.`

### Token and Session Model

The authentication system separates access-token usage from persistent session management.

The login workflow creates a session containing the user, organization, and role context, while the refresh-token hash and session expiration information are persisted in the database.

Refresh operations rotate the stored refresh-token information and update session usage metadata. This provides a server-side mechanism for invalidating sessions independently of access-token expiration.

### Authentication Error Behavior

Authentication failures are handled using standardized application errors.

Invalid credentials and invalid or expired refresh tokens result in unauthorized errors, while inactive user accounts result in a forbidden error. Registration conflicts such as duplicate organization names or slugs are handled as conflict errors.

Detailed error formatting and the complete API error-response structure are documented separately in the API error and response sections.

### Authentication Flow

The overall authentication flow can be summarized as:

```
Client
  │
  ▼
`POST /api/v1/auth/login`
  │
  ▼
Request validation
  │
  ▼
Organization and user lookup
  │
  ▼
Password verification
  │
  ▼
Account status verification
  │
  ▼
Session creation
  │
  ▼
Access + refresh token issuance
  │
  ▼
API response
```

Subsequent protected requests use the access token, while the refresh endpoint can issue a new token pair when the persisted session remains valid.

### Authentication Request & Response Schemas

The Authentication API validates incoming request bodies using Zod schemas before they reach the authentication services. Each endpoint defines an explicit request contract that determines which fields are required and what values are considered valid.

Authentication responses follow the platform's standard API success-response structure. Successful authentication operations return relevant authentication data while operations that do not produce resource data return `data: null`.

### Organization Registration Request

`POST /api/v1/auth/register`

The registration endpoint accepts the following fields:

| Field           | Type   | Required | Validation                                                                         |
| --------------- | ------ | -------: | ---------------------------------------------------------------------------------- |
| `name`          | string |      Yes | Trimmed; 3–100 characters                                                          |
| `slug`          | string |      Yes | Trimmed, lowercase; 3–100 characters; lowercase letters, numbers, and hyphens only |
| `ownerEmail`    | string |      Yes | Valid email address; trimmed and normalized to lowercase                           |
| `password`      | string |      Yes | 8–100 characters                                                                   |
| `firstName`     | string |      Yes | Trimmed; 1–100 characters                                                          |
| `middleName`    | string |       No | Trimmed; maximum 100 characters                                                    |
| `lastName`      | string |      Yes | Trimmed; 1–100 characters                                                          |
| `nameExtension` | string |       No | Trimmed; maximum 20 characters                                                     |

The registration schema normalizes organization slugs and email addresses to lowercase before the validated input reaches the application service.

Example request:

```json
{
  "name": "Acme Corporation",
  "slug": "acme-corporation",
  "ownerEmail": "admin@acme.com",
  "password": "secure-password",
  "firstName": "John",
  "middleName": "M",
  "lastName": "Doe",
  "nameExtension": "Jr."
}
```

A successful registration returns:

```json
{
  "success": true,
  "message": "Organization registered successfully.",
  "data": null
}
```

The endpoint responds with HTTP `201 Created`.

### Login Request

`POST /api/v1/auth/login`

The login endpoint accepts:

| Field              | Type   | Required | Validation                                               |
| ------------------ | ------ | -------: | -------------------------------------------------------- |
| `organizationSlug` | string |      Yes | Minimum 1 character; trimmed and normalized to lowercase |
| `email`            | string |      Yes | Valid email address; trimmed and normalized to lowercase |
| `password`         | string |      Yes | At least 1 character                                     |

Example request:

```json
{
  "organizationSlug": "acme-corporation",
  "email": "admin@acme.com",
  "password": "secure-password"
}
```

A successful login returns a `LoginResult` containing the authenticated user's identifiers and a token pair.

Example response:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "user-uuid",
      "organizationId": "organization-uuid",
      "employeeId": "employee-uuid",
      "roleId": "role-uuid",
      "email": "admin@acme.com"
    },
    "tokens": {
      "accessToken": "access-token",
      "refreshToken": "refresh-token"
    }
  }
}
```

The login endpoint responds with HTTP `200 OK`.

### Refresh Token Request

`POST /api/v1/auth/refresh`

The refresh endpoint accepts:

| Field          | Type   | Required | Validation                    |
| -------------- | ------ | -------: | ----------------------------- |
| `refreshToken` | string |      Yes | At least 1 character; trimmed |

Example request:

```json
{
  "refreshToken": "refresh-token"
}
```

A successful refresh returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "access-token",
    "refreshToken": "refresh-token"
  }
}
```

The refresh service validates the token and its associated session before issuing the new token pair.

### Logout Request

`POST /api/v1/auth/logout`

The logout endpoint uses the same request structure as the refresh endpoint:

```json
{
  "refreshToken": "refresh-token"
}
```

The `refreshToken` field is required, must contain at least one character, and is trimmed during validation.

A successful logout returns:

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

with HTTP `200 OK`.

### Logout All Sessions Request

`POST /api/v1/auth/logout-all`

This endpoint does not require a request body containing a refresh token.

Instead, it requires an authenticated request and obtains the current user and organization identifiers from the authenticated request context.

A successful response is:

```json
{
  "success": true,
  "message": "All sessions logged out successfully.",
  "data": null
}
```

with HTTP `200 OK`.

### Token Structure

The authentication types define a token pair containing:

```json
{
  "accessToken": "string",
  "refreshToken": "string"
}
```

The JWT payload contains the session identifier, user identifier, organization identifier, and role identifier:

```json
{
  "sid": "session-uuid",
  "sub": "user-uuid",
  "organizationId": "organization-uuid",
  "roleId": "role-uuid"
}
```

The `sid` identifies the persistent authentication session, while `sub` identifies the authenticated user.

### Validation Behavior

Request validation occurs before authentication controller logic executes. Invalid input is rejected according to the corresponding Zod schema rather than being passed directly to the authentication services. The schemas also normalize selected string values, particularly organization slugs and email addresses, before processing.

### Contract Stability

The request and response structures documented in this section represent the current authentication API contract. Any externally visible change to required fields, validation rules, response properties, or token structures should be reflected in this document alongside the corresponding implementation changes.

---

## Organization Endpoints

The Organization API manages access to the authenticated user's current organization. The current implementation intentionally operates on the organization associated with the authenticated request rather than accepting an organization identifier as part of the public URL.

Organization endpoints are available under:

`/api/v1/organizations`

All currently exposed organization endpoints require authentication and restrict access to users with either the `owner` or `administrator` role.

### Get Current Organization

`GET /api/v1/organizations/me`

Retrieves the organization associated with the authenticated user.

#### Authentication

Authentication is required.

The endpoint also requires one of the following roles:

- `owner`
- `administrator`

The organization identifier is obtained from the authenticated request context rather than from a client-supplied path parameter.

#### Successful Response

The controller returns HTTP `200 OK` with the message:

`Organization retrieved successfully.`

The response data contains the organization record returned by the organization service.

The exact structure of the `data` object is defined by the current `OrganizationRow` type and should remain synchronized with that implementation.

#### Business Rules

The organization service verifies that the requested organization exists.

If the organization cannot be found, the operation returns an organization-not-found error.

The service also checks whether the organization has been revoked. A revoked organization is treated as inactive and results in a forbidden error.

### Update Current Organization

`PATCH /api/v1/organizations/me`

Updates information belonging to the authenticated user's current organization.

#### Authentication

Authentication is required.

The endpoint is restricted to:

- `owner`
- `administrator`

The authenticated user's organization identifier is used to determine which organization is updated. The authenticated user's identifier is also used as the actor for activity and audit logging.

#### Request Body

The current update schema accepts only the organization name:

| Field  | Type   | Required | Validation                                            |
| ------ | ------ | -------: | ----------------------------------------------------- |
| `name` | string |      Yes | Trimmed; minimum 3 characters; maximum 100 characters |

The schema does not currently expose `slug` as an updateable field.

Example request:

```json
{
  "name": "Acme Corporation"
}
```

#### Successful Response

A successful update returns HTTP `200 OK` with the message:

`Organization updated successfully.`

The response `data` contains the updated organization record returned by the service.

#### Business Rules

The organization service updates the organization identified by the authenticated user's organization context.

If no matching organization exists, the service returns an organization-not-found error.

The service also prevents updates to revoked organizations by returning a forbidden error when the organization is inactive.

Successful updates generate both an activity log entry and an audit log entry using the authenticated user as the actor.

### Organization Access Model

The current API deliberately uses the `/me` resource pattern rather than exposing an organization identifier such as:

`/api/v1/organizations/:organizationId`

This keeps organization access tied to the authenticated tenant context and reduces the risk of clients attempting to operate on an unrelated organization's identifier.

The route, authorization middleware, and service layer work together to establish the following flow:

```
Client
  │
  ▼
Authentication
  │
  ▼
Role Authorization
  │
  ▼
Authenticated Organization Context
  │
  ▼
Organization Service
  │
  ▼
Tenant-Scoped Operation
```

### Current API Scope

The current Organization API is intentionally limited to the operations implemented by the backend:

- Retrieve the current organization
- Update the current organization's name

Organization creation is handled as part of the registration workflow documented in the Authentication section rather than through a standalone organization-creation endpoint.

No standalone organization deletion or slug-update endpoint is currently exposed by the provided implementation.

---

## User Endpoints

The User API manages platform user accounts within the authenticated user's organization.

All user operations are tenant-scoped through the authenticated user's `organizationId`. User-management operations are additionally protected by role-based authorization.

The current User API is available under:

`/api/v1/users`

### User Access Model

All current User endpoints require authentication.

Read operations are available to:

- `owner`
- `administrator`
- `hr_manager`

User creation, invitation, updates, and account activation are restricted to:

- `owner`
- `administrator`

These role requirements are enforced through the `requireRole` middleware in the route layer.

### List Users

`GET /api/v1/users`

Retrieves users belonging to the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The organization is resolved from the authenticated request context rather than from a client-supplied organization identifier.

#### Successful Response

Returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": []
}
```

The response `data` contains an array of `UserRow` objects.

Each user record currently contains:

| Field            | Type         |
| ---------------- | ------------ |
| `id`             | string       |
| `employeeId`     | string       |
| `organizationId` | string       |
| `roleId`         | string       |
| `email`          | string       |
| `status`         | `UserStatus` |
| `createdAt`      | Date         |
| `updatedAt`      | Date         |

### Get User by ID

`GET /api/v1/users/:userId`

Retrieves a specific user within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The requested `userId` is combined with the authenticated `organizationId` when retrieving the user, preserving tenant isolation.

#### Successful Response

Returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "User retrieved successfully.",
  "data": {
    "id": "user-uuid",
    "employeeId": "employee-uuid",
    "organizationId": "organization-uuid",
    "roleId": "role-uuid",
    "email": "user@example.com",
    "status": "active",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

If the user does not exist within the authenticated organization, the service raises a not-found error.

### Create User

`POST /api/v1/users`

Creates a user account for an existing employee within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The route applies the `createUserSchema` before invoking the service.

#### Request Body

The current `createUserSchema` accepts:

| Field        | Type   | Required | Validation                                               |
| ------------ | ------ | -------: | -------------------------------------------------------- |
| `employeeId` | UUID   |      Yes | Must be a valid UUID                                     |
| `roleId`     | UUID   |      Yes | Must be a valid UUID                                     |
| `email`      | string |      Yes | Valid email address; trimmed and normalized to lowercase |
| `password`   | string |      Yes | Minimum 8 characters                                     |

Example request:

```json
{
  "employeeId": "employee-uuid",
  "roleId": "role-uuid",
  "email": "user@example.com",
  "password": "secure-password"
}
```

#### Business Rules

The service validates that:

1. The referenced employee exists within the organization.
2. The employee does not already have a user account.
3. The specified role exists within the organization.
4. The email address is not already used by another user in the same organization.

The supplied password is hashed before the user account is persisted.

A profile is also created for the new user. Activity and audit log records are generated for the creation operation.

The new account is created with an `active` status.

#### Successful Response

Returns HTTP `201 Created` with:

```json
{
  "success": true,
  "message": "User created successfully.",
  "data": {
    "id": "user-uuid",
    "employeeId": "employee-uuid",
    "organizationId": "organization-uuid",
    "roleId": "role-uuid",
    "email": "user@example.com",
    "status": "active",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

### Invite User

`POST /api/v1/users/invite`

Creates a user account in an invited state without assigning a password.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The route validates the request using `inviteUserSchema`.

#### Request Body

The current `inviteUserSchema` accepts:

| Field        | Type   | Required | Validation                                               |
| ------------ | ------ | -------: | -------------------------------------------------------- |
| `employeeId` | UUID   |      Yes | Must be a valid UUID                                     |
| `roleId`     | UUID   |      Yes | Must be a valid UUID                                     |
| `email`      | string |      Yes | Valid email address; trimmed and normalized to lowercase |

Unlike direct user creation, no password field is accepted. The invited account is created without a password and receives an `invited` status.

Example request:

```json
{
  "employeeId": "employee-uuid",
  "roleId": "role-uuid",
  "email": "user@example.com"
}
```

#### Business Rules

The service validates that:

1. The referenced employee exists within the organization.
2. The employee does not already have a user account.
3. The specified role exists within the organization.
4. The email address is not already used by another user in the organization.

Unlike normal user creation, the invited account is created without a password and receives an `invited` status.

A profile is created for the user, and activity and audit log entries are generated for the invitation.

#### Successful Response

Returns HTTP `201 Created` with:

```json
{
  "success": true,
  "message": "User invited successfully.",
  "data": {
    "id": "user-uuid",
    "employeeId": "employee-uuid",
    "organizationId": "organization-uuid",
    "roleId": "role-uuid",
    "email": "user@example.com",
    "status": "invited",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

### Update User

`PATCH /api/v1/users/:userId`

Updates the details of an existing user within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The route applies `updateUserSchema` before invoking the service.

#### Request Body

The current `updateUserSchema` accepts the following optional fields:

| Field        | Type         | Required | Validation                                               |
| ------------ | ------------ | -------: | -------------------------------------------------------- |
| `employeeId` | UUID         |       No | Must be a valid UUID when provided                       |
| `roleId`     | UUID         |       No | Must be a valid UUID when provided                       |
| `email`      | string       |       No | Valid email address; trimmed and normalized to lowercase |
| `password`   | string       |       No | Minimum 8 characters when provided                       |
| `status`     | `UserStatus` |       No | Valid status (`active`, `invited`, `suspended`)          |

All fields are optional. A request body may include any combination of the updatable fields.

Example request:

```json
{
  "email": "updated@example.com",
  "roleId": "role-uuid"
}
```

#### Business Rules

The service first confirms that the target user exists within the organization.

If a new role is supplied, the referenced role must exist within the same organization.

If the email is changed, the new email must not already be assigned to another user within the organization.

If a new password is supplied, it is hashed before persistence.

Successful updates generate both activity and audit log entries.

#### Successful Response

Returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "User updated successfully.",
  "data": {
    "id": "user-uuid",
    "employeeId": "employee-uuid",
    "organizationId": "organization-uuid",
    "roleId": "role-uuid",
    "email": "user@example.com",
    "status": "active",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

### Activate User

`PATCH /api/v1/users/:userId/activate`

Activates a previously inactive user account.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

No request-body validation middleware is applied to this endpoint.

#### Business Rules

The service first verifies that the user exists within the authenticated organization.

If the account is already active, the operation returns a conflict error.

Otherwise, the account is activated and corresponding activity and audit log entries are generated.

#### Successful Response

Returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "User account activated successfully.",
  "data": {
    "id": "user-uuid",
    "employeeId": "employee-uuid",
    "organizationId": "organization-uuid",
    "roleId": "role-uuid",
    "email": "user@example.com",
    "status": "active",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

### Tenant Isolation

User operations consistently use the authenticated user's `organizationId` when querying, creating, updating, or activating user accounts.

This prevents a user-management request from operating on records belonging to another organization, even when a client supplies a specific `userId`.

The organization identifier is therefore treated as trusted tenant context established by authentication rather than as client-provided input.

### User Lifecycle

The current implementation supports multiple user states through `UserStatus`.

Normal user creation produces an `active` account, while invitation produces an `invited` account without a password. Existing accounts can subsequently be activated through the dedicated activation endpoint.

This lifecycle allows account creation and account access to be managed separately from the employee's underlying HR record.

### Current API Scope

The current User API provides:

- Organization-scoped user listing
- Organization-scoped user retrieval
- Direct user creation
- User invitation
- User updates
- User account activation

The provided implementation does not expose a standalone user deletion endpoint.

---

## Employee Endpoints

The Employee API manages workforce records belonging to the authenticated user's organization.

All employee endpoints require authentication and are restricted to users with one of the following roles:

- `owner`
- `administrator`
- `hr_manager`

The API is tenant-scoped through the authenticated user's `organizationId`. Employee identifiers supplied by clients are always resolved within that organization context.

The current Employee API is available under:

`/api/v1/employees`

### List Employees

`GET /api/v1/employees`

Retrieves the active employees belonging to the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The organization is determined from the authenticated request context rather than from a client-supplied organization identifier.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Employees retrieved successfully.`

The response `data` contains an array of employee records returned by the employee service.

### Get Employee by ID

`GET /api/v1/employees/:employeeId`

Retrieves a specific employee within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The supplied `employeeId` is resolved together with the authenticated `organizationId`, preserving tenant isolation.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Employee retrieved successfully.`

The response `data` contains the employee record returned by the employee service.

If the employee does not exist within the authenticated organization, the service raises an employee-not-found error.

### Create Employee

`POST /api/v1/employees`

Creates a new employee record for the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The request body is validated using `createEmployeeSchema` before the service is executed.

#### Request Body

The current registration schema accepts:

| Field              | Type   | Required | Validation                                                          |
| ------------------ | ------ | -------: | ------------------------------------------------------------------- |
| `firstName`        | string |      Yes | Trimmed; 1–100 characters                                           |
| `middleName`       | string |       No | Trimmed; maximum 100 characters                                     |
| `lastName`         | string |      Yes | Trimmed; 1–100 characters                                           |
| `nameExtension`    | string |       No | Trimmed; maximum 20 characters                                      |
| `jobTitle`         | string |      Yes | Trimmed; 1–150 characters                                           |
| `employmentStatus` | enum   |      Yes | Normalized to lowercase and validated against `EMPLOYMENT_STATUSES` |
| `hireDate`         | date   |      Yes | Coerced to a date; must not be in the future                        |
| `departmentId`     | UUID   |       No | Must be a valid UUID when provided                                  |

The schema normalizes employment status input by trimming and converting string values to lowercase.

Example request:

```json id="4s8g4d"
{
  "firstName": "John",
  "middleName": "M.",
  "lastName": "Doe",
  "nameExtension": "Jr.",
  "jobTitle": "Software Engineer",
  "employmentStatus": "regular",
  "hireDate": "2026-08-10",
  "departmentId": "department-uuid"
}
```

#### Business Rules

When a department identifier is provided, the referenced department must belong to the authenticated organization.

A department that cannot be found within that tenant results in a not-found error.

The employee number is generated by the application rather than supplied by the client.

Successful creation records both an activity log and an audit log event.

The operation is executed within a database transaction.

#### Successful Response

Returns HTTP `201 Created` with the message:

`Employee created successfully.`

The response `data` contains the newly created employee record.

### Update Employee

`PATCH /api/v1/employees/:employeeId`

Updates an existing employee within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The request body is validated using `updateEmployeeSchema`.

Because the update schema is created with `.partial()`, every employee field is optional during an update request.

#### Request Body

The update endpoint supports the same fields as employee creation, but none are individually required:

- `firstName`
- `middleName`
- `lastName`
- `nameExtension`
- `jobTitle`
- `employmentStatus`
- `hireDate`
- `departmentId`

The same field-level validation rules apply to values that are supplied.

#### Business Rules

The service first verifies that the target employee belongs to the authenticated organization.

When `departmentId` is supplied, the referenced department must exist within the same organization.

The employee update is executed within a transaction and generates both activity and audit log entries.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Employee updated successfully.`

The response `data` contains the updated employee record.

### Delete Employee

`DELETE /api/v1/employees/:employeeId`

Deletes an employee from normal active queries using the platform's soft-delete mechanism.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

#### Business Rules

The service first verifies that the employee exists within the authenticated organization.

The employee is then soft-deleted rather than permanently removed from the database.

A corresponding activity log and audit log entry are generated using the authenticated user as the actor.

The operation executes within a database transaction.

#### Successful Response

Returns HTTP `200 OK` with:

```json id="m2ph72"
{
  "success": true,
  "message": "Employee deleted successfully.",
  "data": null
}
```

### Employee Data Validation

Employee creation and updates use the same base validation rules, with the update schema making every field optional.

The validation layer enforces:

- Required employee names for creation
- Maximum field lengths
- Valid employment-status values
- Valid department UUIDs
- Valid date values
- Prevention of future hire dates

This ensures invalid employee data is rejected before reaching the business-service layer.

### Tenant Isolation

Employee operations consistently use the authenticated user's `organizationId` when querying and modifying records.

This means clients do not provide the organization identifier as part of employee URLs or request bodies. Tenant ownership is established from the authenticated request context.

The resulting access pattern is:

```
Client
  │
  ▼
Authentication
  │
  ▼
Authenticated `organizationId`
  │
  ▼
Employee Service
  │
  ▼
Organization-scoped employee operation
```

Organization-scoped employee operation

This prevents employee operations from crossing tenant boundaries.

### Employee Lifecycle

The Employee API supports the following primary lifecycle operations:

- Create an employee
- Retrieve employees
- Update employee information
- Soft-delete an employee

The delete operation is intentionally implemented as a soft delete, preserving the underlying business record while removing it from normal active-employee workflows.

### Current API Scope

The current Employee API provides:

- Organization-scoped employee listing
- Organization-scoped employee retrieval
- Employee creation
- Partial employee updates
- Employee soft deletion

The provided implementation does not expose dedicated endpoints for employee restoration, permanent deletion, or employee-specific lifecycle transitions beyond the fields handled by the current schemas.

---

## Department Endpoints

The Department API manages organizational departments belonging to the authenticated user's organization.

All Department endpoints require authentication. Read operations are available to `owner`, `administrator`, and `hr_manager`, while department creation, updates, and deletion are restricted to `owner` and `administrator`.

The current Department API is available under:

`/api/v1/departments`

### List Departments

`GET /api/v1/departments`

Retrieves the active departments belonging to the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The organization is resolved from the authenticated request context.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Departments retrieved successfully.`

The response `data` contains an array of `DepartmentRow` records.

### Get Department by ID

`GET /api/v1/departments/:departmentId`

Retrieves a specific department within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The supplied `departmentId` is resolved together with the authenticated `organizationId`, preserving tenant isolation.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Department retrieved successfully.`

If the department does not exist within the authenticated organization, the service raises a not-found error.

### Department Response Model

The current `DepartmentRow` contract contains:

| Field            | Type   |
| ---------------- | ------ |
| `id`             | string |
| `organizationId` | string |
| `name`           | string |
| `createdAt`      | Date   |
| `updatedAt`      | Date   |

The corresponding JSON representation uses the serialized date-time values produced by the HTTP response layer.

Example:

```json
{
  "id": "department-uuid",
  "organizationId": "organization-uuid",
  "name": "Engineering",
  "createdAt": "2026-08-10T00:00:00.000Z",
  "updatedAt": "2026-08-10T00:00:00.000Z"
}
```

### Create Department

`POST /api/v1/departments`

Creates a new department for the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The request body is validated using `createDepartmentSchema`.

#### Request Body

The current schema accepts:

| Field  | Type   | Required | Validation                                            |
| ------ | ------ | -------: | ----------------------------------------------------- |
| `name` | string |      Yes | Trimmed; minimum 3 characters; maximum 100 characters |

Example request:

```json
{
  "name": "Engineering"
}
```

#### Business Rules

The department name must be unique within the organization.

If a department with the same name already exists in the organization, the service returns a conflict error.

Successful creation is executed inside a database transaction and generates both an activity log and an audit log entry.

#### Successful Response

Returns HTTP `201 Created` with the message:

`Department created successfully.`

The response `data` contains the newly created `DepartmentRow`.

Example:

```json
{
  "success": true,
  "message": "Department created successfully.",
  "data": {
    "id": "department-uuid",
    "organizationId": "organization-uuid",
    "name": "Engineering",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z"
  }
}
```

### Update Department

`PATCH /api/v1/departments/:departmentId`

Updates the name of an existing department within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The request body is validated using `updateDepartmentSchema`.

#### Request Body

The update schema accepts the same field as creation:

| Field  | Type   | Required | Validation                                            |
| ------ | ------ | -------: | ----------------------------------------------------- |
| `name` | string |      Yes | Trimmed; minimum 3 characters; maximum 100 characters |

Example:

```json
{
  "name": "Platform Engineering"
}
```

#### Business Rules

The service verifies that the department exists within the authenticated organization.

When the department name changes, the service performs a case-insensitive duplicate-name check within the same organization.

A duplicate department name results in a conflict error.

Successful updates are executed in a transaction and generate both activity and audit log entries.

#### Successful Response

Returns HTTP `200 OK` with:

`Department updated successfully.`

The `data` object contains the updated `DepartmentRow`.

### Delete Department

`DELETE /api/v1/departments/:departmentId`

Soft-deletes a department from the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

#### Business Rules

Before the department is deleted, any employees currently assigned to it are first unlinked by clearing their `departmentId` association.

The department is then soft-deleted rather than permanently removed.

The complete operation runs inside a single database transaction. This ensures that employee unlinking, department deletion, activity logging, and audit logging either succeed together or are rolled back together.

Successful deletion generates both an activity-log and audit-log event.

#### Successful Response

Returns HTTP `200 OK` with:

```json
{
  "success": true,
  "message": "Department deleted successfully.",
  "data": null
}
```

### Department Lifecycle

The current Department API supports:

- Department creation
- Department retrieval
- Department listing
- Department name updates
- Department soft deletion

Deletion does not permanently remove the department record. Before archival, employee-to-department associations are cleared so that active employees are not left referencing a department that is no longer active.

### Tenant Isolation

All department queries and modifications are performed using the authenticated user's `organizationId`.

Clients therefore do not supply an organization identifier when interacting with department resources.

The effective access model is:

```
Client
  │
  ▼
Authentication
  │
  ▼
Authenticated `organizationId`
  │
  ▼
Department Service
  │
  ▼
Organization-scoped operation
```

This maintains the multi-tenant ownership boundary established by the database design.

### Current API Scope

The current Department API does not expose standalone endpoints for department restoration, permanent deletion, employee reassignment, or department hierarchy management.

Those capabilities may be introduced later as the Human Resources domain evolves.

---

## Profile Endpoints

The Profile API manages profile information associated with the currently authenticated user.

Unlike organization, user, employee, and department resources, the current Profile API does not expose a client-supplied profile or user identifier in its routes. The authenticated user's identity is obtained from the request context and is used as the target of each operation.

The current Profile API is available under:

`/api/v1/profile`

All Profile endpoints require authentication. No additional role restriction is applied by the route layer.

### Get Current User Profile

`GET /api/v1/profile`

Retrieves the complete profile details associated with the authenticated user.

#### Authentication

Authentication is required.

The endpoint obtains the authenticated user's identifier from `request.user` and passes it to the profile service.

#### Successful Response

Returns HTTP `200 OK` with:

```json id="pv5y0p"
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "profile": {
      "profileId": "profile-uuid",
      "avatarUrl": null,
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "organization": {
      "organizationId": "organization-uuid",
      "organizationName": "Acme Corporation",
      "organizationSlug": "acme-corporation",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "role": {
      "roleId": "role-uuid",
      "roleName": "owner"
    },
    "user": {
      "userId": "user-uuid",
      "email": "admin@acme.com",
      "status": "active",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "department": {
      "departmentId": "department-uuid",
      "departmentName": "Engineering"
    },
    "employee": {
      "employeeId": "employee-uuid",
      "employeeNumber": "EMP-000001",
      "firstName": "John",
      "middleName": "M.",
      "lastName": "Doe",
      "nameExtension": "Jr.",
      "jobTitle": "Software Engineer",
      "employmentStatus": "regular",
      "hireDate": "2026-08-10T00:00:00.000Z",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    }
  }
}
```

The `ProfileDetails` type explicitly groups the authenticated user's profile, organization, role, user, department, and employee information into a single response model.

If no profile is found for the authenticated user, the service raises a not-found error.

### Update Current User Profile

`PATCH /api/v1/profile`

Updates profile information for the authenticated user.

#### Authentication

Authentication is required.

The authenticated user's ID is used both as the target user and as the audit/activity actor.

#### Request Body

The current `updateProfileSchema` exposes only `avatarUrl`.

| Field       | Type   | Required | Validation                                             |
| ----------- | ------ | -------: | ------------------------------------------------------ |
| `avatarUrl` | string |       No | Must be a valid URL; maximum 2048 characters; nullable |

Example request:

```json id="4d4uaf"
{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

The field may also be explicitly set to `null`.

#### Business Rules

The service first verifies that a profile exists for the authenticated user.

The profile is then updated within a database transaction.

Successful updates generate both activity-log and audit-log entries using the authenticated user as the actor.

#### Successful Response

Returns HTTP `200 OK` with:

```json id="qf0q2d"
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": "profile-uuid",
    "userId": "user-uuid",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T01:00:00.000Z"
  }
}
```

### Update Current User Password

`PATCH /api/v1/profile/password`

Changes the password of the authenticated user.

#### Authentication

Authentication is required.

The target user is always the currently authenticated user.

#### Request Body

The current `updatePasswordSchema` accepts:

| Field             | Type   | Required | Validation                    |
| ----------------- | ------ | -------: | ----------------------------- |
| `currentPassword` | string |      Yes | Trimmed; minimum 8 characters |
| `newPassword`     | string |      Yes | Trimmed; minimum 8 characters |

Example request:

```json id="k2u1ny"
{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

#### Business Rules

The service verifies that the authenticated user's profile exists and then retrieves the user's current password hash.

The supplied current password is verified against the stored password hash.

If verification succeeds, the new password is hashed before the user record is updated.

The complete password-change operation executes inside a database transaction.

Successful password changes generate both activity-log and audit-log entries.

If the current password is incorrect, the service raises an unauthorized error with:

`Current password is incorrect.`

#### Successful Response

Returns HTTP `200 OK` with:

```json id="s7vcq1"
{
  "success": true,
  "message": "Password updated successfully.",
  "data": null
}
```

### Profile Access Model

The Profile API follows a self-service resource model.

Clients do not provide a `userId` or `profileId` when accessing these endpoints. Instead, the authenticated identity determines the target resource.

The effective access flow is:

```
Client
  │
  ▼
Authentication
  │
  ▼
Authenticated User ID
  │
  ▼
Profile Service
  │
  ▼
Current User's Profile
```

This reduces the risk of users attempting to modify another user's profile through a client-supplied identifier.

### Profile Data Composition

The `GET /api/v1/profile` response intentionally combines information from several business domains into a single representation.

The current `ProfileDetails` model includes:

- Profile information
- Organization information
- Role information
- User account information
- Department information
- Employee information

This provides the client with a consolidated representation of the authenticated user's organizational and employment context without requiring separate requests for each related resource.

### Current API Scope

The current Profile API provides:

- Current profile retrieval
- Current profile update
- Current-user password update

The provided implementation does not expose endpoints for profile deletion, another user's profile management, or independent profile creation because profiles are created as part of user-account creation workflows.

---

## Activity Log Endpoints

The Activity Log API provides access to business activity records generated by the platform's application modules.

Activity logs are organization-scoped and are intended to provide a chronological record of significant business actions such as organization updates, department changes, employee lifecycle events, user-account operations, and profile changes.

The current Activity Log API is available under:

`/api/v1/activities`

### Access Model

All Activity Log endpoints require authentication.

Access is restricted to users with one of the following roles:

- `owner`
- `administrator`
- `hr_manager`

The authenticated user's `organizationId` is used to scope all activity-log queries, ensuring that users can only retrieve activity belonging to their organization.

### List Activity Logs

`GET /api/v1/activities`

Retrieves paginated activity logs for the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The request query parameters are validated using `listActivityLogsQuerySchema`.

#### Query Parameters

| Parameter | Type    | Required | Default | Validation                    |
| --------- | ------- | -------: | ------: | ----------------------------- |
| `page`    | integer |       No |     `1` | Must be at least `1`          |
| `limit`   | integer |       No |    `20` | Must be between `1` and `100` |

The values are coerced from query-string input into numbers before being passed to the service layer.

Example:

```text
GET /api/v1/activities?page=2&limit=20
```

The schema limits `limit` to a maximum of `100` records per request.

#### Successful Response

Returns HTTP `200 OK` with:

```json id="s6m2a1"
{
  "success": true,
  "message": "Activity logs retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "activity-uuid",
        "organizationId": "organization-uuid",
        "actorId": "user-uuid",
        "eventType": "employee.created",
        "metadata": {
          "employeeId": "employee-uuid",
          "employeeNumber": "EMP-000001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-08-10T00:00:00.000Z"
      }
    ],
    "page": 2,
    "limit": 20,
    "total": 45
  }
}
```

The current `PaginatedActivityLogs` model contains:

| Field   | Type               |
| ------- | ------------------ |
| `items` | `ActivityLogRow[]` |
| `page`  | number             |
| `limit` | number             |
| `total` | number             |

### Activity Log Record

Each activity record follows the `ActivityLogRow` model:

| Field            | Type                      |
| ---------------- | ------------------------- |
| `id`             | string                    |
| `organizationId` | string                    |
| `actorId`        | string                    |
| `eventType`      | `ActivityEvent`           |
| `metadata`       | `Record<string, unknown>` |
| `createdAt`      | Date                      |

The `actorId` may be `null` for system-generated or unauthenticated business events, while organization context remains associated with the activity record.

### Get Activity Log by ID

`GET /api/v1/activities/:activityId`

Retrieves a single activity-log record within the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`
- `hr_manager`

The supplied `activityId` is resolved together with the authenticated user's `organizationId`, preserving tenant isolation.

#### Successful Response

Returns HTTP `200 OK` with:

`Activity log retrieved successfully.`

The response `data` contains an `ActivityLogRow`.

Example:

```json id="iy5mto"
{
  "success": true,
  "message": "Activity log retrieved successfully.",
  "data": {
    "id": "activity-uuid",
    "organizationId": "organization-uuid",
    "actorId": "user-uuid",
    "eventType": "department.updated",
    "metadata": {
      "departmentId": "department-uuid",
      "name": "Platform Engineering"
    },
    "createdAt": "2026-08-10T01:00:00.000Z"
  }
}
```

If the activity record does not exist within the authenticated organization, the service raises an `Activity log not found.` not-found error.

### Activity Event Types

The Activity Log service provides centralized writers for activity generated by multiple business modules.

The currently implemented activity categories include:

**Organization**

- Organization updated

**Department**

- Department created
- Department updated
- Department archived

**Employee**

- Employee created
- Employee updated
- Employee archived

**User**

- User created
- User updated
- User invited
- User reactivated

**Profile**

- Profile updated
- Profile password changed

These module-level services write standardized event types and associated metadata through a central `ActivityLogService`.

### Activity Metadata

Activity records contain a flexible metadata object:

```text
Record<string, unknown>
```

The metadata structure depends on the event type and captures contextual information relevant to the business action.

Examples include:

```json
{
  "departmentId": "department-uuid",
  "name": "Engineering"
}
```

or:

```json
{
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

The metadata model is intentionally flexible so new activity events can be introduced without requiring the activity-log table to be redesigned for every new event-specific field.

### Transactional Activity Logging

Activity-log writes support an optional existing PostgreSQL `PoolClient`.

When an activity is recorded as part of a larger business transaction, the service can reuse the active transaction client rather than opening a separate transaction.

This allows activity logging to participate in the same transactional boundary as the business operation that generated the event.

If no transaction client is supplied, the Activity Log service creates its own transaction for the activity write.

### Tenant Isolation

Activity queries always use the authenticated user's `organizationId`.

The client does not provide an organization identifier when requesting activity logs.

The effective access model is:

Client

↓

Authentication

↓

Authenticated `organizationId`

↓

Activity Log Service

↓

Organization-scoped activity query

This prevents users from retrieving activity records belonging to another tenant.

### Pagination

The list endpoint uses explicit page-based pagination.

The default configuration is:

```text
page = 1
limit = 20
```

The maximum permitted page size is:

```text
limit = 100
```

The response includes the requested pagination values together with the total number of matching records, allowing clients to calculate the number of available pages.

### Current API Scope

The current Activity Log API provides:

- Paginated organization-scoped activity retrieval
- Organization-scoped activity retrieval by ID

The provided implementation does not expose public endpoints for creating, editing, or deleting activity logs.

Activity records are created internally by business services through the centralized `ActivityLogService`.

---

## Audit Log Endpoints

The Audit Log API provides access to security- and compliance-oriented audit records generated by the platform.

Unlike general activity logs, audit records capture a structured action, the affected entity, the affected entity identifier, the acting user when available, and additional metadata.

The current Audit Log API is available under:

`/api/v1/audits`

### Access Model

All Audit Log endpoints require authentication.

Access is restricted to:

- `owner`
- `administrator`

The authenticated user's `organizationId` is used to scope all audit-log queries to the current organization.

This provides a stricter access boundary than the Activity Log API, which also permits `hr_manager` access.

### List Audit Logs

`GET /api/v1/audits`

Retrieves paginated audit logs for the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The request query parameters are validated using `listAuditLogsQuerySchema`.

#### Query Parameters

| Parameter | Type    | Required | Default | Validation                    |
| --------- | ------- | -------: | ------: | ----------------------------- |
| `page`    | integer |       No |     `1` | Must be at least `1`          |
| `limit`   | integer |       No |    `20` | Must be between `1` and `100` |

Example:

```text id="g7o1mx"
GET /api/v1/audits?page=1&limit=20
```

The schema coerces query-string values to numbers and limits the page size to a maximum of `100`.

#### Successful Response

Returns HTTP `200 OK` with:

```json id="e75fsa"
{
  "success": true,
  "message": "Audit logs retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "audit-uuid",
        "organizationId": "organization-uuid",
        "actorId": "user-uuid",
        "action": "created",
        "entity": "employee",
        "entityId": "employee-uuid",
        "metadata": {
          "employeeId": "employee-uuid",
          "employeeNumber": "EMP-000001",
          "firstName": "John",
          "lastName": "Doe"
        },
        "createdAt": "2026-08-10T00:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

The current `PaginatedAuditLogs` model contains:

| Field   | Type            |
| ------- | --------------- |
| `items` | `AuditLogRow[]` |
| `page`  | number          |
| `limit` | number          |
| `total` | number          |

### Audit Log Record

Each audit record follows the `AuditLogRow` model:

| Field            | Type                      |
| ---------------- | ------------------------- |
| `id`             | string                    |
| `organizationId` | string                    |
| `actorId`        | string                    |
| `action`         | `AuditAction`             |
| `entity`         | `AuditEntity`             |
| `entityId`       | string                    |
| `metadata`       | `Record<string, unknown>` |
| `createdAt`      | Date                      |

The `entityId` identifies the entity affected by the audited operation, while `actorId` identifies the user responsible for the action when an actor is available.

### Get Audit Log by ID

`GET /api/v1/audits/:auditId`

Retrieves a single audit record belonging to the authenticated user's organization.

#### Authorization

Requires authentication and one of:

- `owner`
- `administrator`

The supplied `auditId` is resolved together with the authenticated user's `organizationId`, preserving tenant isolation.

#### Successful Response

Returns HTTP `200 OK` with the message:

`Audit log retrieved successfully.`

The response `data` contains a single `AuditLogRow`.

Example:

```json id="9yy8n7"
{
  "success": true,
  "message": "Audit log retrieved successfully.",
  "data": {
    "id": "audit-uuid",
    "organizationId": "organization-uuid",
    "actorId": "user-uuid",
    "action": "updated",
    "entity": "department",
    "entityId": "department-uuid",
    "metadata": {
      "departmentId": "department-uuid",
      "name": "Platform Engineering"
    },
    "createdAt": "2026-08-10T01:00:00.000Z"
  }
}
```

If the audit record does not exist within the authenticated organization, the service raises an `Audit log not found.` not-found error.

### Audited Business Domains

The current `AuditLogService` provides audit writers for several business and security events.

#### Organization

- Organization registered
- Organization updated

#### Department

- Department created
- Department updated
- Department archived

#### Employee

- Employee created
- Employee updated
- Employee archived

#### User

- User created
- User updated
- User invited
- User reactivated

#### Profile

- Profile created
- Profile updated
- Password changed

#### Authentication Sessions

- Login
- Login failed
- Logout
- Logout from all sessions

These events are recorded through centralized audit-log functions used by the corresponding business services.

### Audit Action and Entity

Each audit entry contains both:

```text id="jga71r"
action
entity
```

The action identifies what happened, while the entity identifies what type of resource was affected.

For example:

```json id="x4lc2u"
{
  "action": "updated",
  "entity": "employee",
  "entityId": "employee-uuid"
}
```

This creates a structured representation of the audited operation instead of relying solely on free-form text.

The valid action and entity values are defined by the platform's `AUDIT_ACTIONS` and `AUDIT_ENTITIES` constants and validated by the audit schema.

### Audit Metadata

Each audit record contains a flexible metadata object:

```text id="vhtp6k"
Record<string, unknown>
```

Metadata stores contextual information associated with the audited action.

Examples include:

```json id="1xwguy"
{
  "userId": "user-uuid",
  "email": "user@example.com"
}
```

or:

```json id="3nn8og"
{
  "employeeId": "employee-uuid",
  "employeeNumber": "EMP-000001",
  "firstName": "John",
  "lastName": "Doe"
}
```

This allows audit entries to preserve useful event context without requiring a rigid column for every event-specific value.

### Authentication Audit Events

Authentication activity receives dedicated audit events.

The current implementation records:

- Successful login
- Failed login
- Logout
- Logout from all sessions

For successful login and logout events, the audited entity is the `SESSION` entity.

For failed login events, the organization context is retained and the metadata includes the attempted email address and an optional failure reason.

This allows authentication-related security events to be investigated alongside business operations.

### Transactional Audit Logging

Audit writes support an optional PostgreSQL `PoolClient`.

When an audit event is generated inside an existing business transaction, the current transaction client can be reused.

This allows an audited event to become part of the same atomic operation as the business change that generated it.

When no transaction client is provided, the Audit Log service creates its own transaction for the audit entry.

This preserves consistency between business state changes and their corresponding audit records.

### Tenant Isolation

Audit queries always include the authenticated user's `organizationId`.

Clients do not provide the organization identifier when requesting audit logs.

The effective access model is:

Client

↓

Authentication

↓

Authenticated `organizationId`

↓

Audit Log Service

↓

Organization-scoped audit query

This prevents users from retrieving audit records belonging to another organization.

### Security Boundary

Audit logs are intentionally more restricted than general activity logs.

The current API permits access only to `owner` and `administrator` roles. This reflects the security-sensitive nature of audit records, which may contain information about authentication activity, account operations, and organizational changes.

The API does not expose public endpoints for creating, modifying, or deleting audit records.

Audit entries are generated internally by application services through the centralized `AuditLogService`.

### Pagination

The audit listing endpoint uses page-based pagination.

Default values:

```text id="wz1k3b"
page = 1
limit = 20
```

Maximum page size:

```text id="fg9v2r"
limit = 100
```

The response includes the current page, requested limit, and total matching records.

### Current API Scope

The current Audit Log API provides:

- Paginated organization-scoped audit-log retrieval
- Organization-scoped audit-log retrieval by ID

It does not expose endpoints for:

- Creating audit records directly
- Updating audit records
- Deleting audit records
- Restoring audit records

Audit records are generated internally as part of business and security operations.

---

## Health Endpoints

The Health API provides an operational endpoint used to determine whether the backend service is functioning correctly and whether its database dependency is reachable.

The current health endpoint is:

`GET /api/v1/health`

### Health Check

`GET /api/v1/health`

Performs a runtime health check of the backend service.

The health check currently verifies:

- Database connectivity
- Application uptime
- Current application environment

The database check executes a lightweight `SELECT 1` query through the application's PostgreSQL connection pool. A successful query indicates that the application can communicate with the configured database.

### Authentication

The health endpoint does not require authentication.

This allows external infrastructure, monitoring systems, and deployment platforms to verify application availability without requiring an authenticated user session.

### HTTP Status Behavior

The endpoint returns different HTTP status codes depending on database availability.

#### Healthy

When the database connection check succeeds:

```text
HTTP 200 OK
```

The response has:

```json id="ax6g7r"
{
  "status": "ok",
  "database": "connected",
  "uptime": 123,
  "environment": "production"
}
```

#### Unhealthy

When the database connection check fails:

```text
HTTP 503 Service Unavailable
```

The response has:

```json id="yp2l7v"
{
  "status": "unhealthy",
  "database": "disconnected",
  "uptime": 123,
  "environment": "production"
}
```

The route determines the HTTP status from the `status` field returned by `performHealthCheck()`.

### Response Model

The health service defines the following response contract:

| Field         | Type                            | Description                     |
| ------------- | ------------------------------- | ------------------------------- |
| `status`      | `"ok" \| "unhealthy"`           | Overall health state            |
| `database`    | `"connected" \| "disconnected"` | Database connectivity state     |
| `uptime`      | number                          | Application uptime in seconds   |
| `environment` | string                          | Current application environment |

### Database Health Check

The database health check executes:

```sql
SELECT 1
```

through the application's PostgreSQL connection pool.

The operation is considered successful when the query returns at least one row.

Any database-query failure causes the database state to be reported as `disconnected`, and the overall health state becomes `unhealthy`.

In non-test environments, database connection failures are also written to the application console for operational visibility.

### Uptime

The health service reports the process uptime using Node.js process uptime information.

The value is calculated in seconds and reflects how long the current application process has been running.

Example:

```json id="7qk6c9"
{
  "status": "ok",
  "database": "connected",
  "uptime": 1842,
  "environment": "production"
}
```

### Environment Reporting

The response includes the current `NODE_ENV` value.

Examples include:

```text
development
test
production
```

The health service uses the configured environment value from the centralized environment configuration.

### Operational Usage

The health endpoint is intended to be consumed by operational infrastructure rather than normal application users.

Typical consumers include:

- Deployment platforms
- Container orchestration systems
- Monitoring services
- Availability checks
- Manual production verification

The endpoint therefore provides a lightweight way to determine whether the API process is running and whether its primary database dependency is available.

### Deployment Health Check

The endpoint is also suitable for use as the application's deployment health check because a successful response indicates that both the backend process and its database dependency are operational.

The production deployment can therefore use:

`/api/v1/health`

as the health-check path.

### Current API Scope

The current Health API exposes one endpoint:

- `GET /api/v1/health`

The implementation does not currently expose separate readiness, liveness, dependency-specific, or administrative health endpoints.

---

## Common Request and Response Conventions

The API follows a set of shared conventions for request handling, response formatting, validation, authentication context, and resource identification.

These conventions are applied consistently across the currently implemented API modules and are intended to make the API predictable for client applications.

### API Base Structure

All versioned application endpoints are exposed under:

`/api/v1`

Resource-specific routes are appended to this prefix.

Examples:

```text
/api/v1/auth/login
/api/v1/organizations/me
/api/v1/users
/api/v1/employees
/api/v1/departments
/api/v1/profile
/api/v1/activities
/api/v1/audits
/api/v1/health
```

### HTTP Methods

The current API uses HTTP methods according to the operation being performed:

| Method   | General Usage                                |
| -------- | -------------------------------------------- |
| `GET`    | Retrieve resources                           |
| `POST`   | Create resources or perform explicit actions |
| `PATCH`  | Partially update an existing resource        |
| `DELETE` | Remove or archive a resource                 |

The implementation uses `PATCH` for partial modifications such as organization, user, employee, department, and profile updates.

### Request Bodies

Endpoints that create or modify resources generally receive structured JSON request bodies.

Examples include:

```json
{
  "name": "Engineering"
}
```

and:

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "jobTitle": "Software Engineer"
}
```

Request-body validation is performed through module-specific Zod schemas before the request reaches the corresponding business service.

### Query Parameters

Endpoints that support listing and pagination use query parameters.

The current Activity Log and Audit Log APIs use:

```text
?page=1&limit=20
```

Query-string values are validated and coerced into the expected types by the corresponding Zod query schemas.

### Path Parameters

Resource-specific operations use path parameters to identify individual resources.

Examples:

```text
/api/v1/users/:userId
/api/v1/employees/:employeeId
/api/v1/departments/:departmentId
/api/v1/activities/:activityId
/api/v1/audits/:auditId
```

The supplied identifier is resolved together with the authenticated organization's tenant context where applicable.

### Authentication Context

Protected endpoints derive the authenticated user's identity and organization context from the authentication middleware.

The authenticated request context can provide information such as:

- User ID
- Organization ID
- Role ID
- Authentication state

Resources that belong to a tenant do not require clients to repeatedly supply the organization identifier as part of normal resource operations.

Instead, the authenticated organization context is used to establish tenant scope.

### Self-Scoped Resources

Some endpoints operate on the current authenticated user without requiring a client-supplied identifier.

Examples include:

```text
GET /api/v1/organizations/me
PATCH /api/v1/organizations/me

GET /api/v1/profile
PATCH /api/v1/profile
PATCH /api/v1/profile/password
```

This pattern provides a clear boundary between resources belonging to the current authenticated identity and resources that are explicitly addressed through identifiers.

### Success Response Structure

Most application endpoints use the platform's shared success-response structure.

The general form is:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

The `data` property contains the result of the operation.

When an operation does not return resource data, the API uses:

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": null
}
```

This pattern is currently used by operations such as registration, logout, password changes, and soft deletion.

### Collection Responses

Collection endpoints return their collection data through the `data` property.

For example:

```json
{
  "success": true,
  "message": "Users retrieved successfully.",
  "data": []
}
```

Paginated collections use a dedicated pagination structure.

The current Activity Log and Audit Log responses contain:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

### Resource Identifiers

The API uses UUID-style identifiers for persisted resources.

Examples include:

```text
userId
employeeId
departmentId
organizationId
activityId
auditId
```

These identifiers are represented as strings in the TypeScript API models and are validated as UUIDs where request schemas require identifier input.

### Date and Time Values

Backend response models represent timestamps as JavaScript `Date` values.

When serialized as JSON, these values are represented as date-time strings.

Example:

```json
{
  "createdAt": "2026-08-10T00:00:00.000Z",
  "updatedAt": "2026-08-10T01:00:00.000Z"
}
```

### Validation

Validation is performed close to the HTTP boundary.

Request-body validation uses module-specific Zod schemas, while supported query parameters use dedicated query schemas.

Examples include:

- Registration validation
- Login validation
- Employee validation
- Department validation
- User validation
- Profile validation
- Activity Log pagination validation
- Audit Log pagination validation

This prevents malformed input from reaching the underlying service logic.

### Authorization

Authentication and authorization are handled separately.

Authentication establishes the identity and tenant context of the request.

Role-based authorization then determines whether that authenticated user may execute the requested operation.

The API currently uses roles including:

- `owner`
- `administrator`
- `hr_manager`

Different endpoints apply different role requirements according to the sensitivity of the operation.

### Tenant Scoping

Tenant-owned resources are resolved using the authenticated organization's identifier.

The API therefore avoids relying solely on client-supplied organization identifiers for tenant isolation.

The common pattern is:

```
Client request
  │
  ▼
Authentication
  │
  ▼
Authenticated organization context
  │
  ▼
Organization-scoped service operation
  │
  ▼
Database query constrained by organization
```

### No-Data Success Responses

Operations that successfully complete without returning a resource use `data: null`.

Examples include:

- Organization registration
- Logout
- Logout from all sessions
- Password update
- Employee deletion
- Department deletion

This keeps the response shape consistent without fabricating unnecessary data.

### Error Handling

Application errors are not individually formatted by each controller.

Controllers execute business logic through the shared asynchronous request-handling mechanism, while the platform's centralized error-handling layer is responsible for translating application errors into HTTP responses.

Detailed error response conventions are documented separately in the API error section.

### API Response Consistency

The API favors predictable response structures over resource-specific response formats.

Across modules, clients can generally expect:

```text
HTTP status
    +
success
    +
message
    +
data
```

while the structure of `data` varies according to the requested resource or operation.

This allows client applications to handle common response behavior consistently while still preserving domain-specific resource models.

---

## Error Response Standard

The API uses a centralized error-handling middleware to convert application errors into consistent HTTP responses.

Application-specific errors extend the shared `AppError` class, which carries an HTTP status code and an operational-error flag. The centralized error middleware determines the response format based on the error type.

### AppError

`AppError` is the base application error class used by the backend.

Each application error contains:

| Property        | Type    | Description                                                              |
| --------------- | ------- | ------------------------------------------------------------------------ |
| `message`       | string  | Human-readable error message                                             |
| `statusCode`    | number  | HTTP status code returned to the client                                  |
| `isOperational` | boolean | Indicates whether the error is an expected operational/application error |

The `isOperational` property defaults to `true`.

The error class also preserves the error name and captures the stack trace for server-side debugging.

The HTTP status code is therefore defined by the specific application error being raised rather than by individual controllers.

### Validation Error Response

Validation failures receive a specialized response format because validation errors may contain multiple field-level errors.

The middleware checks for `ValidationError` before checking for the more general `AppError`.

The response format is:

```json
{
  "success": false,
  "message": "Validation failed.",
  "error": []
}
```

The `error` property contains the validation error details stored by the `ValidationError` instance.

The exact structure of the `error` value depends on the current `ValidationError` implementation and the validation layer that creates it.

### Application Error Response

Recognized application errors that extend `AppError` use the following response format:

```json
{
  "success": false,
  "message": "Resource not found."
}
```

The response HTTP status is taken directly from the error's `statusCode`.

Examples of application-level error categories used by the backend include:

- Unauthorized errors
- Forbidden errors
- Not-found errors
- Conflict errors
- Other domain-specific operational errors

The middleware does not expose the internal `isOperational` property in the HTTP response.

### Generic Internal Server Error

Errors that are not recognized as either `ValidationError` or `AppError` are treated as unexpected server-side errors.

The middleware logs the original error using the application logger and returns:

```json
{
  "success": false,
  "message": "Internal server error."
}
```

with HTTP status:

```text
500 Internal Server Error
```

Internal error details are therefore not exposed directly to API clients.

### Error Handling Decision Flow

The centralized middleware follows this decision process:

```text
Request processing
        ↓
      Error
        ↓
Is ValidationError?
   ├── Yes → validation response
   └── No
        ↓
Is AppError?
   ├── Yes → statusCode + message
   └── No
        ↓
Log unexpected error
        ↓
HTTP 500 + generic message
```

### Validation Error Priority

`ValidationError` is evaluated before `AppError`.

This is important because `ValidationError` is handled with additional structured error information:

```json
{
  "success": false,
  "message": "...",
  "error": [...]
}
```

while the generic `AppError` branch returns:

```json
{
  "success": false,
  "message": "..."
}
```

This allows validation responses to provide client applications with more specific information about invalid input.

### Controller Responsibility

Controllers do not need to implement separate error-response logic for individual failure conditions.

Instead, service-layer operations may throw application-specific errors, which propagate through the asynchronous request-handling mechanism into the centralized error middleware.

The general flow is:

```text
Route
  ↓
Validation / Authentication / Authorization
  ↓
Controller
  ↓
Service
  ↓
AppError / ValidationError
  ↓
Centralized Error Middleware
  ↓
HTTP Response
```

This keeps error formatting consistent across all API modules.

### Error Message Exposure

Known application errors return their configured human-readable `message`.

Unexpected errors are treated differently: the original error is logged server-side, while the client receives only:

`Internal server error.`

This prevents raw database errors, stack traces, and other internal implementation details from being exposed through the API.

### Operational Errors

The `AppError` class contains an `isOperational` property to distinguish expected application errors from unexpected failures.

The current middleware uses the error type to determine the response behavior and does not expose this internal classification directly to clients.

### Current Standard Response Shapes

#### Validation error

```json
{
  "success": false,
  "message": "Validation failed.",
  "error": []
}
```

#### Application error

```json
{
  "success": false,
  "message": "Operation could not be completed."
}
```

#### Unexpected server error

```json
{
  "success": false,
  "message": "Internal server error."
}
```

The actual message for application errors depends on the specific error raised by the backend.

### Security and Observability

The centralized middleware provides two separate responsibilities:

1. Return safe, predictable error information to clients.
2. Preserve detailed unexpected errors for server-side logging.

Known application errors can safely expose their intended message, while unexpected errors are logged and replaced with a generic client-facing response.

This provides a consistent boundary between API consumers and internal implementation details.

---

## HTTP Status Codes

The API uses standard HTTP status codes to communicate the outcome of requests.

The current implementation explicitly uses success, client-error, and service-health status codes across its controllers and health endpoint. Application-specific error classes also carry their own `statusCode`, which is returned by the centralized error middleware.

### Successful Responses

#### 200 OK

`200 OK` is used when a request completes successfully without creating a new resource.

The current API uses `200` for operations such as:

- Retrieving an organization
- Updating an organization
- Logging in
- Refreshing tokens
- Logging out
- Logging out of all sessions
- Retrieving and updating users
- Activating users
- Retrieving and updating employees
- Updating departments
- Retrieving profiles
- Updating profiles
- Updating passwords
- Retrieving activity logs
- Retrieving audit logs
- Successful health checks

Examples of successful responses include:

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {}
}
```

and:

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {}
}
```

### 201 Created

`201 Created` is used when a new resource or account is successfully created.

The current implementation explicitly uses `201` for:

- Organization registration
- User creation
- User invitation
- Employee creation
- Department creation

Example:

```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {}
}
```

### 500 Internal Server Error

`500 Internal Server Error` is returned when an unexpected error reaches the centralized error middleware without matching a known application error type.

The middleware logs the original error server-side and returns only the generic client-facing response:

```json
{
  "success": false,
  "message": "Internal server error."
}
```

This prevents internal implementation details from being exposed to clients.

### 503 Service Unavailable

`503 Service Unavailable` is used by the health endpoint when the database health check fails.

The health route explicitly returns:

```text
200
```

when the health status is `ok`, and:

```text
503
```

when the health status is `unhealthy`.

Example unhealthy response:

```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "uptime": 123,
  "environment": "production"
}
```

The `503` response therefore represents a dependency or service-health failure rather than a normal application validation or authorization failure.

### Application Error Status Codes

The shared `AppError` class contains:

```text
statusCode: number
```

The centralized error middleware returns this value directly:

```text
response.status(error.statusCode)
```

This means each custom application error subclass is responsible for defining the HTTP status associated with its failure category.

The current application uses custom errors including:

- `ValidationError` → HTTP `400 Bad Request`
- `UnauthorizedError` → HTTP `401 Unauthorized`
- `ForbiddenError` → HTTP `403 Forbidden`
- `NotFoundError` → HTTP `404 Not Found`
- `ConflictError` → HTTP `409 Conflict`

The confirmed numeric mappings for all application error types are documented in the [Current Confirmed Status Codes](#current-confirmed-status-codes) table.

### Status Code and Error Type Separation

The API separates business error classification from HTTP response formatting.

The business/service layer raises a specific application error, while the centralized error middleware converts that error's `statusCode` into the HTTP response.

The flow is:

```text
Business condition
      ↓
Custom AppError
      ↓
statusCode
      ↓
Centralized error middleware
      ↓
HTTP response
```

This prevents individual controllers from duplicating status-code handling logic.

### Current Confirmed Status Codes

Based on the current implementation, the following status codes are used:

| HTTP Status | Meaning                 | Current Usage                                                                                |
| ----------: | ----------------------- | -------------------------------------------------------------------------------------------- |
|       `200` | Successful request      | Retrieval, update, authentication actions, deletion/activation actions, healthy health check |
|       `201` | Resource created        | Registration and resource creation                                                           |
|       `400` | Bad request             | Validation failures (`ValidationError`)                                                      |
|       `401` | Unauthorized            | Authentication failures, invalid or expired tokens (`UnauthorizedError`)                     |
|       `403` | Forbidden               | Authorization failures, inactive accounts, revoked organizations (`ForbiddenError`)          |
|       `404` | Not found               | Resource not found within the authenticated tenant (`NotFoundError`)                         |
|       `409` | Conflict                | Duplicate resources and business-rule conflicts (`ConflictError`)                            |
|       `500` | Unexpected server error | Unrecognized errors                                                                          |
|       `503` | Service unavailable     | Unhealthy health check                                                                       |

### API Contract Principle

HTTP status codes form part of the external API contract.

A client should use the status code to determine the broad outcome of a request while using the response body for additional application-specific information.

Status codes should therefore remain consistent across modules and should be changed deliberately because they can affect:

- Client error handling
- Automated tests
- API integrations
- Monitoring
- Documentation

---

## Pagination, Filtering & Sorting

The API currently uses page-based pagination for endpoints that return potentially large audit and activity-log collections.

At the current implementation stage, explicit filtering and sorting query parameters are not exposed by the Activity Log and Audit Log APIs.

### Pagination

Pagination is currently supported by:

- `GET /api/v1/activities`
- `GET /api/v1/audits`

Both endpoints accept the following query parameters:

| Parameter | Type    | Default | Minimum | Maximum |
| --------- | ------- | ------: | ------: | ------: |
| `page`    | integer |     `1` |     `1` |       — |
| `limit`   | integer |    `20` |     `1` |   `100` |

The values are coerced from HTTP query-string input into numbers and validated before reaching the service layer.

#### Page

The `page` parameter identifies which result page should be returned.

The minimum valid page is:

```text
1
```

If omitted, the API defaults to:

```text
page=1
```

Example:

```text
GET /api/v1/activities?page=2
```

#### Limit

The `limit` parameter controls the maximum number of records requested for a page.

The default is:

```text
20
```

The minimum is:

```text
1
```

The maximum is:

```text
100
```

Requests exceeding the maximum limit are rejected by request validation.

Example:

```text
GET /api/v1/audits?page=1&limit=50
```

#### Pagination Response

Paginated endpoints return a consistent pagination envelope inside the `data` property.

The current model is:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

The fields are:

| Field   | Type   | Description                           |
| ------- | ------ | ------------------------------------- |
| `items` | array  | Records returned for the current page |
| `page`  | number | Current page number                   |
| `limit` | number | Requested page size                   |
| `total` | number | Total number of matching records      |

This structure is defined by both `PaginatedActivityLogs` and `PaginatedAuditLogs`.

### Client Pagination Model

Clients can calculate the number of available pages using:

```text
total ÷ limit
```

with the result rounded up to the next whole number.

For example:

```text
total = 45
limit = 20

pages = 3
```

The API itself does not return an explicit `totalPages` field in the current response model.

### Filtering

The currently supplied Activity Log and Audit Log query schemas do **not** define filtering parameters.

For Activity Logs, the query schema contains only:

```text
page
limit
```

For Audit Logs, the query schema likewise contains only:

```text
page
limit
```

Therefore, the current public API does not expose query parameters for filtering by fields such as:

- event type
- action
- entity
- actor
- date range
- resource identifier

These capabilities may be added in a future API revision but are not currently part of the documented contract.

### Sorting

The supplied public query schemas also do not expose a sorting parameter.

There is currently no documented public API contract for parameters such as:

```text
sort
sortBy
order
```

Clients should therefore not assume that arbitrary sort fields or sort directions are supported.

Sorting behavior should only be documented after it becomes an explicit part of the API implementation.

### Consistency Across Paginated Endpoints

The Activity Log and Audit Log APIs use the same pagination conventions:

```text
page → default 1
limit → default 20
maximum limit → 100
```

This keeps client-side pagination logic consistent across operational activity and security audit resources.

### Non-Paginated Collection Endpoints

Other collection endpoints currently exposed by the implementation include:

- `GET /api/v1/users`
- `GET /api/v1/employees`
- `GET /api/v1/departments`

The supplied implementations return collection data but do not expose `page` or `limit` query parameters.

These endpoints should therefore be treated as non-paginated under the current API contract.

Pagination can be introduced later if collection size or performance requirements justify it.

### Future Extension

The pagination design leaves room for future query capabilities without changing the basic response envelope.

Possible future additions may include:

```text
page
limit
filter
sort
order
```

However, those parameters should only become part of the public API once they are implemented, validated, tested, and documented.

### Current API Contract

The current pagination contract is intentionally small and predictable:

```text
GET /api/v1/activities?page=1&limit=20

GET /api/v1/audits?page=1&limit=20
```

Both return:

```json
{
  "success": true,
  "message": "...",
  "data": {
    "items": [],
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Filtering and sorting are not currently exposed as public query parameters.

---

## API Examples

This section provides representative HTTP request and response examples for the currently implemented API.

The examples follow the existing `/api/v1` API structure, authentication model, success-response envelope, validation rules, and tenant-scoping behavior.

### Base URL

Production (deployment pending):

`https://multi-tenant-api.up.railway.app`

> **Note**: Production deployment is currently planned. This URL represents the intended production endpoint. Refer to the [README](../README.md) for the current deployment status.

API prefix:

`/api/v1`

---

### 1. Health Check

#### Request

```http
GET /api/v1/health
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "status": "ok",
  "database": "connected",
  "uptime": 1842,
  "environment": "production"
}
```

The health endpoint checks database connectivity through a lightweight database query.

---

### 2. Register Organization

#### Request

```http
POST /api/v1/auth/register
Content-Type: application/json
```

```json
{
  "name": "Acme Corporation",
  "slug": "acme-corporation",
  "ownerEmail": "admin@acme.com",
  "password": "secure-password",
  "firstName": "John",
  "middleName": "M.",
  "lastName": "Doe",
  "nameExtension": "Jr."
}
```

#### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Organization registered successfully.",
  "data": null
}
```

The registration workflow creates the organization, default roles, initial employee, owner user, profile, and related audit records within the registration transaction.

---

### 3. Login

#### Request

```http
POST /api/v1/auth/login
Content-Type: application/json
```

```json
{
  "organizationSlug": "acme-corporation",
  "email": "admin@acme.com",
  "password": "secure-password"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "user": {
      "id": "2f3d0d20-7f37-4b6a-b66e-5c5f7b6d7a11",
      "organizationId": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
      "employeeId": "6b6a3b21-7f2c-4d2e-b6a9-1f2e3d4c5b67",
      "roleId": "e1a2b3c4-d5f6-4789-a012-3456789abcde",
      "email": "admin@acme.com"
    },
    "tokens": {
      "accessToken": "example-access-token",
      "refreshToken": "example-refresh-token"
    }
  }
}
```

---

### 4. Get Current Organization

#### Request

```http
GET /api/v1/organizations/me
Authorization: Bearer <access-token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Organization retrieved successfully.",
  "data": {
    "id": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
    "name": "Acme Corporation",
    "slug": "acme-corporation",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T00:00:00.000Z",
    "revokedAt": null
  }
}
```

---

### 5. Get Current Profile

#### Request

```http
GET /api/v1/profile
Authorization: Bearer <access-token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Profile retrieved successfully.",
  "data": {
    "profile": {
      "profileId": "8a7b6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c21",
      "avatarUrl": null,
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "organization": {
      "organizationId": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
      "organizationName": "Acme Corporation",
      "organizationSlug": "acme-corporation",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "role": {
      "roleId": "e1a2b3c4-d5f6-4789-a012-3456789abcde",
      "roleName": "owner"
    },
    "user": {
      "userId": "2f3d0d20-7f37-4b6a-b66e-5c5f7b6d7a11",
      "email": "admin@acme.com",
      "status": "active",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    },
    "department": null,
    "employee": {
      "employeeId": "6b6a3b21-7f2c-4d2e-b6a9-1f2e3d4c5b67",
      "employeeNumber": "EMP-000001",
      "firstName": "John",
      "middleName": "M.",
      "lastName": "Doe",
      "nameExtension": "Jr.",
      "jobTitle": "Software Engineer",
      "employmentStatus": "regular",
      "hireDate": "2026-08-10T00:00:00.000Z",
      "createdAt": "2026-08-10T00:00:00.000Z",
      "updatedAt": "2026-08-10T00:00:00.000Z"
    }
  }
}
```

---

### 6. Create Department

#### Request

```http
POST /api/v1/departments
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "name": "Engineering"
}
```

#### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Department created successfully.",
  "data": {
    "id": "e9a8b7c6-d5e4-f3a2-b1c0-987654321abc",
    "organizationId": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
    "name": "Engineering",
    "createdAt": "2026-08-10T01:00:00.000Z",
    "updatedAt": "2026-08-10T01:00:00.000Z"
  }
}
```

---

### 7. Create Employee

#### Request

```http
POST /api/v1/employees
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "firstName": "Jane",
  "middleName": "A.",
  "lastName": "Smith",
  "nameExtension": null,
  "jobTitle": "Backend Developer",
  "employmentStatus": "regular",
  "hireDate": "2026-08-10",
  "departmentId": "e9a8b7c6-d5e4-f3a2-b1c0-987654321abc"
}
```

#### Response

```http
HTTP/1.1 201 Created
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Employee created successfully.",
  "data": {
    "id": "b7c6d5e4-f3a2-b1c0-9876-54321abcdef0",
    "organizationId": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
    "employeeNumber": "EMP-000002",
    "firstName": "Jane",
    "middleName": "A.",
    "lastName": "Smith",
    "nameExtension": null,
    "jobTitle": "Backend Developer",
    "employmentStatus": "regular",
    "departmentId": "e9a8b7c6-d5e4-f3a2-b1c0-987654321abc",
    "hireDate": "2026-08-10T00:00:00.000Z",
    "createdAt": "2026-08-10T02:00:00.000Z",
    "updatedAt": "2026-08-10T02:00:00.000Z"
  }
}
```

The example above shows a representative `EmployeeRow`. The response follows the same `EmployeeRow` contract documented throughout the Employee API section.

---

### 8. List Employees

#### Request

```http
GET /api/v1/employees
Authorization: Bearer <access-token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Employees retrieved successfully.",
  "data": [
    {
      "id": "b7c6d5e4-f3a2-b1c0-9876-54321abcdef0",
      "organizationId": "f98f2e8d-5e5d-4f7f-b1a2-3c4d5e6f7890",
      "employeeNumber": "EMP-000002",
      "firstName": "Jane",
      "middleName": "A.",
      "lastName": "Smith",
      "nameExtension": null,
      "jobTitle": "Backend Developer",
      "employmentStatus": "regular",
      "departmentId": "e9a8b7c6-d5e4-f3a2-b1c0-987654321abc",
      "hireDate": "2026-08-10T00:00:00.000Z",
      "createdAt": "2026-08-10T02:00:00.000Z",
      "updatedAt": "2026-08-10T02:00:00.000Z"
    }
  ]
}
```

The collection is restricted to employees belonging to the authenticated user's organization.

---

### 9. Update Profile Avatar

#### Request

```http
PATCH /api/v1/profile
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "avatarUrl": "https://example.com/avatar.jpg"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Profile updated successfully.",
  "data": {
    "id": "8a7b6c5d-4e3f-2a1b-9c8d-7e6f5a4b3c21",
    "userId": "2f3d0d20-7f37-4b6a-b66e-5c5f7b6d7a11",
    "avatarUrl": "https://example.com/avatar.jpg",
    "createdAt": "2026-08-10T00:00:00.000Z",
    "updatedAt": "2026-08-10T01:30:00.000Z"
  }
}
```

---

### 10. Change Password

#### Request

```http
PATCH /api/v1/profile/password
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Password updated successfully.",
  "data": null
}
```

---

### 11. Refresh Access Token

#### Request

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

```json
{
  "refreshToken": "example-refresh-token"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Token refreshed successfully.",
  "data": {
    "accessToken": "new-access-token",
    "refreshToken": "new-refresh-token"
  }
}
```

---

### 12. Logout

#### Request

```http
POST /api/v1/auth/logout
Content-Type: application/json
```

```json
{
  "refreshToken": "example-refresh-token"
}
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Logout successful.",
  "data": null
}
```

---

### 13. List Activity Logs

#### Request

```http
GET /api/v1/activities?page=1&limit=20
Authorization: Bearer <access-token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Activity logs retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "activity-uuid",
        "organizationId": "organization-uuid",
        "actorId": "user-uuid",
        "eventType": "employee.created",
        "metadata": {
          "employeeId": "employee-uuid"
        },
        "createdAt": "2026-08-10T02:00:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### 14. List Audit Logs

#### Request

```http
GET /api/v1/audits?page=1&limit=20
Authorization: Bearer <access-token>
```

#### Response

```http
HTTP/1.1 200 OK
Content-Type: application/json
```

```json
{
  "success": true,
  "message": "Audit logs retrieved successfully.",
  "data": {
    "items": [
      {
        "id": "audit-uuid",
        "organizationId": "organization-uuid",
        "actorId": "user-uuid",
        "action": "updated",
        "entity": "employee",
        "entityId": "employee-uuid",
        "metadata": {
          "employeeId": "employee-uuid"
        },
        "createdAt": "2026-08-10T02:05:00.000Z"
      }
    ],
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

---

### Example Error Responses

#### Validation Error

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
```

The `ValidationError` returns HTTP `400 Bad Request`. The response shape is:

```json
{
  "success": false,
  "message": "Validation failed.",
  "error": []
}
```

#### Application Error

Known application errors use:

```json
{
  "success": false,
  "message": "Resource not found."
}
```

The HTTP status is determined by the corresponding `AppError.statusCode`.

#### Unexpected Server Error

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json
```

```json
{
  "success": false,
  "message": "Internal server error."
}
```

### Example Request Flow

A typical authenticated workflow can be represented as:

```text
POST /api/v1/auth/login
        ↓
Receive access + refresh tokens
        ↓
GET /api/v1/profile
        ↓
Use access token
        ↓
Receive current user context
        ↓
GET /api/v1/employees
        ↓
Receive organization-scoped employees
        ↓
POST /api/v1/auth/refresh
        ↓
Receive rotated token pair
```

These examples are intended to illustrate the current API conventions. Actual identifiers, tokens, timestamps, and resource data will vary by environment and request.

---

## API Evolution

The API is designed to evolve as the Multi-Tenant SaaS HR Platform grows. API changes should preserve compatibility where practical while providing a clear strategy for changes that cannot remain backward compatible.

### API Versioning

The current API uses explicit URI versioning:

`/api/v1`

This establishes `v1` as the first stable API contract.

Future breaking changes should be introduced through a new API version rather than silently changing the behavior of the existing version.

For example:

```text
/api/v1/...
/api/v2/...
```

The existing `v1` contract should remain available for supported clients while migration to a newer version is planned.

### Backward-Compatible Changes

Changes that do not break existing clients may be introduced within the current API version.

Examples include:

- Adding a new optional response property
- Adding a new endpoint
- Adding support for a new resource
- Adding additional non-required functionality
- Improving internal implementation without changing the external contract

These changes should still be documented in `04-api-reference.md`.

### Breaking Changes

A change should be treated as potentially breaking when an existing client can no longer interact with the API using the previous contract.

Examples include:

- Removing an existing field
- Renaming an existing field
- Changing a required request field
- Changing the meaning of an existing field
- Removing an endpoint
- Changing an existing endpoint's authentication requirements
- Changing a response structure in an incompatible way
- Changing an established error contract in a way that breaks clients

Breaking changes should be introduced deliberately and should normally require a new API version.

### Resource Evolution

Resource models may evolve over time as new HR and organizational capabilities are introduced.

For example, the current Employee resource may later gain additional workforce-related attributes.

New optional properties can generally be introduced without requiring a new API version, provided that existing clients can continue to interpret the response correctly.

Changes to required request fields require more careful compatibility analysis.

### Endpoint Evolution

New endpoints can be introduced without changing the existing resource contracts.

For example, the current API may later add endpoints for:

```text
/api/v1/employees/:employeeId/...
/api/v1/departments/:departmentId/...
/api/v1/users/:userId/...
```

Such additions should follow the same authentication, authorization, validation, tenant-isolation, and response conventions established by the current API.

### Authentication Evolution

Authentication changes require additional care because they affect every protected resource.

Changes involving:

- access-token structure
- refresh-token behavior
- session semantics
- authentication requirements
- authorization rules
- token expiration policies

should be evaluated for compatibility with existing clients before being introduced.

Security improvements should take priority over preserving an unsafe legacy behavior.

### Error Contract Evolution

Error responses should remain predictable across API versions.

The current API uses:

```json
{
  "success": false,
  "message": "..."
}
```

for recognized application errors and adds:

```json
{
  "error": [...]
}
```

for validation errors.

Future improvements may introduce stable machine-readable error codes so client applications do not need to depend exclusively on human-readable messages.

If such an error-code system is introduced, it should be documented as part of the API contract.

### Pagination Evolution

The current paginated endpoints use:

```text
page
limit
```

and return:

```json
{
  "items": [],
  "page": 1,
  "limit": 20,
  "total": 0
}
```

Future pagination improvements may introduce additional metadata or more advanced pagination mechanisms.

Any change should preserve the meaning of existing fields where practical, or be introduced through a new API version when compatibility cannot be maintained.

### Deprecation

When an endpoint or field is scheduled for removal, it should first be considered deprecated rather than immediately removed.

A deprecation process should provide:

- Clear documentation
- Migration guidance
- Identification of the replacement endpoint or field
- A defined support period when practical
- Removal only after an appropriate migration window

### Documentation Synchronization

`04-api-reference.md` is a living API contract document.

Any externally visible API change should result in a corresponding documentation update.

The implementation, automated tests, and API reference should remain synchronized:

```text
Implementation
      ↓
Automated Tests
      ↓
API Contract
      ↓
Documentation
```

A feature should not be considered complete when the implementation changes but the externally visible API documentation remains outdated.

### Compatibility Principle

The preferred evolution strategy is:

```text
Non-breaking change
        ↓
Continue using /api/v1

Breaking change
        ↓
Introduce a new API version
        ↓
Provide migration path
        ↓
Deprecate older version
        ↓
Remove after support period
```

This approach allows the API to evolve while minimizing unnecessary disruption for consumers.

### Current API Version

The currently documented API version is:

`v1`

API prefix:

`/api/v1`

Future versions should preserve the same clear versioning boundary and continue to follow the platform's established authentication, authorization, validation, tenant-isolation, response, and error-handling conventions.

---

### Document Index

This document is part of the **Multi-Tenant SaaS HR Platform** technical documentation suite.

| Document                                                | Description                                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------------------------- |
| [01 — Project Overview](./01-project-overview.md)       | Business domain, project goals, and overall scope                               |
| [02 — System Architecture](./02-system-architecture.md) | Application architecture, module organization, and request lifecycle            |
| [03 — Database Design](./03-database-design.md)         | Entity relationships, database schema, and design decisions                     |
| **04 — API Reference** _(this document)_                | REST API conventions, endpoints, request/response standards, and authentication |
| [05 — Testing Strategy](./05-testing-strategy.md)       | Testing approach, project structure, and quality assurance practices            |
| [06 — Docker Guide](./06-docker-guide.md)               | Local development, production containers, and Docker workflow                   |
| [07 — CI/CD Pipeline](./07-ci-cd-pipeline.md)           | GitHub Actions workflow, automated validation, and Docker verification          |
| [08 — Deployment Guide](./08-deployment-guide.md)       | Production deployment process and infrastructure configuration                  |
| [09 — Development Roadmap](./09-development-roadmap.md) | Development phases, completed milestones, and future work                       |
| [10 — Future Enhancements](./10-future-enhancements.md) | Planned improvements, scalability considerations, and long-term vision          |
