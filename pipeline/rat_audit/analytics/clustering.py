"""One deterministic PostGIS definition of sites for every analytics consumer.

A cluster can span more than 50 m (DBSCAN density connectivity, not a radius).
Noise is excluded. Bulk loads count once before clustering; source IDs remain
available for the inspector. No writes are performed by this module.
"""
from __future__ import annotations

from collections import defaultdict

from .common import public_note as scrub_note
from .common import Report

# ORDER BY makes border-point assignment reproducible. The earliest retained
# report anchors identity; merges or historical backfills can change membership.
CLUSTER_CTES = r"""
eligible as (
  select i.*, coalesce(address_key, id) as dedupe_key,
    (opened_at at time zone 'America/New_York')::date as open_day
  from incidents i
  where city = 'boston' and category = 'rodent'
    and opened_at >= timestamptz '2024-01-01 00:00:00 America/New_York'
    and opened_at < timestamptz '2027-01-01 00:00:00 America/New_York'
    and geom is not null and not st_isempty(geom::geometry)
    and coalesce(action_tag, '') <> 'duplicate'
), numbered as (
  select e.*, count(*) over (partition by dedupe_key, open_day) as day_count,
    row_number() over (partition by dedupe_key, open_day order by id) as day_pos,
    row_number() over (partition by dedupe_key, opened_at order by id) as stamp_pos,
    first_value(id) over (partition by dedupe_key, open_day order by id) as day_id,
    first_value(id) over (partition by dedupe_key, opened_at order by id) as stamp_id
  from eligible e
), retained as (
  select * from numbered where (day_count >= 5 and day_pos = 1)
    or (day_count < 5 and stamp_pos = 1)
), clustered as (
  select r.*, st_clusterdbscan(st_transform(geom::geometry, 26986),
    eps := 50, minpoints := 3) over (order by id) as cluster_no
  from retained r
), anchored as (
  select c.*, 'site_' || md5(first_value(id) over (
    partition by cluster_no order by opened_at, id)) as cluster_id
  from clustered c where cluster_no is not null
), membership as (
  select a.id, array_agg(n.id order by n.id) as member_ids
  from anchored a join numbered n on a.id =
    case when n.day_count >= 5 then n.day_id else n.stamp_id end
  group by a.id
)
"""
CLUSTER_SQL = "with " + CLUSTER_CTES + """
select a.id, a.dedupe_key, a.opened_at, case when a.status='closed' then a.closed_at end, a.action_tag, a.source_id,
  a.cluster_id, coalesce(to_jsonb(a)->>'cause_tag', 'none'), a.closure_note,
  a.neighborhood, a.address_block, a.zip, st_y(a.geom::geometry), st_x(a.geom::geometry),
  m.member_ids
from anchored a join membership m on m.id = a.id order by a.opened_at, a.id
"""


def load(conn, *, classify_in_memory=False):
    """Optional read-only audit: classify original public notes before dedup/clustering."""
    sql, params = CLUSTER_SQL, None
    if classify_in_memory:
        from .classify import classify, classify_cause
        from .common import jsonb
        raw = conn.execute("select id,closure_note,status from incidents where city='boston' and category='rodent'").fetchall()
        labels = [{'id': i, 'tag': classify(note)[0] if status == 'closed' else None,
                   'cause': classify_cause(note) if status == 'closed' else 'none'} for i, note, status in raw]
        # Override only in a SELECT relation; never persist to the source table.
        sql = sql.replace('from incidents i', 'from audit_incidents i', 1)
        sql = sql.replace("coalesce(action_tag, '') <> 'duplicate'", "coalesce(audit_tag, '') <> 'duplicate'")
        sql = sql.replace('a.action_tag, a.source_id', 'a.audit_tag, a.source_id')
        sql = sql.replace("coalesce(to_jsonb(a)->>'cause_tag', 'none')", "a.audit_cause")
        sql = "with labels as (select * from jsonb_to_recordset(%s::jsonb) as l(id text,tag text,cause text)), " + \
              "audit_incidents as (select i.*,l.tag as audit_tag,l.cause as audit_cause from incidents i join labels l using(id)), " + sql.removeprefix('with ')
        params = (jsonb(labels),)
    rows = conn.execute(sql, params).fetchall()
    reports, meta = [], {}
    for row in rows:
        r = Report(*row[:8], scrub_note(row[8]), row[9])
        reports.append(r)
        meta[r.id] = {"address_block": row[10], "zip": row[11], "lat": row[12],
                      "lon": row[13], "member_ids": row[14]}
    return reports, meta


def group(reports):
    groups = defaultdict(list)
    for r in reports:
        if r.site_id is None:
            raise ValueError("50 m cluster membership is required; address grouping is not a site")
        groups[r.site_id].append(r)
    return {k: sorted(v, key=lambda r: (r.opened_at, r.id)) for k, v in sorted(groups.items())}
