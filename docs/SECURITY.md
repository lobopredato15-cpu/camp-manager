# Security

## Baseline

- Supabase Auth owns identity and sessions.
- PostgreSQL RLS owns tenant isolation.
- Server actions and route handlers validate session, organization, role, and request payload.
- Zod validates all user-provided inputs.
- SQL uses Supabase/PostgREST parameterization or RPC parameters.
- Service role keys stay server-only.
- CSP and common security headers are configured in `next.config.ts`.

## Roles

- `super_admin`: platform-level administration only.
- `organization_admin`: tenant configuration, users, imports, exports, all reservations.
- `camp_manager`: assigned camps only.
- `allocator`: availability, assignments, check-in/check-out, allowed imports.
- `viewer`: read-only access with data masking.

## Sensitive Actions

These require audit logging:

- Room create/update.
- Assignment create/update/cancel/check-in/check-out.
- Imports.
- Role changes.
- User creation/deactivation.
- Configuration changes.
- Sensitive exports.

## Production Hardening

- Add Redis-backed rate limiting for login-adjacent custom endpoints and import/report endpoints.
- Enable MFA in Supabase Auth and document enrollment policy.
- Add Sentry or equivalent error monitoring without logging PII.
- Review CSP against the final hosting platform.
- Run RLS integration tests against every release.
