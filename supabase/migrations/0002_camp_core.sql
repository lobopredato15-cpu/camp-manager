create table if not exists public.camps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  location text not null default '',
  manager text not null default '',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  camp_id uuid not null references public.camps(id) on delete cascade,
  building text not null default 'Main',
  name text not null,
  beds integer not null check (beds > 0 and beds <= 50),
  status text not null default 'available' check (status in ('available', 'maintenance', 'reserved')),
  created_at timestamptz not null default now(),
  unique (organization_id, camp_id, name)
);

create table if not exists public.people (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  company text not null default '',
  trade text not null default '',
  flight text not null default 'Pending',
  created_at timestamptz not null default now()
);

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  person_id uuid not null references public.people(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  status text not null default 'planned' check (status in ('planned', 'checked-in', 'checked-out', 'cancelled')),
  created_at timestamptz not null default now(),
  constraint assignments_valid_dates check (end_date > start_date)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references public.app_users(id) on delete set null,
  action text not null,
  detail text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists camps_org_idx on public.camps (organization_id);
create index if not exists rooms_org_camp_idx on public.rooms (organization_id, camp_id);
create index if not exists people_org_name_idx on public.people (organization_id, lower(name));
create index if not exists assignments_org_room_status_idx on public.assignments (organization_id, room_id, status);
create index if not exists assignments_org_person_status_idx on public.assignments (organization_id, person_id, status);
create index if not exists audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);

alter table public.camps enable row level security;
alter table public.rooms enable row level security;
alter table public.people enable row level security;
alter table public.assignments enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.camps from anon, authenticated;
revoke all on public.rooms from anon, authenticated;
revoke all on public.people from anon, authenticated;
revoke all on public.assignments from anon, authenticated;
revoke all on public.audit_logs from anon, authenticated;

create or replace function public.create_audit_log(
  p_organization_id uuid,
  p_actor_user_id uuid,
  p_action text,
  p_detail text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (organization_id, actor_user_id, action, detail)
  values (p_organization_id, p_actor_user_id, p_action, coalesce(p_detail, ''));
end;
$$;

revoke all on function public.create_audit_log(uuid, uuid, text, text) from public;
grant execute on function public.create_audit_log(uuid, uuid, text, text) to service_role;
