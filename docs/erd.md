# Entity Relationship Diagram (ERD)

## Objective

Define the data model for the Multi-Tenant SaaS HR Management Platform.

Database:

PostgreSQL

Architecture:

Shared Database
Shared Schema
Tenant Isolation via organization_id

ID Strategy:

UUID

User Ownership Strategy:

One User → One Organization

---

# Core Entities

1. Organization
2. User
3. Role
4. Department
5. Employee
6. Profile
7. Session
8. Activity Logs
9. Audit Logs

---

# Relationship Overview

Organization
├── Users
├── Departments
├── Employees
├── Roles
└── Sessions

User
├── belongs to Organization
├── assigned Role
├── owns Profile
└── owns Sessions

Employee
├── belongs to Organization
└── optionally belongs to Department

Department
├── belongs to Organization
└── contains Employees

---

## Organization

Represents one company (tenant).

Examples:

* Acme Inc.
* OpenAI Corp.

Fields:

id - uuid, PK

name - string, required
slug - string, unique

created_at - timestamp
updated_at - timestamp
deleted_at - timestamp nullable

Indexes:

slug

Relationships:

Organization (1)
↓
Users (many)
Departments (many)
Employees (many)
Roles (many)
Sessions (many)

---

## Role

Defines permissions inside one organization.

Examples:

* Company Admin
* HR Staff
* Employee

Fields:

id - uuid, PK

organization_id - uuid, FK

name - string

created_at - timestamp
updated_at - timestamp

Indexes:

organization_id

Relationships:

Organization (1)
↓
Role (many)

Role (1)
↓
User (many)

---

## User

Represents login identity.

Fields:

id - uuid, PK

organization_id - uuid, FK
role_id - uuid, FK

email - string
password_hash - string

status - string

created_at - timestamp
updated_at - timestamp
deleted_at - timestamp nullable

Constraints:

UNIQUE (organization_id, email)

Indexes:

organization_id, role_id, status

Relationships:

Organization (1)
↓
User (many)

Role (1)
↓
User (many)

User (1)
↓
Profile (1)

User (1)
↓
Session (many)

---

## Department

Represents employee grouping.

Fields:

id - uuid, PK

organization_id - uuid, FK

name - string

created_at - timestamp
updated_at - timestamp
deleted_at - timestamp nullable

Indexes:

organization_id, Relationships:

Organization (1)
↓
Department (many)

Department (1)
↓
Employee (many)

---

## Employee

Represents workforce records.

Fields:

id - uuid, PK

organization_id - uuid, FK
department_id - uuid, nullable, FK

employee_number - string

first_name - string
middle_name - string, nullable
last_name - string
name_extension - string, nullable

job_title - string
employment_status - string
hire_date - date

created_at - timestamp
updated_at - timestamp
deleted_at - timestamp, nullable

Constraints:

UNIQUE (organization_id, employee_number)

Indexes:

organization_id, department_id, job_title, employment_status

Relationships:

Organization (1)
↓
Employee (many)

Department (0..1)
↓
Employee (many)

---

## Profile

Represents personal account details.

Fields:

id - uuid, PK

user_id - uuid, unique, FK

display_name - string, nullable
avatar_url - string, nullable

created_at - timestamp
updated_at - timestamp

Relationships:

User (1)
↓
Profile (1)

---

## Session

Authentication session storage.

Fields:

id - uuid, PK

organization_id - uuid, FK
user_id - uuid, FK

refresh_token_hash - string

expires_at - timestamp
last_used_at - timestamp, nullable
revoked_at - timestamp, nullable
created_at - timestamp

Indexes:

organization_id, user_id, expires_at, revoked_at

Relationships:

Organization (1)
↓
Session (many)

User (1)
↓
Session (many)

---

## Activity Logs

Business timeline.

Fields:

id - uuid, PK

organization_id - uuid, FK
actor_id - uuid, FK

action - string

event_type - string
metadata - JSONB

created_at - timestamp

Indexes:

organization_id, actor_id, created_at

---

## Audit Logs

Security tracking.

Rules:

Immutable

Fields:

id - uuid, PK

organization_id - uuid, FK
actor_id - uuid, FK

action - string
entity - string
entity_id - uuid

metadata - JSONB

created_at - timestamp

Indexes:

organization_id - actor_id, created_at

---

# Multi-Tenant Rules

Every business entity must include:

organization_id

Exceptions:

Organization
Profile

Rules:

Users cannot access records outside their organization.

Every query must filter organization_id.

Users belong to exactly one organization.

Cross-tenant access is prohibited.

---

# Text ERD

Organization
│
├── Role
│   └── User
│       ├── Profile
│       └── Session
│
├── Department
│   └── Employee
│
├── Employee
│
├── Activity Logs
│
└── Audit Logs
