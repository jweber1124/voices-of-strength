-- Voices of Strength Event Manager — database schema (current state)
-- Apply by pasting into the Supabase SQL Editor and running.

-- 1. EVENTS
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  status text not null default 'current' check (status in ('current', 'archived')),
  created_at timestamptz not null default now()
);

-- 2. VOLUNTEERS
create table volunteers (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  arrival_time time,
  departure_time time,
  cell text,
  email text,
  categories text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. SUB_TASK_COMPLETIONS — per-event check-off state for static sub-tasks
-- (sub_task_id is a string id from src/lib/task-categories.ts, e.g. 'set-up.sound')
create table sub_task_completions (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  sub_task_id text not null,
  is_complete boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (event_id, sub_task_id)
);

-- 4. CATEGORY_ASSIGNMENTS — per-event volunteer-to-task-category assignments
-- (category_id is a string id from src/lib/task-categories.ts, e.g. 'set-up')
create table category_assignments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  category_id text not null,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (event_id, category_id, volunteer_id)
);

-- Lock all tables (RLS = Row Level Security)
alter table events enable row level security;
alter table volunteers enable row level security;
alter table sub_task_completions enable row level security;
alter table category_assignments enable row level security;

-- Public-API access for Helper-side reads/writes.
grant select on events to anon, authenticated;
grant select, insert, update on volunteers to anon, authenticated;
-- sub_task_completions and category_assignments: NO public grants.
-- Manager accesses these via server-side code using the service_role/secret key.

-- Server-side (Manager) full access via the secret key.
-- With "Automatically expose new tables" disabled in Supabase settings,
-- service_role needs explicit grants — otherwise the sb_secret_ key gets
-- "permission denied" errors.
grant all on table events to service_role;
grant all on table volunteers to service_role;
grant all on table sub_task_completions to service_role;
grant all on table category_assignments to service_role;

-- RLS policies for publicly-accessible tables.
create policy "Anyone can read events"
on events for select
to anon, authenticated
using (true);

create policy "Anyone can read volunteers"
on volunteers for select
to anon, authenticated
using (true);

create policy "Anyone can insert volunteers"
on volunteers for insert
to anon, authenticated
with check (true);

create policy "Anyone can update volunteers"
on volunteers for update
to anon, authenticated
using (true)
with check (true);

-- Seed one starter event so volunteer signups have something to attach to.
insert into events (name, event_date, status) values
  ('Voices of Strength Open Mic — Next Event', current_date + interval '30 days', 'current');
