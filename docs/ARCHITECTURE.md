# Architecture

## Goals

Camp Accommodation Manager is a multi-tenant operational application. Every tenant owns independent camps, buildings, rooms, beds, workers, companies, flights, imports, assignments, reports, and audit history.

## Core Decisions

- Next.js App Router is used for server-first pages, route handlers, and server actions.
- Supabase Auth provides identity. PostgreSQL RLS enforces tenant and role boundaries.
- `organization_id` is present on all tenant-owned operational tables.
- The browser never supplies trusted tenancy. Server code resolves allowed organizations from the authenticated user and membership rows.
- Critical rules live in both application services and PostgreSQL functions/triggers where possible.
- Assignment availability is derived from assignment intervals and room/bed capacity. Room state never stores `occupied` or `available`.
- Imports are staged, validated, and only committed after explicit confirmation.
- The automatic allocator is deterministic and auditable; it records reasons instead of using AI.

## Major Modules

- `app/*`: App Router pages and route groups.
- `components/*`: shadcn-compatible UI primitives and feature components.
- `lib/supabase/*`: server/client Supabase factories.
- `lib/validations/*`: Zod contracts for inputs.
- `lib/domain/*`: authorization, availability, allocation, and business rules.
- `lib/import/*`: XLSX/CSV parsing, date parsing, column mapping, and dry-run validation.
- `supabase/migrations/*`: database schema, functions, triggers, RLS, views, and seed-safe development data.
- `tests/*`: unit and end-to-end tests.

## Tenant Boundary

The authorization model is:

1. Authenticated user exists in `auth.users`.
2. User has one or more rows in `organization_memberships`.
3. Role and optional camp grants determine what the user can read or mutate.
4. RLS validates the same boundary at query time.

Super Admin users are platform operators and should not perform daily camp operations.

## Important Risks

- Concurrency conflicts can overbook rooms if assignment writes bypass the provided RPC.
- Broad Viewer access can expose personal information if field-level masking is not consistently applied.
- Import files may contain sensitive labor data; retention and access controls must be enforced.
- RLS policies need integration tests against real Supabase/PostgreSQL before production.
- Dependency versions must be reviewed before deployment and locked with a generated lockfile.

## Acceptance List For Foundation

- Strict TypeScript configured.
- App Router project structure exists.
- Supabase schema includes tenant tables, RLS, audit logs, assignment constraints, and availability RPCs.
- Documentation explains setup, security, imports, testing, and deployment.
- Unit tests cover pure availability/date/mapping/allocation rules.
- No service-role secret is imported by client modules.
