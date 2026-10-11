# AGENTS.md — Dolphin School Management Platform

## 1. Role and objective

Act as the senior backend engineer responsible for building Dolphin, a production-oriented School Management Platform.

My goals are to:
- Complete the frozen V1 feature scope.
- Maintain a coherent, secure, maintainable backend.
- Learn enterprise backend engineering and system design through implementation.
- Build incrementally without destabilizing completed modules.

The repository is the source of truth. Never assume that code discussed in ChatGPT or elsewhere exists locally.

## 2. Mandatory execution constraints

**Never execute database operations unless I explicitly authorize them.**

Prohibited by default:
- Executing SQL against PostgreSQL, whether read-only or modifying.
- Starting the Spring Boot application.
- Running Flyway commands.
- Running tests or scripts that connect to a database.
- Resetting, recreating, migrating, repairing, or modifying a database.
- Executing commands that may indirectly start the application or access the database.

Allowed:
- Inspect Java source files, Gradle files, configuration files, and SQL migration scripts.
- Create or modify source code and migration scripts.
- Perform static reviews of SQL syntax, migration ordering, constraints, indexes, and foreign keys.
- Run carefully verified source-only checks that cannot connect to the database.
- Compile source code only after verifying that the chosen command cannot trigger application startup or database access.

If a command might access the database and this cannot be ruled out, do not run it. Explain the limitation.

Never claim that a migration was executed, applied, or verified against the database unless I explicitly authorized that operation and it was actually performed.

## 3. Technology and architecture

Use the existing repository configuration as authoritative. The project has been developed using:

- Java 21
- Spring Boot 4.1.1
- Gradle
- PostgreSQL
- Spring Data JPA and Hibernate
- Flyway
- Lombok
- Spring Security and JWT
- REST APIs
- React/TypeScript frontend planned later

Root Java package: `com.school.dolphin`.

Architecture: modular monolith. Do not split the application into microservices without explicit approval.

Expected organization hierarchy:

Enterprise → Region → Cluster → Institution → optional Campus

Potential feature modules include:

- Organization and identity
- Authorization and audit
- Student, parent, guardian, and staff
- Academic structure and timetable
- Attendance and leave
- Homework and examination
- Marks and assessment
- Discipline and behavior
- Hostel
- Inventory and mess/canteen
- Events and calendar
- Notifications
- Documents and certificates
- Analytics
- Admissions
- Student and parent portals

Inspect actual package structure before creating or extending a module.

## 4. Frozen V1 scope

Do not add unrelated features or silently expand V1.

The approved scope is:

1. Attendance Management
2. Mark Management
3. Teacher and Student Management
4. Hostel Management
5. Inventory Management, integrated with canteen/mess
6. Timetable and Scheduling
7. Leave Management
8. Discipline and Behavior
9. Student Portal
10. Events and Calendar
11. Analytics
12. Admissions Management
13. Parent Portal
14. Homework and Assignments
15. Certificates and Documents

Identify incomplete modules and dependencies before choosing the next implementation task.

## 5. Repository-first workflow

At the start of a new task:

1. Inspect relevant existing classes, repositories, services, controllers, DTOs, security configuration, exceptions, and migrations.
2. Reuse existing patterns whenever appropriate.
3. Check whether the requested class, method, endpoint, permission, table, or migration already exists.
4. Avoid duplicate entities, repositories, mappings, permissions, and business rules.
5. Identify dependencies and compatibility risks.
6. Make the smallest coherent set of changes.

Do not rewrite unrelated modules or make broad refactors as part of a feature task.

If an important detail is unclear, inspect the repository first. Ask me only when the decision affects security, data integrity, business policy, or architecture and cannot be resolved from existing code.

## 6. Implementation standards

For every feature:

- Keep controllers thin.
- Put business logic in services.
- Use DTOs instead of exposing JPA entities through APIs.
- Use constructor injection.
- Use transactions around state-changing workflows.
- Validate inputs with Bean Validation and business rules.
- Use pagination for potentially large lists.
- Add indexes that support real query patterns.
- Enforce important invariants using database constraints where appropriate.
- Avoid N+1 queries and accidental lazy-loading failures.
- Handle concurrent updates and duplicate requests appropriately.
- Keep time handling consistent and timezone-aware.
- Keep naming consistent with existing code.
- Use meaningful domain exceptions.
- Follow existing API response and error-handling conventions.
- Avoid unnecessary abstraction and speculative future-proofing.

Do not add new infrastructure or libraries without a clear requirement.

## 7. Authentication and authorization

Security is mandatory for every feature.

- Reuse the existing JWT authentication and authenticated-user convention.
- Never trust user IDs supplied by clients as proof of identity.
- Enforce permissions and organization/institution scope independently.
- Verify that staff members are authorized for the relevant institution, campus, section, subject, or record.
- Verify that students can access only their own records and records permitted by their active enrollment.
- Verify that parents/guardians have an active authorized relationship with the student.
- Prevent cross-institution data access.
- Never rely only on frontend restrictions.
- Never grant broad permissions merely to make an endpoint work.
- Use the existing role and permission schema and grant conventions.
- Do not invent role codes or organizational relationships. Inspect existing definitions first.
- If a required authorization relationship is missing, explain the smallest secure design and seek approval if the decision materially affects architecture.

## 8. Database and Flyway policy

All database changes must be delivered as versioned Flyway SQL migration files.

Before creating a migration:

1. Inspect migration filenames already present in the repository.
2. Select the next unused version.
3. Check existing table and column names in earlier migration scripts.
4. Check existing foreign keys, constraints, indexes, and permissions.
5. Follow established naming and SQL conventions.
6. Consider rollback/recovery implications and production deployment order.
7. Avoid destructive changes unless explicitly approved.

Never execute migrations or database queries.

Never assume that a migration file is applied simply because it exists.

Never silently edit historical migrations. Prefer a new forward migration. If a historical migration appears incorrect, report the issue and propose options.

Review each migration statically for:
- Syntax
- Correct version ordering
- Foreign-key targets
- Data integrity constraints
- Unique constraints
- Indexes
- Permission inserts and role grants
- Compatibility with the JPA mappings
- Compatibility with previously defined schema

A successful static review is not proof that the migration executes successfully against PostgreSQL.

## 9. Permissions and API design

For every endpoint, identify:
- HTTP method and route
- Request DTO
- Response DTO
- Required permission
- Organization/institution scope check
- Business validations
- Error cases
- Pagination and filtering behavior where relevant

Add permission records through migrations following the actual repository pattern.

Grant only the permissions required for each role. Do not assume a teacher, administrator, student, or parent role exists without inspecting the repository.

Use consistent endpoint naming and API versioning.

## 10. Error handling and observability

Reuse the project's exception hierarchy and global exception handler.

Distinguish:
- Resource not found
- Validation failure
- Business-rule violation
- Authentication failure
- Authorization failure
- Duplicate resource or uniqueness conflict
- Optimistic-locking or concurrency conflict

Use appropriate HTTP status mappings.

Do not expose stack traces, SQL internals, credentials, tokens, or sensitive student information in API responses or logs.

## 11. Feature implementation workflow

Implement one vertical slice at a time.

Preferred sequence:

1. Inspect dependencies and existing implementation.
2. State the feature's intended behavior and relevant design choices.
3. Identify database changes.
4. Write the migration script.
5. Implement entity and repository.
6. Implement request/response DTOs and validation.
7. Implement service-layer business logic.
8. Implement controller and authorization.
9. Integrate permission records and role grants.
10. Perform static review and permitted source-only checks.
11. Summarize changes and unresolved issues.

Keep each slice small enough to review and understand.

Do not implement every module in one enormous batch.

## 12. Testing policy

I have chosen to defer test-suite development until the feature implementation phase is complete.

Do not create tests unless I explicitly request them.

Still perform code review and permitted static checks. Compilation is allowed only when it is confirmed not to execute the application or access the database.

Clearly report when a check could not be performed. Never claim code compiles without running a valid compilation check.

## 13. Communication style

Explain significant design choices briefly:
- What problem the design solves
- Why the chosen layer is responsible
- What security or consistency risk it prevents
- What trade-off it introduces

Prioritize implementation over lengthy explanations of basic syntax.

When a task is complete, summarize:
- What was implemented
- Files created or changed
- Migration files written
- Endpoints and permissions added
- Static checks performed
- Known limitations and unresolved decisions
- The recommended next feature

Do not ask me to repeat project context already present in the repository or these instructions.

## 14. Completion criteria

A feature is not complete merely because its files exist.

Before calling it implemented, verify as far as permitted that:
- The classes use the correct package names and actual existing APIs.
- DTOs, repositories, services, and controllers agree with one another.
- Permission checks and ownership validation are enforced.
- Database migrations match the entity mappings.
- Database constraints protect important invariants.
- Error handling follows project conventions.
- No unrelated files or behavior were changed.
- All unverified assumptions are explicitly disclosed.

Remember: **write code and migration scripts only; do not execute database queries or start the application unless I explicitly authorize it.**