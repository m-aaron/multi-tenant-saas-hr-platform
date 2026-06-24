# Entities

## Project Name

Multi-Tenant SaaS HR Management Platform

---

## Purpose

This document defines the core business entities of the system and their relationships.

This is NOT the database schema.

The goal is to identify the business objects before designing tables and columns.

---

# Entity Overview

Version 1 entities:

1. Organization
2. User
3. Role
4. Department
5. Employee

---

# 1. Organization

Description:

Represents a customer company using the platform.

Responsibilities:

* Own users
* Own departments
* Own employees
* Isolate tenant data

Examples:

* ABC Manufacturing
* TechNova
* CoffeeHub

Business Rules:

* One organization equals one tenant
* Organizations cannot access data from other organizations

Relationships:

Organization
→ Users

Organization
→ Departments

Organization
→ Employees

---

# 2. User

Description:

Represents a system account that can access the platform.

Examples:

* Company Admin
* HR Staff
* Employee

Responsibilities:

* Authenticate
* Access features based on permissions

Business Rules:

* User belongs to exactly one organization
* User must have one role
* Email must be unique within organization

Relationships:

User
→ Organization

User
→ Role

---

# 3. Role

Description:

Defines permissions available to users.

Version 1 Roles:

Company Admin

Permissions:

* Manage organization
* Manage users
* Manage departments
* Manage employees

HR Staff

Permissions:

* Manage employees
* View departments

Employee

Permissions:

* View own profile

Business Rules:

* One user has one role

Relationships:

Role
→ Users

---

# 4. Department

Description:

Represents a logical organizational group.

Examples:

* Engineering
* Human Resources
* Finance

Responsibilities:

* Group employees

Business Rules:

* Department belongs to one organization
* Department names should be unique within organization

Relationships:

Department
→ Organization

Department
→ Employees

---

# 5. Employee

Description:

Represents employee records managed by HR.

Responsibilities:

* Store employee information
* Associate employees with departments

Business Rules:

* Employee belongs to one organization
* Employee belongs to one department
* Employees cannot exist outside organization

Relationships:

Employee
→ Organization

Employee
→ Department

---

# Relationship Summary

Organization
├── Users
├── Departments
└── Employees

User
└── Role

Department
└── Employees

---

# Future Entities (Not MVP)

These entities are intentionally postponed.

* Leave Request
* Attendance
* Payroll
* Notifications
* Audit Logs
* Subscription
* Activity Tracking

---

# Questions This Document Answers

Who owns data?
→ Organization

Who logs into the system?
→ User

Who controls permissions?
→ Role

Who groups employees?
→ Department

Who represents workforce records?
→ Employee