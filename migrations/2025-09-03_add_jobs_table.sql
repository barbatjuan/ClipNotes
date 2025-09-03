-- Create jobs table (idempotent) compatible with Supabase
-- Uses gen_random_uuid() instead of uuid_generate_v4()
-- Ensure pgcrypto is available in Supabase (it is by default)

create table if not exists public.jobs (
  id uuid primary key not null default gen_random_uuid(),
  user_id uuid not null,
  input_url text not null,
  status text not null default 'pending',
  audio_duration numeric null,
  raw_transcription text null,
  ai_summary text null,
  title text null,
  error_message text null,
  progress integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now()
) tablespace pg_default;

-- Updated_at trigger (optional): keep updated_at in sync
create or replace function public.set_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_set_timestamp
before update on public.jobs
for each row
execute function public.set_timestamp();

-- Minutes processed trigger hook (assumes function exists)
-- If your function public.update_minutes_processed() already exists, this will attach the trigger.
-- Otherwise, comment this block or create the function before running.
create trigger trg_update_minutes_processed
after insert or update on public.jobs
for each row
execute function public.update_minutes_processed();
