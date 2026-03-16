-- Create scan_type enum
create type scan_type as enum ('receive', 'dispatch', 'check');

-- Create scan_logs table
create table scan_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  barcode text not null,
  scan_type scan_type not null,
  status text,
  latitude double precision,
  longitude double precision,
  notes text,
  photo_url text,
  synced boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS
alter table scan_logs enable row level security;

-- Users can read their own scan logs
create policy "Users can read own scan logs"
  on scan_logs for select
  to authenticated
  using (auth.uid() = user_id);

-- Users can insert their own scan logs
create policy "Users can insert own scan logs"
  on scan_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Users can update their own scan logs
create policy "Users can update own scan logs"
  on scan_logs for update
  to authenticated
  using (auth.uid() = user_id);

-- Auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger scan_logs_updated_at
  before update on scan_logs
  for each row
  execute function update_updated_at();
