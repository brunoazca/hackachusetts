# Tract-level tests: social vulnerability, displacement risk, CDC asthma vs rodent reports (controls: non-rodent 311 volume).
import json, numpy as np
from collections import defaultdict
from lib import *
from analyze_grid import rank, resid, pcor
S=json.load(open("dl/svi.geojson"))
def pip(x,y,poly):
    ins=False
    for ring in poly:
        n=len(ring)
        for i in range(n):
            x1,y1=ring[i][:2]; x2,y2=ring[(i+1)%n][:2]
            if (y1>y)!=(y2>y) and x<(x2-x1)*(y-y1)/(y2-y1)+x1: ins=not ins
    return ins
tracts=[]
for f in S["features"]:
    g=f["geometry"]; polys=g["coordinates"] if g["type"]=="MultiPolygon" else [g["coordinates"]]
    xs=[p[0] for poly in polys for p in poly[0]]; ys=[p[1] for poly in polys for p in poly[0]]
    tracts.append((f["properties"],polys,(min(xs),max(xs),min(ys),max(ys))))
G=json.load(open("grid.json"))
T=defaultdict(lambda: defaultdict(float))
for k,v in G.items():
    a,b=map(int,k.split(",")); la=(a+.5)/400; lo=(b+.5)/400
    for p,polys,(x0,x1,y0,y1) in tracts:
        if x0<=lo<=x1 and y0<=la<=y1 and any(pip(lo,la,poly) for poly in polys):
            for f,val in v.items(): T[p["GEOID10"]][f]+=val
            break
props={p["GEOID10"]:p for p,_,_ in tracts}
dri=defaultdict(list)
for r in sql('SELECT "GEOID", "DRI_Score" FROM "7addea28-03bd-44f3-a7ed-a20c4b3ac3ef"'):
    try: dri[str(r["GEOID"])[:11]].append(float(r["DRI_Score"]))
    except: pass
cdc={}
for r in getjson("https://data.cdc.gov/resource/cwsq-ngmh.json?countyfips=25025&measureid=CASTHMA&$limit=500"):
    cdc[r["locationname"]]=float(r["data_value"])
ids=[g for g in T if g in props and props[g]["POP100_RE"]>=500 and T[g]["all311_24"]>0]
pop=np.array([props[g]["POP100_RE"] for g in ids],float)
rod=np.array([T[g]["rod24"]+T[g]["rod25"]+T[g]["rod26"] for g in ids])/pop*1000
vol=np.array([T[g]["all311_24"]-T[g]["rod24"] for g in ids])/pop*1000
print(f"tracts: {len(ids)} (pop >= 500); rodent reports 2024-26 per 1,000 residents")
rows=[("Low or no income share",[props[g]["Low_to_No"]/props[g]["POP100_RE"] for g in ids]),
      ("Older adult share",[props[g]["OlderAdult"]/props[g]["POP100_RE"] for g in ids]),
      ("Children share",[props[g]["TotChild"]/props[g]["POP100_RE"] for g in ids]),
      ("Limited English share",[props[g]["LEP"]/props[g]["POP100_RE"] for g in ids]),
      ("People of color share",[props[g]["POC2"]/props[g]["POP100_RE"] for g in ids]),
      ("Disability share",[props[g]["TotDis"]/props[g]["POP100_RE"] for g in ids])]
did=[g for g in ids if g in dri]
for name,x in rows:
    x=np.array(x); print(f"  {name:28s} raw {pcor(x,rod,[]):+.2f}   controlling 311 volume {pcor(x,rod,[vol]):+.2f}")
ix=[i for i,g in enumerate(ids) if g in dri]
x=np.array([np.mean(dri[ids[i]]) for i in ix])
print(f"  {'Displacement risk score':28s} raw {pcor(x,rod[ix],[]):+.2f}   controlling 311 volume {pcor(x,rod[ix],[vol[ix]]):+.2f}   ({len(ix)} tracts)")
ix=[i for i,g in enumerate(ids) if g in cdc]
x=np.array([cdc[ids[i]] for i in ix]); inc=np.array([props[ids[i]]["Low_to_No"]/props[ids[i]]["POP100_RE"] for i in ix])
print(f"  {'Adult asthma % (CDC PLACES)':28s} raw {pcor(x,rod[ix],[]):+.2f}   controlling 311 volume {pcor(x,rod[ix],[vol[ix]]):+.2f}   controlling volume+income {pcor(x,rod[ix],[vol[ix],inc]):+.2f}  ({len(ix)} tracts; tract IDs are 2020 vs 2010 boundaries)")
# reporting bias: rodent share of 311 vs income / limited English
share=np.array([(T[g]["rod24"])/max(T[g]["all311_24"],1) for g in ids])
inat=np.array([T[g]["inaturalist_rats"] for g in ids])/pop*1000
print(f"\n  iNaturalist rat sightings vs 311 rodent rate (tract): {pcor(inat,rod,[]):+.2f}")
