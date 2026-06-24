# User Flows

## Project Name

Multi-Tenant SaaS HR Management Platform

---

## Purpose

This document defines the primary user interactions and system behavior for Version 1 (MVP).

User flows describe how requests move through the system from user action to backend processing and response.

This document is implementation-oriented but remains independent of code.

---

# Actors

Version 1 actors:

* Company Admin
* HR Staff
* Employee

---

# Flow 1 — Register Organization

Goal:

Allow a company to create an account and start using the platform.

Trigger:

Company Admin submits registration.

Flow:

Register
↓
Validate input
↓
Check organization uniqueness
↓
Create organization
↓
Create admin user
↓
Generate authentication session
↓
Return success response

Rules:

* Organization must be unique
* Admin user becomes organization owner
* Organization becomes tenant

Result:

Organization and first user are created.

---

# Flow 2 — Login

Goal:

Authenticate users.

Trigger:

User submits credentials.

Flow:

Submit credentials
↓
Validate input
↓
Find user
↓
Verify password
↓
Generate access token
↓
Generate refresh token
↓
Return session

Rules:

* Invalid credentials return error
* Tokens must expire

Result:

Authenticated session created.

---

# Flow 3 — View Profile

Goal:

Allow authenticated users to access their profile.

Trigger:

Authenticated request.

Flow:

Receive request
↓
Validate token
↓
Resolve organization
↓
Load profile
↓
Return profile

Rules:

* User only accesses own profile

Result:

Profile displayed.

---

# Flow 4 — Invite User

Goal:

Allow Company Admin to create additional users.

Trigger:

Company Admin creates invitation.

Flow:

Authenticate
↓
Validate role permission
↓
Validate input
↓
Create user
↓
Assign role
↓
Return result

Rules:

* User belongs to current organization
* User email must be unique within organization

Result:

User account created.

---

# Flow 5 — Create Department

Goal:

Create organizational structure.

Trigger:

Admin or HR Staff submits department.

Flow:

Authenticate
↓
Authorize
↓
Validate input
↓
Create department
↓
Return result

Rules:

* Department belongs to organization
* Duplicate names not allowed inside organization

Result:

Department created.

---

# Flow 6 — Create Employee

Goal:

Store employee information.

Trigger:

Admin or HR Staff submits employee data.

Flow:

Authenticate
↓
Authorize
↓
Validate input
↓
Resolve tenant
↓
Create employee
↓
Return response

Rules:

* Backend assigns organization ownership
* Employee must belong to one department

Result:

Employee record created.

---

# Flow 7 — Update Employee

Goal:

Modify employee information.

Trigger:

Authorized update request.

Flow:

Authenticate
↓
Authorize
↓
Validate employee
↓
Update record
↓
Return response

Rules:

* Cross-tenant updates prohibited

Result:

Employee updated.

---

# Flow 8 — Archive Employee

Goal:

Soft remove employee records.

Trigger:

Authorized archive request.

Flow:

Authenticate
↓
Authorize
↓
Validate employee
↓
Archive employee
↓
Return result

Rules:

* Records should remain recoverable

Result:

Employee hidden from active lists.

---

# Authorization Rules

Company Admin

Can:

* Manage organization
* Manage users
* Manage departments
* Manage employees

---

HR Staff

Can:

* Manage employees
* View departments

---

Employee

Can:

* View profile only

---

# Multi-Tenant Rules

Every request must:

Authenticate
↓
Resolve tenant
↓
Validate access
↓
Execute action

System must never expose another organization’s data.

---

# Questions This Document Answers

How does registration work?

How does login work?

Who can create employees?

Who owns created records?

How is tenant isolation enforced?
