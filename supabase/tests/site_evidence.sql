-- Run only against an isolated test database after core_schema, data_update_mode,
-- site_evidence_provenance, and api_site_queue_draft. Rolls back all fixtures.
begin;
set timezone = 'UTC';
insert into sources(id,name,url,retrieved_at,update_mode) values
  ('test-cambridge','Cambridge test reports','https://example.org/cambridge','2026-10-24T10:00:00Z','daily'),
  ('test-somerville','Somerville test context','https://example.org/somerville','2026-10-20T10:00:00Z','live'),
  ('test-vacant','Vacant parcel test snapshot','https://example.org/vacant','2025-01-01T10:00:00Z','static');
insert into ingest_runs(source_id,finished_at,ok) values
  ('test-cambridge','2026-10-24T08:00:00Z',true),
  ('test-cambridge','2026-10-24T09:00:00Z',false),
  ('test-somerville',null,true);

insert into incidents(id,source_id,category,status,address_key,opened_at,closed_at,lat,lon,geom) values
  ('test-base','test-cambridge','rodent','closed','0123456789abcdef-test','2026-01-01T12:00:00Z','2026-01-02T12:00:00Z',42,-71,st_point(-71,42)::geography),
  ('test-exact-day','test-cambridge','rodent','open','0123456789abcdef-test','2026-01-03T12:00:00Z',null,42,-71,st_point(-71,42)::geography),
  ('test-after-day','test-cambridge','rodent','open','0123456789abcdef-test','2026-01-03T12:00:01Z',null,42,-71,st_point(-71,42)::geography),
  ('test-same-day','test-cambridge','rodent','open','0123456789abcdef-test','2026-01-03T12:00:02Z',null,42,-71,st_point(-71,42)::geography),
  ('test-exact-sixty','test-cambridge','rodent','open','0123456789abcdef-test','2026-03-03T12:00:00Z',null,42,-71,st_point(-71,42)::geography),
  ('test-after-sixty','test-cambridge','rodent','open','0123456789abcdef-test','2026-03-03T12:00:01Z',null,42,-71,st_point(-71,42)::geography);
insert into incidents(id,source_id,category,status,opened_at,geom) values
  ('test-near','test-somerville','dumping','open',now(),st_project(st_point(-71,42)::geography,99,0)),
  ('test-far','test-somerville','dumping','open',now(),st_project(st_point(-71,42)::geography,101,0)),
  ('test-old','test-somerville','dumping','open',now()-interval '13 months',st_point(-71,42)::geography);
insert into places(id,source_id,kind,geom) values
  ('test-vacant-near','test-vacant','vacant_parcel',st_project(st_point(-71,42)::geography,39,0)),
  ('test-vacant-far','test-vacant','vacant_parcel',st_project(st_point(-71,42)::geography,41,0));

set local role anon;
do $$
declare evidence jsonb; queue jsonb;
begin
  evidence := site_evidence('0123456789abcdef');
  select to_jsonb(s) into queue from draft_sites(1) s where id='0123456789abcdef';
  assert jsonb_array_length(evidence->'reports') = 6, 'Individual records were dropped';
  assert (queue->>'reports')::int = 3, 'Same-day records must count as one report day';
  assert (queue->>'returns')::int = 2, 'Return days must deduplicate records on the same date';
  assert (select count(*) from jsonb_array_elements(evidence->'reports') r where (r->>'after_closure')::boolean) = 3, 'Incorrect return-window boundary';
  assert not (select (r->>'after_closure')::boolean from jsonb_array_elements(evidence->'reports') r where r->>'id'='test-exact-day');
  assert (select (r->>'after_closure')::boolean from jsonb_array_elements(evidence->'reports') r where r->>'id'='test-exact-sixty');
  assert evidence->'report_source_ids' = '["test-cambridge"]'::jsonb, 'Wrong city source';
  assert evidence->'nearby' = '[{"category":"dumping","count":1,"source_ids":["test-somerville"]}]'::jsonb, 'Radius/time filter or source attribution is wrong';
  assert evidence->'vacant' = '{"count":1,"source_ids":["test-vacant"]}'::jsonb, 'Vacant parcel radius is wrong';
  assert jsonb_array_length(evidence->'sources')=3, 'Missing or unrelated sources';
  assert (select (s->>'last_success_at')::timestamptz from jsonb_array_elements(evidence->'sources') s where s->>'id'='test-cambridge') = '2026-10-24T08:00:00Z'::timestamptz, 'A failed run replaced the successful import time';
  assert (select s->>'last_success_at' from jsonb_array_elements(evidence->'sources') s where s->>'id'='test-somerville') is null, 'Unfinished import is not a successful import';
  assert site_evidence('not-a-place') is null, 'Missing place should return null';
end $$;
reset role;

-- SECURITY INVOKER must honor a narrower caller policy.
drop policy "public read" on incidents;
create policy test_filtered_read on incidents for select using (id <> 'test-near');
set local role anon;
do $$ begin
  assert site_evidence('0123456789abcdef')->'nearby' = '[]'::jsonb, 'RPC bypassed incident RLS';
end $$;
reset role;
rollback;
