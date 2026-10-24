import json, numpy as np
from collections import defaultdict
from lib import *
print("EMPLOYEE EARNINGS (latest table, rodent/pest/environmental titles)")
for rid in ["29b3544f-752a-4cb1-a6af-a1de153d20a0"]:
    rs=sql(f'SELECT "DEPARTMENT_NAME" d, "TITLE" t, count(*) n, min("TOTAL GROSS") lo, max("TOTAL GROSS") hi FROM "{rid}" WHERE "TITLE" ILIKE \'%rodent%\' OR "TITLE" ILIKE \'%pest%\' OR "TITLE" ILIKE \'%extermin%\' OR ("TITLE" ILIKE \'%environment%\' AND "DEPARTMENT_NAME" ILIKE \'%inspect%\') GROUP BY 1,2 ORDER BY 3 DESC LIMIT 15')
    for r in rs: print(" ",r)
print("\nSCHOOLS NEAR RAT HOT SPOTS")
G={k:defaultdict(float,v) for k,v in json.load(open("grid.json")).items()}
tot={k:v["rod24"]+v["rod25"]+v["rod26"] for k,v in G.items()}
vals=sorted(tot.values(),reverse=True); cut=vals[int(len([v for v in vals if v>0])*0.1)]
hot={k for k,v in tot.items() if v>=cut and v>0}
near=0; sch=0
for k,v in G.items():
    if v["schools"]>0:
        sch+=v["schools"]; a,b=map(int,k.split(","))
        if any(f"{a+i},{b+j}" in hot for i in (-1,0,1) for j in (-1,0,1)): near+=v["schools"]
print(f"  top-10% rodent cells: {len(hot)} (>= {cut:.0f} reports 2024-26); schools in or next to one: {int(near)} of {int(sch)}")
print("\nSOMERVILLE 311")
try:
    d=getjson("https://data.somervillema.gov/resource/4pyi-uqq6.json?$select=type,count(*)&$where=lower(type)%20like%20%27%25rat%25%27%20or%20lower(type)%20like%20%27%25rodent%25%27&$group=type")
    print(" ",d[:10])
except Exception as e: print("  ",e)
