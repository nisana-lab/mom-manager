-- Web Push: מנוי + צילום מצב + דה-דופליקציה לתזכורות ולסיכום יומי
create table if not exists mom_push_devices (
  device_id text primary key,
  subscription jsonb not null default '{}',
  state jsonb not null default '{}',
  background_push boolean not null default false,
  pushed_reminder_date text not null default '',
  pushed_reminder_keys text[] not null default '{}',
  last_summary_push_date text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists mom_push_devices_background_idx
  on mom_push_devices (background_push)
  where background_push = true;
