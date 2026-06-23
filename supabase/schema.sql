-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  full_name text,
  profession text,
  organization text,
  xp integer default 0,
  level integer default 1,
  streak integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tasks Table
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  priority text check (priority in ('low', 'medium', 'high', 'critical')),
  due_date date,
  status text check (status in ('pending', 'in-progress', 'completed')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Calendar Events Table
create table public.calendar_events (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  description text,
  category text,
  color text,
  start_date date not null,
  start_time time,
  end_date date not null,
  end_time time,
  all_day boolean default false,
  location text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Daily Plans Table
create table public.daily_plans (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  schedule jsonb not null default '[]'::jsonb,
  workload_minutes integer default 0,
  top_priorities jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 5. Productivity Checks Table (formerly mood_history)
create table public.productivity_checks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  mood_value text,
  stress_level numeric,
  focus_level numeric,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- 6. Focus Sessions Table (formerly pomodoro_history)
create table public.focus_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null,
  sessions_count integer default 0,
  total_minutes integer default 0,
  focus_score numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- RLS POLICIES --

alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.daily_plans enable row level security;
alter table public.productivity_checks enable row level security;
alter table public.focus_sessions enable row level security;

-- Profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Tasks
create policy "Users can view own tasks" on public.tasks for select using (auth.uid() = user_id);
create policy "Users can insert own tasks" on public.tasks for insert with check (auth.uid() = user_id);
create policy "Users can update own tasks" on public.tasks for update using (auth.uid() = user_id);
create policy "Users can delete own tasks" on public.tasks for delete using (auth.uid() = user_id);

-- Calendar Events
create policy "Users can view own events" on public.calendar_events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on public.calendar_events for insert with check (auth.uid() = user_id);
create policy "Users can update own events" on public.calendar_events for update using (auth.uid() = user_id);
create policy "Users can delete own events" on public.calendar_events for delete using (auth.uid() = user_id);

-- Daily Plans
create policy "Users can view own daily plans" on public.daily_plans for select using (auth.uid() = user_id);
create policy "Users can insert own daily plans" on public.daily_plans for insert with check (auth.uid() = user_id);
create policy "Users can update own daily plans" on public.daily_plans for update using (auth.uid() = user_id);
create policy "Users can delete own daily plans" on public.daily_plans for delete using (auth.uid() = user_id);

-- Productivity Checks
create policy "Users can view own productivity checks" on public.productivity_checks for select using (auth.uid() = user_id);
create policy "Users can insert own productivity checks" on public.productivity_checks for insert with check (auth.uid() = user_id);
create policy "Users can update own productivity checks" on public.productivity_checks for update using (auth.uid() = user_id);
create policy "Users can delete own productivity checks" on public.productivity_checks for delete using (auth.uid() = user_id);

-- Focus Sessions
create policy "Users can view own focus sessions" on public.focus_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own focus sessions" on public.focus_sessions for insert with check (auth.uid() = user_id);
create policy "Users can update own focus sessions" on public.focus_sessions for update using (auth.uid() = user_id);
create policy "Users can delete own focus sessions" on public.focus_sessions for delete using (auth.uid() = user_id);

-- AUTH TRIGGER --

-- Create a function to handle new users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, profession, organization)
  values (new.id, new.raw_user_meta_data->>'full_name', '', '');
  return new;
end;
$$ language plpgsql security definer;

-- Create the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
