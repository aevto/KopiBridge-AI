create extension if not exists pgcrypto with schema extensions;

create table public.analyses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_role text not null check (char_length(target_role) between 2 and 120),
  company text check (company is null or char_length(company) <= 120),
  resume_filename text check (resume_filename is null or char_length(resume_filename) <= 180),
  status text not null default 'completed' check (status = 'completed'),
  overall_score smallint not null check (overall_score between 0 and 100),
  score_label text not null check (char_length(score_label) between 2 and 60),
  final_recommendation text not null check (char_length(final_recommendation) between 2 and 80),
  report jsonb not null,
  idempotency_key text not null check (char_length(idempotency_key) between 16 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, idempotency_key)
);

create index analyses_user_created_at_idx on public.analyses (user_id, created_at desc);

create table public.daily_credit_balances (
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_date date not null,
  daily_limit smallint not null default 3 check (daily_limit >= 0),
  used_count smallint not null default 0 check (used_count >= 0 and used_count <= daily_limit),
  updated_at timestamptz not null default now(),
  primary key (user_id, credit_date)
);

create table public.credit_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  credit_date date not null,
  amount smallint not null check (amount <> 0),
  transaction_type text not null check (
    transaction_type in ('analysis_deduction', 'failed_analysis_refund', 'manual_adjustment', 'promotional_credit')
  ),
  status text not null check (status in ('pending', 'completed', 'refunded')),
  idempotency_key text,
  analysis_id uuid references public.analyses(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index credit_transactions_user_idempotency_idx
  on public.credit_transactions (user_id, idempotency_key)
  where idempotency_key is not null;

create index credit_transactions_user_created_at_idx
  on public.credit_transactions (user_id, created_at desc);

alter table public.analyses enable row level security;
alter table public.daily_credit_balances enable row level security;
alter table public.credit_transactions enable row level security;

create policy "Users can read their own analyses"
  on public.analyses for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can delete their own analyses"
  on public.analyses for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own daily balance"
  on public.daily_credit_balances for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own credit ledger"
  on public.credit_transactions for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.analyses from anon;
revoke all on table public.daily_credit_balances from anon;
revoke all on table public.credit_transactions from anon;

grant select, delete on table public.analyses to authenticated;
grant select on table public.daily_credit_balances to authenticated;
grant select on table public.credit_transactions to authenticated;

create or replace function public.reserve_analysis_credit(p_idempotency_key text)
returns table (
  accepted boolean,
  reason text,
  reservation_id uuid,
  remaining smallint,
  existing_analysis_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_credit_date date := (timezone('Asia/Singapore', now()))::date;
  v_balance public.daily_credit_balances%rowtype;
  v_existing public.credit_transactions%rowtype;
  v_analysis_id uuid;
  v_reservation_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  if p_idempotency_key is null or char_length(p_idempotency_key) < 16 or char_length(p_idempotency_key) > 100 then
    raise exception 'Invalid idempotency key' using errcode = '22023';
  end if;

  insert into public.daily_credit_balances (user_id, credit_date)
  values (v_user_id, v_credit_date)
  on conflict (user_id, credit_date) do nothing;

  select * into v_balance
  from public.daily_credit_balances
  where user_id = v_user_id and credit_date = v_credit_date
  for update;

  select * into v_existing
  from public.credit_transactions
  where user_id = v_user_id and idempotency_key = p_idempotency_key
  limit 1;

  if found then
    select id into v_analysis_id
    from public.analyses
    where user_id = v_user_id and idempotency_key = p_idempotency_key
    limit 1;

    return query select false, 'duplicate', v_existing.id,
      (v_balance.daily_limit - v_balance.used_count)::smallint, v_analysis_id;
    return;
  end if;

  if v_balance.used_count >= v_balance.daily_limit then
    return query select false, 'no_credits', null::uuid, 0::smallint, null::uuid;
    return;
  end if;

  insert into public.credit_transactions (
    user_id, credit_date, amount, transaction_type, status, idempotency_key
  ) values (
    v_user_id, v_credit_date, -1, 'analysis_deduction', 'pending', p_idempotency_key
  ) returning id into v_reservation_id;

  update public.daily_credit_balances
  set used_count = used_count + 1, updated_at = now()
  where user_id = v_user_id and credit_date = v_credit_date
  returning * into v_balance;

  return query select true, 'accepted', v_reservation_id,
    (v_balance.daily_limit - v_balance.used_count)::smallint, null::uuid;
end;
$$;

create or replace function public.store_completed_analysis(
  p_reservation_id uuid,
  p_target_role text,
  p_company text,
  p_resume_filename text,
  p_overall_score smallint,
  p_score_label text,
  p_final_recommendation text,
  p_report jsonb,
  p_idempotency_key text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.credit_transactions%rowtype;
  v_analysis_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_transaction
  from public.credit_transactions
  where id = p_reservation_id and user_id = v_user_id
  for update;

  if not found
    or v_transaction.transaction_type <> 'analysis_deduction'
    or v_transaction.status <> 'pending'
    or v_transaction.idempotency_key <> p_idempotency_key then
    raise exception 'Valid pending credit reservation required' using errcode = '22023';
  end if;

  insert into public.analyses (
    user_id,
    target_role,
    company,
    resume_filename,
    overall_score,
    score_label,
    final_recommendation,
    report,
    idempotency_key
  ) values (
    v_user_id,
    p_target_role,
    nullif(p_company, ''),
    nullif(p_resume_filename, ''),
    p_overall_score,
    p_score_label,
    p_final_recommendation,
    p_report,
    p_idempotency_key
  ) returning id into v_analysis_id;

  update public.credit_transactions
  set status = 'completed', analysis_id = v_analysis_id
  where id = p_reservation_id
    and user_id = v_user_id;

  return v_analysis_id;
end;
$$;

create or replace function public.refund_analysis_credit(p_reservation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_transaction public.credit_transactions%rowtype;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '28000';
  end if;

  select * into v_transaction
  from public.credit_transactions
  where id = p_reservation_id and user_id = v_user_id
  for update;

  if not found or v_transaction.transaction_type <> 'analysis_deduction' or v_transaction.status <> 'pending' then
    return false;
  end if;

  update public.daily_credit_balances
  set used_count = greatest(used_count - 1, 0), updated_at = now()
  where user_id = v_user_id and credit_date = v_transaction.credit_date;

  update public.credit_transactions set status = 'refunded' where id = p_reservation_id;

  insert into public.credit_transactions (
    user_id, credit_date, amount, transaction_type, status, idempotency_key
  ) values (
    v_user_id, v_transaction.credit_date, 1, 'failed_analysis_refund', 'completed',
    'refund:' || p_reservation_id::text
  );

  return true;
end;
$$;

revoke all on function public.reserve_analysis_credit(text) from public, anon;
revoke all on function public.store_completed_analysis(uuid, text, text, text, smallint, text, text, jsonb, text) from public, anon;
revoke all on function public.refund_analysis_credit(uuid) from public, anon;

grant execute on function public.reserve_analysis_credit(text) to authenticated;
grant execute on function public.store_completed_analysis(uuid, text, text, text, smallint, text, text, jsonb, text) to authenticated;
grant execute on function public.refund_analysis_credit(uuid) to authenticated;
