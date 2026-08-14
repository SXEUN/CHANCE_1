-- 사용자 초기 설정: 주사 종류 / 투여 시각 / 투여 기간
-- 익명 로그인으로 발급된 auth.users 행 하나당 설정 한 벌이므로 user_id 가 곧 PK 다.

create table if not exists public.user_settings (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  injection_name   text not null,
  -- 시각은 time 대신 시/분을 나눠 저장한다. 화면의 휠 피커가 12시간제(오전/오후)라
  -- 되돌려 그릴 때 값이 그대로 왕복해야 하고, 나중에 "몇 시대에 주로 맞는지" 같은
  -- 집계를 할 때도 시 단위로 바로 묶을 수 있다.
  scheduled_hour   smallint not null check (scheduled_hour between 0 and 23),
  scheduled_minute smallint not null check (scheduled_minute between 0 and 59),
  start_date       date not null,
  end_date         date not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint user_settings_period_valid check (end_date >= start_date)
);

alter table public.user_settings enable row level security;

-- RLS: 자기 행에만 접근할 수 있다.
-- 익명 유저라도 auth.uid() 는 발급되므로 이것만으로 격리가 성립한다.
drop policy if exists "본인 설정 조회" on public.user_settings;
create policy "본인 설정 조회"
  on public.user_settings for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "본인 설정 생성" on public.user_settings;
create policy "본인 설정 생성"
  on public.user_settings for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "본인 설정 수정" on public.user_settings;
create policy "본인 설정 수정"
  on public.user_settings for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_settings_touch_updated_at on public.user_settings;
create trigger user_settings_touch_updated_at
  before update on public.user_settings
  for each row execute function public.touch_updated_at();
