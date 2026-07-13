create extension if not exists pgcrypto with schema extensions;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  username text not null unique,
  password_hash text not null,
  role text not null default 'organization_admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint app_users_role_check check (role in ('super_admin', 'organization_admin', 'camp_manager', 'allocator', 'viewer'))
);

alter table public.organizations enable row level security;
alter table public.app_users enable row level security;

revoke all on public.app_users from anon, authenticated;
revoke all on public.organizations from anon, authenticated;

create or replace function public.verify_app_login(p_username text, p_password text)
returns table (
  user_id uuid,
  username text,
  role text,
  organization_id uuid
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select u.id, u.username, u.role, u.organization_id
  from public.app_users u
  where lower(u.username) = lower(trim(p_username))
    and u.active = true
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
  limit 1;
end;
$$;

revoke all on function public.verify_app_login(text, text) from public;
grant execute on function public.verify_app_login(text, text) to service_role;

insert into public.organizations (name)
values ('Default Organization')
on conflict (name) do nothing;

insert into public.app_users (organization_id, username, password_hash, role, active)
select id, 'admin', extensions.crypt('admin', extensions.gen_salt('bf')), 'organization_admin', true
from public.organizations
where name = 'Default Organization'
on conflict (username) do update
set password_hash = excluded.password_hash,
    role = excluded.role,
    active = true,
    updated_at = now();

