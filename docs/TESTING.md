# Testing

## Unit Tests

Target pure and server-domain logic:

- Availability calculation.
- Interval conflicts.
- Capacity rules.
- Permission matrix.
- Column mapping.
- Date parsing.
- Duplicate detection.
- Deterministic allocation.
- Check-in/check-out state transitions.

## Integration Tests

Use a real local Supabase/PostgreSQL instance for:

- RLS isolation between organizations.
- Assignment RPC concurrency.
- Audit trigger behavior.
- Import confirmation and undo.

## E2E Tests

Playwright scenarios:

- Login.
- Create camp.
- Create rooms and beds.
- Import people.
- Detect import errors.
- Create assignment.
- Prevent double booking.
- Check in.
- Check out.
- Dashboard metrics.
- Viewer access.
- Cross-organization denial.
