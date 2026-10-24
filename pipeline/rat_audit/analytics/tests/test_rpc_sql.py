"""SQL integration using SELECT-only fixtures; opt in with ANALYTICS_READONLY_DB_URL.

Never applies migrations, creates tables, or calls a writing RPC. This is separate
from test_integration_db.py, whose disposable-schema test requires migration approval.
"""
import os
from pathlib import Path

import psycopg
import pytest

MIGRATIONS=Path(__file__).resolve().parents[4]/'supabase'/'migrations'


@pytest.fixture
def ro():
    url=os.environ.get('ANALYTICS_READONLY_DB_URL')
    if not url:
        pytest.skip('Set ANALYTICS_READONLY_DB_URL for SELECT-only PostGIS/SQL checks')
    with psycopg.connect(url,options='-c default_transaction_read_only=on -c statement_timeout=30000') as conn:
        assert conn.execute('show transaction_read_only').fetchone()[0]=='on'
        yield conn
        conn.rollback()


def insights_body():
    return next(MIGRATIONS.glob('*_analytics_insights_rpc.sql')).read_text().split('as $$',1)[1].split('$$;',1)[0].strip().rstrip(';')


def test_insights_empty_shape(ro):
    sql=insights_body()
    for table in ('model_runs','predictions','correlations','price_impact','sources','grid_cells'):
        sql=sql.replace('public.'+table,table+'_fx')
    fixtures=', '.join(f'{t}_fx as (select * from public.{t} where false)' for t in
                       ('model_runs','predictions','correlations','price_impact','sources','grid_cells'))
    result=ro.execute('with '+fixtures+', '+sql.removeprefix('with ')).fetchone()[0]
    assert result=={'correlations':[],'price_impact':[],'sources':[],'forecast':None}


def test_insights_model_selection_future_aggregation_and_top_five(ro):
    sql=insights_body().replace('now()',"timestamptz '2026-10-24 16:00:00+00'")
    for table in ('model_runs','predictions','correlations','price_impact','sources','grid_cells'):
        sql=sql.replace('public.'+table,table+'_fx')
    fixtures="""
    model_runs_fx(id,model,created_at) as (values
      ('gbm-old','cell_week_poisson_gbm',timestamptz '2026-10-20'),
      ('gbm','cell_week_poisson_gbm',timestamptz '2026-10-21'),
      ('baseline','cell_week_baseline_mean4',timestamptz '2026-10-24'),
      ('recurrence','site_recurrence_logit',timestamptz '2026-10-24')),
    predictions_fx(cell_id,model_run_id,week_start,actual,expected,p_any,risk_band,drivers) as (
      select 'c'||i::text,'gbm',date '2026-10-26',null::int,i::float8,.8,'high','[]'::jsonb from generate_series(1,6) i
      union all values ('past','gbm',date '2026-10-12',null,999,.9,'very_high','[]'::jsonb),
      ('actual','gbm',date '2026-10-26',1,999,.9,'very_high','[]'::jsonb),
      ('base','baseline',date '2026-10-26',null,999,.9,'very_high','[]'::jsonb)),
    grid_cells_fx(id,neighborhood) as (select 'c'||i::text,'Fixture' from generate_series(1,6) i),
    correlations_fx as (select * from public.correlations where false),
    price_impact_fx as (select * from public.price_impact where false),
    sources_fx as (select * from public.sources where false)
    """
    result=ro.execute('with '+fixtures+', '+sql.removeprefix('with ')).fetchone()[0]['forecast']
    assert result['run']['id']=='gbm'
    assert result['weeks']==[{'week_start':'2026-10-26','expected_total':21,'cells':6,
                              'bands':{'low':0,'elevated':0,'high':6,'very_high':0}}]
    assert [c['cell_id'] for c in result['top_cells']]==['c6','c5','c4','c3','c2']


def test_postgis_cluster_bulk_collapse_and_noise(ro):
    from rat_audit.analytics.clustering import CLUSTER_CTES
    fixtures="""
    incidents(id,address_key,opened_at,closed_at,action_tag,city,category,geom) as (
      select 'a'||i::text,'key'||i::text,timestamptz '2025-01-01'+i*interval '1 day',
        timestamptz '2025-01-02'+i*interval '1 day','monitoring','boston','rodent',
        st_transform(st_setsrid(st_makepoint(230000+i*20,900000),26986),4326)::geography
      from generate_series(0,2) i
      union all
      select 'bulk'||i,'bulk',timestamptz '2025-02-01 12:00:00+00'+i*interval '1 hour',null,null,'boston','rodent',
        st_transform(st_setsrid(st_makepoint(240000,900000),26986),4326)::geography from generate_series(1,5) i
      union all
      select 'far','far',timestamptz '2025-03-01',null,null,'boston','rodent',
        st_transform(st_setsrid(st_makepoint(250000,900000),26986),4326)::geography
    )
    """
    result=ro.execute('with '+fixtures+', '+CLUSTER_CTES+" select array_agg(id order by id),count(distinct cluster_id) from anchored").fetchone()
    assert result==(['a0','a1','a2'],1)
    retained=ro.execute('with '+fixtures+', '+CLUSTER_CTES+' select count(*) from retained').fetchone()[0]
    assert retained==5  # three cluster reports + one collapsed bulk point + one noise point


def v2_body(name):
    import re
    sql=next(MIGRATIONS.glob('*_analytics_v2_loop.sql')).read_text()
    match=re.search(r'create (?:or replace )?function public\.'+name+r'\(.*?as \$\$(.*?)\$\$;',sql,re.S)
    return match.group(1).strip().rstrip(';')


def test_case_projection_and_wilson_execute_without_installing_functions(ro):
    body=v2_body('analytics_site_case')
    # SET LOCAL only affects this read-only test transaction, mirroring the function setting.
    ro.execute("set local search_path = ''")
    row=ro.execute(body+' from public.sites s limit 1').fetchone()
    if row:
        assert 'score' not in row[0] and 'geom' not in row[0] and 'due' in row[0]
    interval=ro.execute(v2_body('analytics_wilson')+' from (values (3,10)) a(k,n)').fetchone()[0]
    assert interval['n']==10 and interval['rate']==.3 and interval['ci_low']<.3<interval['ci_high']
    # Insights must also resolve all relation names with an empty search path.
    assert isinstance(ro.execute(insights_body()).fetchone()[0],dict)


def test_trial_pair_select_matches_python_seeded_design(ro):
    import json
    from rat_audit.analytics.trials import design
    from .test_trials import candidates
    c=candidates(30)
    fixture=[{'id':s['id'],'rank':i+1,'city':'boston','neighborhood':s['neighborhood'],'lat':42.,'lon':-71.,
              'summary':{**s,'definition':'dbscan_50m_min3_v2','incident_ids':[],'address_keys':[],'source_ids':[]}}
             for i,s in enumerate(c)]
    sql=v2_body('design_trial').split('with candidates as (',1)[1].split('into chosen from selected;',1)[0]
    sql='with candidates as ('+sql+' from selected'
    sql=sql.replace('seed::text','42::text').replace('limit n','limit 6').replace('public.analytics_site_case(s)','s.summary')
    sql=sql.replace('public.sites','site_fx').replace('public.trial_pairs','pair_fx').replace('public.trials','trial_fx')
    fixtures="""site_fx as (select * from jsonb_to_recordset(%s::jsonb)
      as x(id text,rank int,city text,neighborhood text,lat float8,lon float8,summary jsonb)),
      pair_fx(trial_id,treatment_site,comparison_site) as (select null::uuid,null::text,null::text where false),
      trial_fx(id,created_at) as (select null::uuid,null::timestamptz where false)"""
    pairs=ro.execute('with '+fixtures+', '+sql.removeprefix('with ').replace('%', '%%'),(json.dumps(fixture),)).fetchone()[0]
    sql_pairs=[{k:v for k,v in p.items() if k!='snapshot'} for p in pairs]
    assert sql_pairs==design(c,6,'sealed_containers',42)['pairs']
