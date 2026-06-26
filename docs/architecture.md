# Architecture

## Goal

Create scalable backend architecture for MVP.

---

## Module Boundaries

health
auth
organization
user
role
department
employee
profile

---

## Folder Structure

src/

config/
modules/
shared/

---

## Current Layered Architecture

Route
↓
Service
↓
Database

Rules:

- Routes handle HTTP
- Services handle business logic
- Database handles persistence

---

## Shared Components

errors/
logger/
types/
utils/
validation/

---

## API Standards

Base URL:
/api/v1

Response:
Success:
{
data: {}
}

Error:
{
error: {
message: "",
code: ""
}
}

Exception:
GET /health

---

## Database Strategy

PostgreSQL

Multi-tenant:
Shared Database
Shared Schema

Tenant Isolation:
organization_id

---

## Versioning

v1
