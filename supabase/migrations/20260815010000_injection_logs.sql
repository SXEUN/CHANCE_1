-- 날짜별 주사 기록.
-- 이 앱은 "하루 한 번" 투여하는 사용자를 위한 것이므로 하루에 한 행만 남긴다.
-- 같은 날 다시 저장하면 부위를 고쳐 쓴다(upsert).

create table if not exists public.injection_logs (
  user_id    uuid not null references auth.users (id) on delete cascade,
  log_date   date not null,
  -- LOWER 는 화면에 아직 노출하지 않지만, 나중에 열 때 마이그레이션이
  -- 다시 필요하지 않도록 제약에 미리 넣어둔다.
  site       text not null check (site in ('LEFT', 'RIGHT', 'LOWER')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- 날짜 목록 화면이 "이 기간의 기록 전부"를 한 번에 읽으므로 그 순서대로 훑게 한다.
create index if not exists injection_logs_user_date_idx
  on public.injection_logs (user_id, log_date desc);

alter table public.injection_logs enable row level security;

drop policy if exists "본인 기록 조회" on public.injection_logs;
create policy "본인 기록 조회"
  on public.injection_logs for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "본인 기록 생성" on public.injection_logs;
create policy "본인 기록 생성"
  on public.injection_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "본인 기록 수정" on public.injection_logs;
create policy "본인 기록 수정"
  on public.injection_logs for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "본인 기록 삭제" on public.injection_logs;
create policy "본인 기록 삭제"
  on public.injection_logs for delete
  to authenticated
  using (auth.uid() = user_id);

drop trigger if exists injection_logs_touch_updated_at on public.injection_logs;
create trigger injection_logs_touch_updated_at
  before update on public.injection_logs
  for each row execute function public.touch_updated_at();
