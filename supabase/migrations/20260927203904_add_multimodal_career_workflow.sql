-- Processing attempts are independent of analysis credits. They are never
-- client-refundable: direct RPC callers cannot repeatedly reset a provider limit.
create table public.model_operations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid references public.analyses(id) on delete set null,
  kind text not null check (kind in ('vision', 'transcription', 'interview')),
  request_key uuid not null,
  usage_date date not null default (timezone('Asia/Singapore', now()))::date,
  created_at timestamptz not null default now(),
  unique (user_id, kind, request_key)
);
create index model_operations_daily_idx on public.model_operations (user_id, usage_date, kind);
alter table public.model_operations enable row level security;
revoke all on public.model_operations from public, anon, authenticated;
grant select on public.model_operations to authenticated;
create policy "Owners read processing usage" on public.model_operations
  for select to authenticated using ((select auth.uid()) = user_id);

create table public.interview_practice (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  operation_id uuid not null unique references public.model_operations(id),
  question text not null check (char_length(question) between 5 and 1000),
  transcript text not null check (char_length(transcript) between 30 and 8000),
  feedback jsonb not null check (jsonb_typeof(feedback) = 'object'),
  source text not null check (source in ('openai', 'local')),
  model text not null check (char_length(model) between 1 and 100),
  created_at timestamptz not null default now()
);
create index interview_practice_analysis_idx on public.interview_practice (analysis_id, created_at desc);
alter table public.interview_practice enable row level security;
revoke all on public.interview_practice from public, anon, authenticated;
grant select, delete on public.interview_practice to authenticated;
create policy "Owners read practice" on public.interview_practice
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "Owners delete practice" on public.interview_practice
  for delete to authenticated using ((select auth.uid()) = user_id);

create or replace function public.reserve_model_operation(p_kind text, p_request_key uuid, p_analysis_id uuid default null)
returns table (accepted boolean, reason text, operation_id uuid, remaining integer)
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_date date := (timezone('Asia/Singapore', now()))::date;
  v_count integer;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  if p_kind is null or p_kind not in ('vision', 'transcription', 'interview') or p_request_key is null then
    raise exception 'Invalid processing request' using errcode = '22023';
  end if;
  if (p_kind = 'vision' and p_analysis_id is not null) or
     (p_kind <> 'vision' and (p_analysis_id is null or not exists (
       select 1 from public.analyses where id = p_analysis_id and user_id = v_user
     ))) then
    return query select false, 'not_found', null::uuid, 0; return;
  end if;
  -- Serialize across request keys and midnight; user identity is session-derived.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text || ':' || p_kind, 0));
  select count(*)::integer into v_count from public.model_operations
    where user_id = v_user and usage_date = v_date and kind = p_kind;
  select id into v_id from public.model_operations
    where user_id = v_user and kind = p_kind and request_key = p_request_key;
  if found then return query select false, 'duplicate', v_id, greatest(6 - v_count, 0); return; end if;
  if v_count >= 6 then return query select false, 'daily_limit', null::uuid, 0; return; end if;
  insert into public.model_operations (user_id, analysis_id, kind, request_key, usage_date)
    values (v_user, p_analysis_id, p_kind, p_request_key, v_date) returning id into v_id;
  return query select true, 'accepted', v_id, 5 - v_count;
end;
$$;

create or replace function public.save_interview_practice(
  p_operation_id uuid, p_question text, p_transcript text, p_feedback jsonb, p_source text, p_model text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := auth.uid();
  v_operation public.model_operations%rowtype;
  v_id uuid;
begin
  if v_user is null then raise exception 'Authentication required' using errcode = '28000'; end if;
  select * into v_operation from public.model_operations
    where id = p_operation_id and user_id = v_user and kind = 'interview' for update;
  if not found or v_operation.analysis_id is null or not exists (
    select 1 from public.analyses where id = v_operation.analysis_id and user_id = v_user
  ) then raise exception 'Owned report and reservation required' using errcode = '42501'; end if;
  if not exists (
    select 1 from public.analyses a,
      jsonb_array_elements_text(a.report -> 'interviewPreparation' -> 'questions') as q(value)
    where a.id = v_operation.analysis_id and q.value = p_question
  ) then raise exception 'Question must belong to the report' using errcode = '22023'; end if;
  select id into v_id from public.interview_practice where operation_id = p_operation_id;
  if found then return v_id; end if;
  if octet_length(p_feedback::text) > 20000 then raise exception 'Feedback too large' using errcode = '22023'; end if;
  insert into public.interview_practice (user_id, analysis_id, operation_id, question, transcript, feedback, source, model)
    values (v_user, v_operation.analysis_id, p_operation_id, p_question, p_transcript, p_feedback, p_source, p_model)
    returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.reserve_model_operation(text, uuid, uuid) from public, anon;
revoke all on function public.save_interview_practice(uuid, text, text, jsonb, text, text) from public, anon;
grant execute on function public.reserve_model_operation(text, uuid, uuid) to authenticated;
grant execute on function public.save_interview_practice(uuid, text, text, jsonb, text, text) to authenticated;
