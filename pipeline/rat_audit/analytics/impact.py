"""P1 analytics outputs: matched prices, schools, building context and regional comparison.

All computations read the loaded source tables. Missing denominators or comparison
samples are reported, never replaced with an invented effect.
"""
from __future__ import annotations

import hashlib
import statistics
from collections import defaultdict

import numpy as np

from .common import MissingInput, r2, spearman
from .correlations import _upsert as save_finding
from .costs import _upsert as save_impact

CAVEAT = ('Exploratory association; location, housing mix, reporting and many other factors confound it. '
          'This is not an estimate of damage caused by rodents or a forecast of property prices.')


def matched_assessment(rows, seed=20261024):
    """Rows: pid, ZIP, land use, year built, FY25, FY26, near-hotspot, source ID."""
    strata=defaultdict(lambda:[[],[]])
    for pid,zip_,land,year,v25,v26,near,_ in rows:
        if not zip_ or not land or not year or v25 is None or v26 is None or v25<=0:
            continue
        strata[(zip_,land,int(year)//10)][int(not near)].append((pid,100*(float(v26)/float(v25)-1)))
    pairs=[]
    for key,arms in sorted(strata.items()):
        arms=[sorted(a,key=lambda r:hashlib.sha256(f'{seed}:{r[0]}'.encode()).digest()) for a in arms]
        pairs.extend((a[1],b[1]) for a,b in zip(*arms))
    if len(pairs)<2:
        return {'insufficient':True,'n':len(pairs),'match_keys':['ZIP','land use','year-built decade']}
    a,b=np.array(pairs).T
    rng=np.random.default_rng(seed)
    boot=[]
    for _ in range(999):
        ix=rng.integers(0,len(a),len(a));boot.append(float(np.median(a[ix])-np.median(b[ix])))
    return {'n':len(pairs),'near_median_pct':float(np.median(a)), 'comparison_median_pct':float(np.median(b)),
            'diff_pct':float(np.median(a)-np.median(b)),'ci':[float(v) for v in np.quantile(boot,[.025,.975])],
            'match_keys':['ZIP','land use','year-built decade'],'seed':seed}


def listing_comparison(rows):
    arms={True:[],False:[]}
    for price,reviews,rat_reviews,near,*_ in rows:
        arms[bool(near)].append((float(price) if price is not None else None,int(reviews or 0),int(rat_reviews or 0)))
    result={}
    for near,name in [(True,'near'),(False,'elsewhere')]:
        a=arms[near]; prices=[r[0] for r in a if r[0] is not None and r[0]>=0]
        reviews=sum(r[1] for r in a)
        result[name]={'n':len(a),'median_price_usd':statistics.median(prices) if prices else None,
                      'review_count':reviews,'rat_mention_share':sum(r[2] for r in a)/reviews if reviews else None}
    result['insufficient']=any(not a for a in arms.values())
    return result


def three_city_rates(monthly,populations):
    """Monthly rows: city, month ISO string, count, subtype; populations include source provenance."""
    totals=defaultdict(int); program=defaultdict(int)
    for city,month,n,subtype in monthly:
        if city=='somerville' and 'program' in (subtype or '').lower():
            program[(city,str(month))]+=n
        else:
            totals[(city,str(month))]+=n
    rows=[]
    for city,month in sorted(totals.keys() | program.keys()):
        n=totals[(city,month)]
        pop=populations.get(city,{}).get('population')
        if not pop or pop<=0:
            continue
        rows.append({'city':city,'month':month,'reports':n,'per_1000_residents':1000*n/pop,
                     'program_requests':program[(city,month)],'population':pop,
                     'population_vintage':populations[city].get('vintage')})
    return rows


def finding_buildings(conn):
    rows=conn.execute("""select p.yr_built,p.own_occ,count(*)::int,
      count(*) filter(where exists(select 1 from incidents i where i.city='boston' and i.category='rodent'
        and i.opened_at>='2024-01-01' and st_dwithin(p.geom,i.geom,30)))::int,array_agg(distinct p.source_id)
      from parcels p where p.city='boston' and p.geom is not null and p.yr_built is not null and p.own_occ is not null
      group by 1,2""").fetchall()
    if not rows: raise MissingInput({'table':'parcels','why':'year built and owner occupancy'})
    grouped=defaultdict(lambda:[0,0,set()])
    for yr,occ,n,k,src in rows:
        age='pre-1920' if yr<1920 else '1920–1959' if yr<1960 else '1960+'
        v=grouped[(age,occ)];v[0]+=n;v[1]+=k;v[2].update(src)
    stats=[{'age_bucket':age,'owner_occupied':occ,'n':v[0],'parcels_with_nearby_reports':v[1],
            'share':v[1]/v[0]} for (age,occ),v in sorted(grouped.items())]
    sources={s for v in grouped.values() for s in v[2]}
    sources.update(r[0] for r in conn.execute("select distinct source_id from incidents where city='boston' and category='rodent' and opened_at>='2024-01-01'").fetchall())
    return {'id':'building-age-owner','title':'Reports near parcels by building age and owner occupancy',
      'question':'How does reported activity vary across building groups?',
      'method':'Share of parcels with ≥1 rodent report within 30 m since 2024, by year-built bucket and owner occupancy.',
      'unit':'parcel','stat':{'groups':stats,'descriptive_only':True},'strength':'none',
      'chart':{'type':'bar','x_label':'Age / owner occupied','y_label':'Share of parcels with nearby reports',
               'series':[{'name':'Nearby report share','points':[[f"{r['age_bucket']} / {r['owner_occupied']}",r['share']] for r in stats]}]},
      'caveat':'Descriptive, not a significance test. Parcel points are centroids; nearby does not identify the reported property. '+CAVEAT,
      'group_name':'shelter','source_ids':sorted(sources),'sort':80}


def run(conn):
    done,missing={},[]
    site_sources={s for (ids,) in conn.execute("select summary->'source_ids' from sites where city='boston' and summary->>'definition'='dbscan_50m_min3_v2' and rank between 1 and 50").fetchall() for s in (ids or [])}
    has_sites=bool(site_sources)
    def save(fid,title,metric,value,sources):
        save_impact(conn,{'id':fid,'title':title,'scope':'city','scope_id':'boston','metric':metric,
                    'value':value,'caveat':CAVEAT,'source_ids':sorted(set(sources)|site_sources)})
        done[fid]={'insufficient':value.get('insufficient',False)}
        if value.get('insufficient'): missing.append({'row':fid,'need':'sufficient comparable observations'})
    if has_sites:
        parcels=conn.execute("""with near as materialized (
          select distinct p.pid from sites s join parcels p on st_dwithin(p.geom,s.geom,100)
          where s.city='boston' and s.summary->>'definition'='dbscan_50m_min3_v2' and s.rank between 1 and 50)
          select p.pid,p.zip,p.land_use,p.yr_built,p.value_fy25,p.value_fy26,
            near.pid is not null,p.source_id
          from parcels p left join near on near.pid=p.pid
          where p.city='boston' and p.geom is not null and p.value_fy25>0 and p.value_fy26 is not null
            and (p.land_use ~* 'FAM|CONDO|APART|RESIDENTIAL' or p.land_use in ('R1','R2','R3','R4','CD'))""").fetchall()
        if parcels:
            save('assessed-change-chronic-vs-matched','FY25–FY26 assessed-value changes near chronic sites','change_pct',matched_assessment(parcels),[r[7] for r in parcels])
        else: missing.append({'table':'parcels','need':'matched residential FY25/FY26 values'})
        listings=conn.execute("""with near as materialized (
          select distinct p.id from sites s join listings p on st_dwithin(p.geom,s.geom,250)
          where s.city='boston' and s.summary->>'definition'='dbscan_50m_min3_v2' and s.rank between 1 and 50)
          select p.price,p.review_count,p.rat_review_count,near.id is not null,p.source_id
          from listings p left join near on near.id=p.id where p.geom is not null
            and exists(select 1 from tracts t where t.city='boston' and st_covers(t.geom::geometry,p.geom::geometry))""").fetchall()
        if listings: save('listings-near-hotspots','Short-stay listings near chronic sites vs elsewhere','listing_price_reviews',listing_comparison(listings),[r[4] for r in listings])
        else: missing.append({'table':'listings','need':'prices and rat-review counts'})
    else: missing.append({'table':'sites','need':'ranked v2 sites'})
    zips=conn.execute("""with prices as (select distinct on(zip) zip,zhvi,zori,source_id,month from zip_prices order by zip,month desc),
      rodent as (select zip,count(*)::float8 as n,array_agg(distinct source_id) as sources from incidents
        where city='boston' and category='rodent' and opened_at>='2025-01-01' and opened_at<'2026-01-01' group by zip),
      parcels_count as (select zip,count(*) as n from parcels where city='boston' group by zip)
      select p.zip,p.zhvi,p.zori,1000*r.n/c.n,p.source_id,r.sources,p.month from prices p
        join rodent r using(zip) join parcels_count c using(zip) where c.n>0""").fetchall()
    if len(zips)>=3:
        v={'n':len(zips),'unit':'2025 rodent reports per 1,000 loaded parcels',
           'rho_value':r2(spearman([r[1] for r in zips if r[1] is not None],[r[3] for r in zips if r[1] is not None])),
           'rho_rent':r2(spearman([r[2] for r in zips if r[2] is not None],[r[3] for r in zips if r[2] is not None])),
           'price_months':sorted({str(r[6]) for r in zips})}
        save('zillow-rodent-rate','ZIP housing prices and reported rodent activity: exploratory','correlation',v,
             {r[4] for r in zips}|{s for r in zips for s in r[5]}|
             {r[0] for r in conn.execute("select distinct source_id from parcels where city='boston'").fetchall()})
    else: missing.append({'table':'zip_prices / parcels','need':'≥3 ZIPs with denominators'})
    schools=conn.execute("""with counts as (
      select g.id,g.geom,count(i.id) as n from grid_cells g left join incidents i on i.city='boston'
        and i.category='rodent' and i.opened_at>='2024-01-01' and i.geom && g.geom
        and st_covers(g.geom::geometry,i.geom::geometry)
      where g.city='boston' group by g.id), ranked as (
      select *,row_number() over(order by n desc,id) as rn,count(*) over() as total from counts)
      select p.id,p.source_id,exists(select 1 from ranked g where rn<=greatest(1,ceil(total*.1)) and n>0
        and st_dwithin(p.geom,g.geom,250)) as near
      from places p where p.city='boston' and p.kind='school' and p.geom is not null""").fetchall()
    if schools:
        sources={r[1] for r in schools}|{r[0] for r in conn.execute("select distinct source_id from incidents where city='boston' and category='rodent' and opened_at>='2024-01-01'").fetchall()}
        save('schools-near-hotspots','Schools in or next to cells with the most rodent reports','schools',
             {'n':len(schools),'count':sum(r[2] for r in schools),'near_hotspot_share':sum(r[2] for r in schools)/len(schools),
              'radius_m':250,'method':'Within a top-10% 250 m cell or 250 m of its boundary; reports since 2024; not a school infestation count.'},sources)
    else: missing.append({'table':'places','need':'school locations'})
    try:
        save_finding(conn,finding_buildings(conn));done['building-age-owner']={}
    except MissingInput as exc: missing.append(exc.need)
    conn.commit()
    return {'rows':done,'missing_inputs':missing}
