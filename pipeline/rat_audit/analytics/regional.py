"""Task 2.14: report rates and operational context for the three reporting systems."""
from collections import defaultdict

from .common import MissingInput
from .correlations import _upsert
from .impact import three_city_rates


def finding(conn):
    populations={}
    sources=set()
    for city,pop,vintage,src in conn.execute("""select city,sum((attrs->>'pop')::numeric),
      min((attrs->>'tract_vintage')::int),array_agg(distinct source_id) from tracts
      where city in ('boston','cambridge','somerville') and (attrs->>'pop')::numeric>0 group by city""").fetchall():
        populations[city]={'population':float(pop),'vintage':vintage}
        sources.update(src)
    missing=sorted({'boston','cambridge','somerville'}-populations.keys())
    if missing: raise MissingInput({'table':'tracts','cities':missing,'need':'population denominators'})
    monthly=conn.execute("""select city,date_trunc('month',opened_at at time zone 'America/New_York')::date,
      count(*)::int,case when category='rodent_program' then category else subtype end,array_agg(distinct source_id) from incidents
      where category in ('rodent','rodent_program') and opened_at>='2023-01-01' and city in ('boston','cambridge','somerville') group by 1,2,4""").fetchall()
    if not monthly: raise MissingInput({'table':'incidents','need':'regional rodent reports'})
    sources.update(s for r in monthly for s in r[4])
    rates=three_city_rates([r[:4] for r in monthly],populations)
    if not rates: raise MissingInput({'table':'incidents','need':'regional counts with population denominators'})
    missing_inputs = ['ACS population denominators: loaded populations have 2010/2020 census vintages']
    missing_inputs += [f'No report months for {city}' for city in populations if not any(r['city']==city for r in rates)]
    # First nonzero catch month is a proxy, never an installation date. Equal 90-day windows.
    boxes=conn.execute("""with b as (
      select p.id,p.geom,p.source_id,p.attrs,(min(x.key)||'-01')::date as first_catch
      from places p cross join lateral jsonb_each_text(p.attrs->'monthly_catches') x
      where p.city='cambridge' and p.kind='smart_box' and x.value::int>0
      group by p.id), obs as (
      select max(opened_at) as through from incidents where city='cambridge' and category='rodent')
      select b.id,b.source_id,b.attrs->'monthly_catches',b.first_catch,
        count(*) filter(where i.opened_at<b.first_catch and st_dwithin(i.geom,b.geom,200))::int as near_before,
        count(*) filter(where i.opened_at>=b.first_catch and st_dwithin(i.geom,b.geom,200))::int as near_after,
        count(*) filter(where i.opened_at<b.first_catch and not st_dwithin(i.geom,b.geom,200))::int as other_before,
        count(*) filter(where i.opened_at>=b.first_catch and not st_dwithin(i.geom,b.geom,200))::int as other_after
      from b cross join obs join incidents i on i.city='cambridge' and i.category='rodent'
        and i.opened_at >= b.first_catch-interval '90 days' and i.opened_at < b.first_catch+interval '90 days'
      where obs.through >= b.first_catch+interval '90 days' and b.geom is not null
      group by b.id,b.source_id,b.attrs,b.first_catch""").fetchall()
    sources.update(r[1] for r in boxes)
    catches=defaultdict(int)
    for r in boxes:
        for month,n in (r[2] or {}).items(): catches[month]+=int(n)
    return {'id':'three-city-comparison','title':'Reported rodent activity across Boston, Cambridge and Somerville',
      'question':'How do reporting rates and city programs differ?',
      'method':'Monthly reports per 1,000 residents from loaded census tracts; Somerville program requests shown separately. Cambridge box comparison uses 90 days before/after the first nonzero catch month within 200 m vs other city sightings.',
      'unit':'city-month','stat':{'monthly':rates,'population':populations,'smart_boxes':[
        dict(zip(('id','source_id','monthly_catches','first_nonzero_month','near_before','near_after','other_before','other_after'),r)) for r in boxes],
        'catch_totals':dict(sorted(catches.items())),'descriptive_only':True,
        'missing_inputs':missing_inputs + ([] if boxes else ['No boxes with a first nonzero month and complete 90-day follow-up'])},
      'strength':'none','chart':{'type':'line','x_label':'Month','y_label':'Reports per 1,000 residents',
        'series':[{'name':city.title(),'points':[[r['month'],r['per_1000_residents']] for r in rates if r['city']==city]} for city in populations]},
      'caveat':'Three different reporting systems, geographic precision and population vintages; rates are not a ranking of infestation. Loaded Boston SVI population is 2010 vintage, regional TIGER population is 2020, not current ACS. First nonzero catch is not installation; blank months are missing, not zero. Nearby boxes overlap, so their before/after counts must not be summed as unique incidents.',
      'group_name':'reports','source_ids':sorted(sources),'sort':90}


def run(conn):
    row=finding(conn)
    _upsert(conn,row);conn.commit()
    return {'rows':1,'missing_inputs':row['stat']['missing_inputs']}
