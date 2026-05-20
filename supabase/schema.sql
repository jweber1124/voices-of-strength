-- Voices of Strength Event Manager — database schema
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
  time_available text,
  cell text,
  email text,
  categories text[] not null default '{}',
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TASKS
create table tasks (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  title text not null,
  info text,
  is_complete boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- 4. TASK_ASSIGNMENTS (links volunteers <-> tasks, many-to-many)
create table task_assignments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  volunteer_id uuid not null references volunteers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (task_id, volunteer_id)
);

-- Lock all four tables (RLS = Row Level Security)
alter table events enable row level security;
alter table volunteers enable row level security;
alter table tasks enable row level security;
alter table task_assignments enable row level security;

-- Open public-API access to just what Helpers need.
-- (Tasks/task_assignments stay closed at this level; Manager will access via service_role on the server.)
grant select on events to anon, authenticated;
grant select, insert on volunteers to anon, authenticated;

-- RLS policies: the actual "what's allowed" rules.
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

-- Seed one starter event so volunteer signups have something to attach to.
-- Rename and set the real date via the Manager UI once that's built.
insert into events (name, event_date, status) values
  ('Voices of Strength Open Mic — Next Event', current_date + interval '30 days', 'current');
