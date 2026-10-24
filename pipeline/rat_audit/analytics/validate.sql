-- Post-run checks for analytics core. Read-only: every statement is a SELECT.
-- Run after applying 20261024600001_analytics_core.sql and `python -m rat_audit.analytics`:
--   psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f pipeline/rat_audit/analytics/validate.sql
-- Each row is one check: check | ok | detail. Every `ok` should be true.

begin transaction read only;

-- 0. Migration applied
select 'migration: analytics_runs table' as check, to_regclass('public.analytics_runs') is not null as ok, '' as detail
union all
select 'migration: grid_cells + action_outcomes columns',
       count(*) = 12, count(*) || ' of 12 columns present'
from information_schema.columns
where table_schema = 'public'
  and ((table_name = 'grid_cells' and column_name in ('col', 'row', 'land_frac', 'boundary_source'))
    or (table_name = 'action_outcomes' and column_name in ('n_recurred', 'n_censored', 'window_days',
        'observed_through', 'ci_low', 'ci_high', 'by_year', 'source_ids')));

-- 1. Last run
select 'run: last analytics_runs row ok' as check, coalesce(bool_and(ok), false) as ok,
       coalesce(max(steps::text), 'no run recorded') as detail
from (select ok, steps from analytics_runs order by id desc limit 1) r;

-- 2. Grid (2.1)
select 'grid: cells exist, Boston boundary' as check,
       count(*) > 2000 and bool_and(boundary_source = 'climate-ready-boston-svi') as ok,
       count(*) || ' cells' as detail
from grid_cells where city = 'boston'
union all
select 'grid: ids follow g250_<col>_<row>', bool_and(id = 'g250_' || col || '_' || row), count(*) || ' checked'
from grid_cells where city = 'boston'
union all
select 'grid: land_frac in (0, 1]', bool_and(land_frac > 0 and land_frac <= 1), min(land_frac) || ' .. ' || max(land_frac)
from grid_cells where city = 'boston';

-- 3. Classifier (2.2): target >= 90% tagged per year (expected to FAIL until ingest keeps the closure prefix)
select 'classify: ' || y || ' tagged >= 90%' as check, share >= 0.90 as ok,
       round(100 * share, 2) || '% of ' || n || ' closed cases' as detail
from (select extract(year from opened_at at time zone 'America/New_York')::int y, count(*) n,
             avg((action_tag is not null and action_tag <> 'unknown')::int) share
      from incidents where city = 'boston' and category = 'rodent' and status = 'closed'
      group by 1) t
where y >= 2023
union all
select 'classify: open cases untagged', count(*) = 0, count(*) || ' open cases with a tag'
from incidents where city = 'boston' and category = 'rodent' and status = 'open' and action_tag is not null
union all
select 'classify: tags are contract actions',
       bool_and(action_tag in ('monitoring', 'inspection', 'baiting', 'warning', 'citation', 'abatement_order',
                               'collections', 'referral', 'cleanup', 'barrels', 'no_violation', 'duplicate',
                               'closed_no_action', 'unknown')), string_agg(distinct action_tag, ', ')
from incidents where action_tag is not null;

-- 4. Outcomes (2.4)
select 'outcomes: rows with n > 0 and 60-day window' as check,
       count(*) > 0 and bool_and(n > 0 and window_days = 60 and recur_60d_pct between 0 and 100) as ok,
       count(*) || ' tags, observed through ' || max(observed_through) as detail
from action_outcomes
union all
select 'outcomes: CI contains the rate', bool_and(ci_low <= recur_60d_pct and recur_60d_pct <= ci_high), ''
from action_outcomes;

-- 5. Sites (2.3)
select 'sites: score in 0-100' as check, count(*) > 0 and bool_and(score between 0 and 100) as ok,
       count(*) || ' sites, ' || min(score) || ' .. ' || max(score) as detail
from sites
union all
select 'sites: recurrences <= reports - 1', bool_and(recurrence_count <= report_count - 1), ''
from sites
union all
select 'sites: ranks unique and contiguous', count(rank) = max(rank) and count(distinct rank) = count(rank),
       count(rank) || ' ranked'
from sites
union all
select 'sites: every site has a recommendation', bool_and(jsonb_array_length(recommended) > 0), ''
from sites where rank is not null
union all
select 'sites: no house number in address_block', bool_and(address_block !~ '^\s*\d'), ''
from sites
union all
select 'sites: Normandy St, 02121 rank (info)', true, coalesce(min(rank)::text, 'not a site')
from sites where address_block ilike 'Normandy St, 02121%';

-- 6. Findings (2.5) and costs (2.7)
select 'correlations: 3 findings present' as check,
       count(*) filter (where id in ('trash-storage-vs-rodent', 'what-worked', 'move-out-spike')) = 3 as ok,
       string_agg(id || '=' || strength, ', ') as detail
from correlations
union all
select 'price_impact: counted cost rows', count(*) filter (where id like 'cost-%') >= 1,
       string_agg(id, ', ')
from price_impact
union all
select 'price_impact: no visit or dollar conversion of cases',
       coalesce(bool_and(value->>'units' like 'cases%'), false), ''
from price_impact where id = 'cost-repeat-cases-chronic-sites';

-- 7. Every cited source exists
select 'sources: every cited source_id resolves' as check, count(*) = 0 as ok,
       coalesce(string_agg(distinct s, ', '), '') as detail
from (select unnest(source_ids) s from correlations
      union all select unnest(source_ids) from price_impact
      union all select unnest(source_ids) from action_outcomes
      union all select jsonb_array_elements_text(summary->'source_ids') from sites) x
where s not in (select id from sources);

commit;
