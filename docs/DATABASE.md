# Database

The initial migration is `supabase/migrations/0001_initial_schema.sql`.

## Main Tables

- `organizations`
- `organization_memberships`
- `membership_camp_access`
- `camps`
- `buildings`
- `rooms`
- `beds`
- `companies`
- `people`
- `flights`
- `person_movements`
- `assignments`
- `import_jobs`
- `import_job_rows`
- `audit_logs`
- `privacy_policies`

## Rules

- All operational tables use UUID primary keys.
- Tenant tables include `organization_id`.
- Operational rows use soft-delete columns where deletion could affect audit or history.
- Assignment intervals use `tstzrange(start_at, end_at, '[)')`.
- Cancelled assignments do not consume capacity.
- Checked-out assignments consume capacity until `check_out_at`.
- PostgreSQL functions prevent overlapping person assignments, overlapping bed assignments, capacity overflow, invalid room state, and invalid date order.

## Views

- `room_occupancy_now`: current room occupancy by organization, camp, and room.
- `future_room_occupancy`: future planned/confirmed occupancy.

## RLS

RLS is enabled on tenant-exposed tables. Policies call helper functions:

- `app.current_user_role(organization_id)`
- `app.is_org_member(organization_id)`
- `app.can_access_camp(organization_id, camp_id)`
- `app.has_min_role(organization_id, roles[])`

Super Admin policies are intentionally narrow and should be used only for platform administration.
