-- Spec v2 analytics (2.0, 2.19–2.23). Generated with `supabase migration new analytics_v2_loop`;
-- ordered after legacy 20261024{30,50,60}... files, which use invalid clock hours.
-- This file is prepared only; applying it is the integrator's separate step.

alter table public.incidents add column if not exists cause_tag text;
alter table public.incidents add constraint incidents_cause_tag_valid check
  (cause_tag in ('trash','sewer','dumpster','debris','vegetation','construction','none')) not valid;
alter table public.decisions add column if not exists reject_reason text;
-- NOT VALID preserves historical rows while enforcing the rule on new writes.
alter table public.decisions add constraint decisions_reject_reason_required check
  (status <> 'rejected' or nullif(btrim(reject_reason), '') is not null) not valid;

create table public.base_rates (
  prior_returns_bucket text primary key check (prior_returns_bucket in ('0','1','2','3+')),
  n int not null check (n >= 0), returns int not null check (returns between 0 and n),
  rate double precision, ci_low double precision, ci_high double precision,
  due_threshold double precision not null default .50 check (due_threshold between 0 and 1),
  observed_through date not null, source_ids text[] not null default '{}',
  computed_at timestamptz not null default now(),
  check ((n = 0 and rate is null and ci_low is null and ci_high is null)
    or (n > 0 and rate between 0 and 1 and ci_low between 0 and rate and ci_high between rate and 1))
);
create table public.trials (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  intervention text not null check (intervention in ('sealed_containers','joint_block_visit','exclusion_inspection','bwsc_referral')),
  n int not null check (n between 1 and 100), seed int not null,
  measure text not null default 'returns within 60 days, treatment vs comparison',
  window_days int not null default 60 check (window_days = 60)
);
create table public.trial_pairs (
  trial_id uuid not null references public.trials(id), pair_no int not null check (pair_no > 0),
  treatment_site text not null references public.sites(id),
  comparison_site text not null references public.sites(id),
  match_keys jsonb not null, snapshot jsonb not null default '{}',
  primary key (trial_id,pair_no), unique(trial_id,treatment_site), unique(trial_id,comparison_site),
  check (treatment_site <> comparison_site)
);
create index trial_pairs_treatment_idx on public.trial_pairs(treatment_site);
create index trial_pairs_comparison_idx on public.trial_pairs(comparison_site);
create index incidents_rodent_time_idx on public.incidents(opened_at) where city='boston' and category='rodent';
create index decisions_followup_idx on public.decisions(follow_up_on) where status in ('approved','edited');

alter table public.base_rates enable row level security;
alter table public.trials enable row level security;
alter table public.trial_pairs enable row level security;
create policy "public read" on public.base_rates for select to anon,authenticated using (true);
create policy "public read" on public.trials for select to anon,authenticated using (true);
create policy "public read" on public.trial_pairs for select to anon,authenticated using (true);
-- Match the existing demo's decisions policy: design and store only, never send an action.
create policy "demo trial insert" on public.trials for insert to anon,authenticated with check
  (window_days=60 and measure='returns within 60 days, treatment vs comparison');
create policy "demo pair insert" on public.trial_pairs for insert to anon,authenticated with check
  (exists (select 1 from public.sites a, public.sites b
    where a.id=treatment_site and b.id=comparison_site
      and coalesce(a.neighborhood,'Unknown')=coalesce(b.neighborhood,'Unknown')
      and a.summary->>'prior_returns_bucket'=b.summary->>'prior_returns_bucket'));
grant select on public.base_rates,public.trials,public.trial_pairs to anon,authenticated;
grant insert on public.trials,public.trial_pairs to anon,authenticated;
grant all on public.base_rates,public.trials,public.trial_pairs to service_role;

-- Shared by the queue and case; dates are computed at read time so Due cannot remain stale.
create function public.analytics_site_case(s public.sites) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select (to_jsonb(s) - 'score' - 'geom') || s.summary || jsonb_build_object(
    'reports',s.report_count,'returns',s.recurrence_count,
    'closures',coalesce((s.summary->>'closures')::int,0),
    'last_closed',s.summary->>'last_closed_at',
    'days_since_close', (now() at time zone 'America/New_York')::date -
      ((s.summary->>'last_closed_at')::timestamptz at time zone 'America/New_York')::date,
    'due',coalesce((now() at time zone 'America/New_York')::date -
      ((s.summary->>'last_closed_at')::timestamptz at time zone 'America/New_York')::date between 0 and 60
      and (s.summary->'base_rate'->>'n')::int > 0
      and (s.summary->'base_rate'->>'rate')::float8 >= coalesce((s.summary->>'due_threshold')::float8,.50)
      and not coalesce((s.summary->>'retired')::boolean,false),false),
    'lat',round(s.lat::numeric,4),'lon',round(s.lon::numeric,4))
$$;

-- Retain the existing read-only endpoints during the schema/data transition and
-- for clients that still hold an old address-based site ID. Their original grants
-- and behavior are preserved; the new endpoints below remain invoker functions.
alter function public.site_queue(int,text) rename to analytics_legacy_site_queue;
alter function public.site_detail(text) rename to analytics_legacy_site_detail;

-- Same arguments/return type as Gui's draft, so existing callers keep working.
create or replace function public.site_queue(lim int default 50, hood text default null)
returns setof jsonb language sql stable security invoker set search_path = '' as $$
  with active as (
    select * from public.sites where city='boston' and rank is not null
      and summary->>'definition'='dbscan_50m_min3_v2'
  ), result as (
    select public.analytics_site_case(s) as value from public.sites s
    where s.id in (select id from active) and (hood is null or s.neighborhood=hood)
    union all
    select legacy.value || jsonb_build_object('definition','address_draft','analytics_status','awaiting_refresh')
    from public.analytics_legacy_site_queue(greatest(0,least(coalesce(lim,50),500)),hood) as legacy(value)
    where not exists(select 1 from active)
  )
  select value from result order by (value->>'due')::boolean desc,
    coalesce((value->>'returns_12mo')::int,(value->>'returns')::int,0) desc,
    (value->>'reports')::int desc,value->>'last_at' desc,value->>'id'
  limit greatest(0,least(coalesce(lim,50),500))
$$;

-- Keep the draft's response shape, add the full case and original member IDs.
create or replace function public.site_detail(site_id text) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select coalesce((select jsonb_build_object('site',public.analytics_site_case(s),
    'reports',coalesce((select jsonb_agg(x || jsonb_build_object(
      'opened',x->'opened_at','closed',x->'closed_at','action',x->'action_tag',
      'status',case when x->>'closed_at' is null then 'open' else 'closed' end,
      'note',(select n->'note' from jsonb_array_elements(coalesce(s.summary->'notes','[]')) n where n->>'id'=x->>'id' limit 1))
      order by x->>'opened_at',x->>'id') from jsonb_array_elements(coalesce(s.summary->'timeline','[]')) x),'[]'),
    'drivers_100m_12mo',coalesce((select jsonb_object_agg(d->>'category',d->'count')
      from jsonb_array_elements(coalesce(s.summary->'drivers','[]')) d where d->>'type'='incident'),'{}'),
    'adjacent_vacant_parcels',case when s.summary->'adjacent_vacant' <> 'null'::jsonb then 1 else 0 end,
    'source_ids',s.summary->'source_ids','recommended',s.recommended,
    'decisions',coalesce((select jsonb_agg(to_jsonb(d) order by d.created_at desc) from public.decisions d where d.site_id=s.id),'[]'))
  from public.sites s where s.id=site_id and s.summary->>'definition'='dbscan_50m_min3_v2'),
    public.analytics_legacy_site_detail(site_id) || jsonb_build_object('legacy',true))
$$;

create function public.base_rates() returns setof public.base_rates
language sql stable security invoker set search_path = '' as $$
  select * from public.base_rates order by prior_returns_bucket
$$;
create function public.practice_shift() returns setof jsonb
language sql stable security invoker set search_path = '' as $$
  with tagged as (
    select action_tag,extract(year from closed_at at time zone 'America/New_York')::int as year,count(*)::int as n
    from public.incidents where city='boston' and category='rodent' and status='closed'
      and closed_at >= '2025-01-01 00:00-05' and closed_at < '2027-01-01 00:00-05'
    group by 1,2)
  select jsonb_build_object('action_tag',t.action_tag,'year',t.year,'closures',t.n,
    'share',t.n::float8/sum(t.n) over(partition by t.year),
    'outcome',a.by_year->t.year::text,
    'source_ids',a.source_ids,'caveat','Actions are not assigned at random; differences are observational.')
  from tagged t left join public.action_outcomes a on a.action_tag=t.action_tag order by t.year,t.action_tag
$$;
create function public.enforcement_gaps() returns setof jsonb
language sql stable security invoker set search_path = '' as $$
  select public.analytics_site_case(s) from public.sites s
  where s.rank is not null and (public.analytics_site_case(s)->>'due')::boolean
    and coalesce((s.summary->>'trash_tickets_12mo')::int,0)=0
  order by coalesce((s.summary->>'returns_12mo')::int,0) desc,s.id
$$;
create function public.followups_due() returns setof jsonb
language sql stable security invoker set search_path = '' as $$
  select to_jsonb(d) || jsonb_build_object('site',public.analytics_site_case(s),
    'returns_since', (select count(*) from jsonb_array_elements(coalesce(s.summary->'timeline','[]')) r
       where (r->>'opened_at')::timestamptz > d.created_at and (r->>'recurred')::boolean),
    'caveat','Counts are as of the analytics refresh; retired clusters require manual review.')
  from public.decisions d join public.sites s on s.id=d.site_id
  where d.status in ('approved','edited') and d.follow_up_on <= (now() at time zone 'America/New_York')::date+7
  order by d.follow_up_on,d.id
$$;

create function public.design_trial(n int, intervention text, seed int) returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare trial_uuid uuid; chosen jsonb; pair_count int;
begin
  if n is null or n not between 1 and 100 or seed is null then
    raise exception 'n must be 1–100 pairs and seed must be provided';
  end if;
  if intervention is null or intervention not in ('sealed_containers','joint_block_visit','exclusion_inspection','bwsc_referral') then
    raise exception 'Unsupported intervention';
  end if;
  perform pg_advisory_xact_lock(hashtext('rat_audit_design_trial'));
  with candidates as (
    select s.id,coalesce(s.neighborhood,'Unknown') as hood,s.summary->>'prior_returns_bucket' as prior,
      coalesce((s.summary->>'trash_tickets_12mo')::int,0) as tickets,
      jsonb_build_object('incident_ids',s.summary->'incident_ids','address_keys',s.summary->'address_keys',
                        'lat',s.lat,'lon',s.lon,'source_ids',s.summary->'source_ids') as snapshot
    from public.sites s where s.rank is not null and s.summary->>'definition'='dbscan_50m_min3_v2'
      and (public.analytics_site_case(s)->>'due')::boolean
      and not exists (select 1 from public.trial_pairs p join public.trials t on t.id=p.trial_id
        where (p.treatment_site=s.id or p.comparison_site=s.id) and t.created_at+interval '60 days'>now())
  ), cuts as (
    select percentile_disc(1.0/3) within group(order by tickets) as a,
           percentile_disc(2.0/3) within group(order by tickets) as b from candidates
  ), strata as (
    select c.*,1+(tickets>a)::int+(tickets>b)::int as tercile from candidates c cross join cuts
  ), numbered as (
    select s.*,row_number() over(partition by hood,prior,tercile order by md5(seed::text||':'||id),id) as rn from strata s
  ), pairs as (
    select a.id as a,b.id as b,a.snapshot as sa,b.snapshot as sb,a.hood,a.prior,a.tercile,
      a.id||':'||b.id as pair_key
    from numbered a join numbered b on a.hood=b.hood and a.prior=b.prior and a.tercile=b.tercile and b.rn=a.rn+1
    where a.rn%2=1
  ), selected as (
    select *,get_byte(decode(substr(md5(seed::text||':arm:'||pair_key),1,2),'hex'),0)/16%2=1 as flip
    from pairs order by md5(seed::text||':pair:'||pair_key),a,b limit n
  )
  select jsonb_agg(jsonb_build_object(
    'treatment_site',case when flip then b else a end,'comparison_site',case when flip then a else b end,
    'match_keys',jsonb_build_object('neighborhood',hood,'prior_returns_bucket',prior,'trash_ticket_tercile',tercile),
    'snapshot',jsonb_build_object('treatment',case when flip then sb else sa end,'comparison',case when flip then sa else sb end)))
  into chosen from selected;
  pair_count := coalesce(jsonb_array_length(chosen),0);
  if pair_count < n then raise exception 'Only % matched pairs available; requested %',pair_count,n; end if;
  insert into public.trials(intervention,n,seed) values(design_trial.intervention,design_trial.n,design_trial.seed) returning id into trial_uuid;
  insert into public.trial_pairs(trial_id,pair_no,treatment_site,comparison_site,match_keys,snapshot)
    select trial_uuid,ordinality::int,p->>'treatment_site',p->>'comparison_site',p->'match_keys',p->'snapshot'
    from jsonb_array_elements(chosen) with ordinality as x(p,ordinality);
  return jsonb_build_object('trial',(select to_jsonb(t) from public.trials t where t.id=trial_uuid),
    'pairs',(select jsonb_agg(to_jsonb(p) order by pair_no) from public.trial_pairs p where p.trial_id=trial_uuid));
end $$;

-- Wilson interval in fractions, used for each trial arm.
create function public.analytics_wilson(k int,n int) returns jsonb
language sql immutable security invoker set search_path = '' as $$
  select case when n=0 then jsonb_build_object('n',0,'returns',k,'rate',null,'ci_low',null,'ci_high',null)
    else jsonb_build_object('n',n,'returns',k,'rate',k::float8/n,
      'ci_low',case when k=0 then 0 else greatest(0,(k::float8/n+3.8416/(2*n)-1.96*sqrt(k::float8/n*(1-k::float8/n)/n+3.8416/(4*n::float8*n)))/(1+3.8416/n)) end,
      'ci_high',case when k=n then 1 else least(1,(k::float8/n+3.8416/(2*n)+1.96*sqrt(k::float8/n*(1-k::float8/n)/n+3.8416/(4*n::float8*n)))/(1+3.8416/n)) end) end
$$;
create function public.trial_result(id uuid) returns jsonb
language sql stable security invoker set search_path = '' as $$
  with t as (select * from public.trials where trials.id=trial_result.id),
  arms as (
    select 'treatment' as arm,p.snapshot->'treatment' as snapshot from public.trial_pairs p,t where p.trial_id=t.id
    union all
    select 'comparison',p.snapshot->'comparison' from public.trial_pairs p,t where p.trial_id=t.id
  ), observed as (
    select max((opened_at at time zone 'America/New_York')::date) as through from public.incidents
    where city='boston' and category='rodent'
  ), outcomes as (
    select a.arm,exists(select 1 from public.incidents i,t where i.city='boston' and i.category='rodent'
      and (i.opened_at at time zone 'America/New_York')::date - (t.created_at at time zone 'America/New_York')::date between 1 and 60
      and coalesce(i.action_tag,'') <> 'duplicate'
      and exists (select 1 from public.incidents anchor where a.snapshot->'incident_ids' ? anchor.id
        and public.st_dwithin(i.geom,anchor.geom,50))) as returned
    from arms a
  ), counts as (select arm,count(*)::int as n,count(*) filter(where returned)::int as k from outcomes group by arm)
  select jsonb_build_object('id',t.id,'measure',t.measure,'observed_through',observed.through,
    'status',case when now() >= t.created_at+interval '60 days' and observed.through >=
      (t.created_at at time zone 'America/New_York')::date+60 then 'complete' else 'pending' end,
    'arms',case when now() >= t.created_at+interval '60 days' and observed.through >=
      (t.created_at at time zone 'America/New_York')::date+60
      then (select jsonb_object_agg(arm,public.analytics_wilson(k,n)) from counts) else null end,
    'caveat','At least one report within 50 m of any frozen cluster member, days 1–60. Verify field implementation and adherence; the system does not carry out interventions.')
  from t cross join observed
$$;

revoke all on function public.analytics_site_case(public.sites),public.analytics_wilson(int,int),
  public.site_queue(int,text),public.site_detail(text),public.base_rates(),public.practice_shift(),
  public.enforcement_gaps(),public.followups_due(),public.design_trial(int,text,int),public.trial_result(uuid) from public;
grant execute on function public.analytics_site_case(public.sites),public.analytics_wilson(int,int),
  public.site_queue(int,text),public.site_detail(text),public.base_rates(),public.practice_shift(),
  public.enforcement_gaps(),public.followups_due(),public.design_trial(int,text,int),public.trial_result(uuid)
  to anon,authenticated,service_role;
