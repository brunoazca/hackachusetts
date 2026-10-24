"""Publish the explicitly tested findings required by R5.2/R5.3.

These are dated research results, not measurements rerun on the current DB.
The source and method travel with every row so the UI cannot mistake them for live fits.
"""
from .correlations import _upsert

SOURCE_ID = 'rat-audit-research-20261024'
SOURCE_URL = 'https://github.com/brunoazca/hackachusetts/blob/main/.kiro/specs/rat-audit/data-audit.md'
COMMON = ('Dated validation of public datasets on Oct 24, 2026; not recomputed on the current database. '
          'Reports measure reporting behavior, not rat population. Associations do not establish cause.')

# id, headline, strength, unit, statistic, chart points, method, group, illustrative layers.
RESULTS = [
 ('leading-signals','Dead-animal and indoor-pest reports were weak leading signals','weak','grid cell',
  {'n':1319,'dead_animal_partial_rho':.14,'indoor_pest_partial_rho':.11},
  [['Dead animal',.14],['Indoor pest',.11]],
  '2024 signals vs 2025–2026 rodent reports; partial Spearman controlling 2024 rodent reports, non-rodent 311 volume and address count.',
  'reports',['dead_animal','pest']),
 ('seasonality-temperature','More rodent reports in warmer months (r = +0.87)','strong','month',
  {'n':45,'r':.87,'previous_month_r':.82},[['Same month',.87],['Previous month',.82]],
  'Monthly rodent reports vs NOAA Logan mean high temperature, 45 months; seasonal association. Four winters cannot test a winter-to-spring effect.',
  'weather',['temperature']),
 ('demolition-displacement','Demolitions: no post-demolition report spike in the tested sample','none','demolition',
  {'n':396,'before':863,'after':875,'ratio':1.01,'control_ratio':1.23,'difference_in_differences':.82},
  [['Demolitions',1.01],['Roof-permit controls',1.23]],
  'Rodent reports within 200 m, 90 days before/after demolitions, roof permits as control sites.',
  'displace',['demolition','excavation']),
 ('rain-lag','Heavy rain: no detectable change in rodent reports','none','rain event',
  {'n':37,'after_ratio':1.008,'control_ratio':1.007,'p':.49},[['Heavy rain',1.008],['Random controls',1.007]],
  'Rain ≥1 inch; season/trend/weekday-adjusted reports on days 1–7 after rain vs random dates.',
  'weather',['rain']),
 ('trash-day-effect','Trash pickup day: no consistent single-day effect','none','grid cell',
  {'residual_se_approx':20,'mon':7,'tue':12,'wed':-32,'thu':2,'fri':39},
  [['Mon',7],['Tue',12],['Wed',-32],['Thu',2],['Fri',39]],
  'Mean rodent residual in rank units by pickup day, after grid reporting-volume and address controls.',
  'food',['trash_day']),
 ('restaurant-violations-nearby','Restaurant rodent citations: no association after controls','none','grid cell',
  {'n':1319,'citation_count':1614,'partial_rho':-.04,'predictive_partial_rho':0},
  [['Adjusted association',-.04],['Leading association',0]],
  '2024 citation locations vs 2024 reports, and 2025–2026 reports; partial Spearman controlling reporting volume, addresses and prior rodent reports for the leading estimate.',
  'food',['restaurant']),
 ('bigbelly-protective','Big Belly bins: no detectable protective association','none','grid cell',
  {'n':1319,'bins':508,'partial_rho':-.01,'predictive_partial_rho':0},
  [['Adjusted association',-.01],['Leading association',0]],
  'Partial Spearman over lived-in grid cells; reporting-volume/address controls, plus prior rodent reports for the leading estimate.',
  'food',['bigbelly']),
 ('events-trash-surge','Events and Red Sox games showed no measurable rodent-report signal','none','game-period / grid cell',
  {'high_games_city_share_pct':4.01,'low_games_city_share_pct':4.12,'entertainment_partial_rho':-.01,'alcohol_partial_rho':-.04},
  [['After ≥5 home games',4.01],['After ≤1 home game',4.12]],
  'Share of city reports within 1 km of Fenway after high- vs low-game periods; license locations tested separately using grid controls.',
  'reports',['sports','entertainment','one_day_alcohol']),
 ('underreporting','Lower reported rodent rates in several vulnerable tract groups','weak','census tract',
  {'n':167,'children_partial_rho':-.24,'people_of_color_partial_rho':-.23,'disability_partial_rho':-.18},
  [['Children',-.24],['People of color',-.23],['Disability',-.18]],
  'Rodent reports per 1,000 residents, tracts with population ≥500; controlling non-rodent 311 reports per resident. Lower reports may mean under-reporting or fewer rodents.',
  'reports',['tract']),
]


def rows():
    out=[]
    for i,(fid,title,strength,unit,stat,points,method,group,layers) in enumerate(RESULTS):
        out.append({'id':fid,'title':title,'question':title.split(':')[0], 'method':method,'unit':unit,
          'stat':{**stat,'evidence_kind':'dated_research','tested_on':'2026-10-24','layer_ids':layers,'reference':SOURCE_URL},
          'strength':strength,'chart':{'type':'bar','x_label':'Comparison','y_label':
            'Partial correlation' if 'partial_rho' in str(stat) else 'Statistic (see method)',
            'series':[{'name':'Dated validation','points':points}]},
          'caveat':COMMON,'group_name':group,'source_ids':[SOURCE_ID],'sort':40+i})
    return out


def run(conn):
    conn.execute("""insert into sources(id,name,url,retrieved_at,notes,update_mode,update_note)
      values (%s,%s,%s,now(),%s,'static',%s)
      on conflict(id) do update set name=excluded.name,url=excluded.url,notes=excluded.notes,
      update_mode=excluded.update_mode,update_note=excluded.update_note""",
      (SOURCE_ID,'Rat Audit: public-data validation, Oct 24 2026',SOURCE_URL,COMMON,
       'Dated research snapshot; current-data recalculations are separately labelled.'))
    for row in rows():
        _upsert(conn,row)
    conn.commit()
    return {'rows':len(RESULTS),'evidence_kind':'dated_research','tested_on':'2026-10-24'}
