# Camp Accommodation Manager

Production-oriented multi-tenant accommodation operations system for camps, mines, construction sites, workforce hotels, and FIFO accommodation.

## Phase Plan

1. Foundation: repository structure, data model, RLS, security posture, documentation, and domain rules.
2. Authentication and tenancy: Supabase Auth, organization membership, roles, route protection, invitations, and first-admin bootstrap.
3. Camp inventory: camps, buildings, rooms, beds, companies, people, flights, and server-validated CRUD.
4. Assignments: availability RPCs, conflict prevention, check-in/check-out, audit logging, and dashboard metrics.
5. Imports: XLSX/CSV parser, mapping assistant, dry run validation, error CSV, confirmed import, and undo.
6. Planning and allocation: planning board, deterministic assignment proposals, conflict review, and keyboard-safe alternatives.
7. Reports and exports: permission-aware occupancy, residents, arrivals, departures, room availability, company, maintenance, and import reports.
8. Hardening: complete tests, rate limiting backend, MFA rollout notes, retention/anonymization jobs, and deployment readiness.

## Requirements

- Node.js 22 LTS or newer.
- pnpm 9 or newer.
- Supabase project with PostgreSQL and Auth enabled.
- Supabase CLI for applying migrations locally or remotely.

## Installation

```bash
pnpm install
cp .env.example .env.local
```

Fill in the Supabase variables. Never expose `SUPABASE_SERVICE_ROLE_KEY` to browser code.

## Supabase Setup

1. Create a Supabase project.
2. Enable email/password authentication.
3. Apply migrations:

```bash
supabase db push
```

4. Create the first platform admin using a secure SQL console or controlled bootstrap script described in `docs/DEPLOYMENT.md`.

## Local Development

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Tests

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Current Increment

This repository currently contains the architecture, schema, RLS foundation, domain validators, import helpers, deterministic allocation skeleton, and initial App Router screens. The product is not feature-complete yet; each phase must be completed with server-side validation, database enforcement, and tests before being marked done.

## Deployment

See `docs/DEPLOYMENT.md`.
