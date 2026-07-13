# Deployment

## Environment

Required variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `APP_URL`
- `IMPORT_FILE_RETENTION_DAYS`

## Steps

1. Install dependencies with a lockfile.
2. Run lint, typecheck, unit tests, and e2e tests.
3. Apply Supabase migrations.
4. Configure Auth email templates and redirect URLs.
5. Create the first Super Admin through a controlled server-side bootstrap or SQL console.
6. Deploy the Next.js app.
7. Verify security headers, RLS smoke tests, login, and assignment conflict prevention.

## First Administrator

Create a Supabase Auth user, then insert a row in `platform_admins` for that user from a trusted SQL console. Do not add a public endpoint that can create platform admins.
