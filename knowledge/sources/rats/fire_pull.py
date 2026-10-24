import json,urllib.parse,urllib.request
import os,time
def sql(s):
  for i in range(4):
    try: return _sql(s)
    except Exception as e:
      print("retry",i,e); time.sleep(5*(i+1))
  raise SystemExit("failed: "+s[:80])
def _sql(s):
    u="https://data.boston.gov/api/3/action/datastore_search_sql?"+urllib.parse.urlencode({"sql":s})
    d=json.load(urllib.request.urlopen(u,timeout=180))
    if not d.get("success"): raise SystemExit(d)
    return d["result"]["records"]
F="91a38b1f-8439-46df-ba47-a30c48845e06"
W="alarm_date >= '2023-01-01' AND alarm_date < '2025-01-01'"
data=json.load(open("data.json")) if os.path.exists("data.json") else {}
if "elec" not in data: data["elec"]=sql(f"SELECT zip, incident_description d, count(*) n FROM \"{F}\" WHERE {W} AND (incident_description ILIKE 'Electrical  wiring%' OR incident_description ILIKE 'Arcing, shorted%' OR incident_description ILIKE 'Heat from short circuit%' OR incident_description ILIKE 'Overheated motor%' OR incident_description ILIKE 'Breakdown of light ballast%') GROUP BY 1,2")
if "all" not in data: data["all"]=sql(f"SELECT zip, count(*) n FROM \"{F}\" WHERE {W} GROUP BY 1")
if "bldgfire" not in data: data["bldgfire"]=sql(f"SELECT zip, count(*) n FROM \"{F}\" WHERE {W} AND (incident_description ILIKE 'Building fire%' OR incident_description ILIKE 'Cooking fire%' OR incident_description ILIKE '%structure%fire%') GROUP BY 1")
if "types" not in data: data["types"]=sql(f"SELECT incident_description d, count(*) n FROM \"{F}\" WHERE {W} GROUP BY 1 ORDER BY 2 DESC LIMIT 60")
# 2026 new coding
W6="alarm_date >= '2026-01-01'"
if "elec26" not in data: data["elec26"]=sql(f"SELECT zip, count(*) n FROM \"{F}\" WHERE {W6} AND (incident_detail ILIKE 'Electrical Hazard%' OR incident_detail ILIKE 'Electrical Power Line%') GROUP BY 1")
if "all26" not in data: data["all26"]=sql(f"SELECT zip, count(*) n FROM \"{F}\" WHERE {W6} GROUP BY 1")
T={"2023":"e6013a93-1321-4f2a-bf91-8d8a02f1e62f","2024":"dff4d804-5031-443a-8409-8344efd0e5c8","2026":"1a0b420d-99f1-4887-9851-990b2a5a6e17"}
for y,t in T.items():
    if "rod"+y not in data: data["rod"+y]=sql(f"SELECT location_zipcode zip, count(*) n FROM \"{t}\" WHERE type='Rodent Activity' GROUP BY 1")
    if "t311"+y not in data: data["t311"+y]=sql(f"SELECT location_zipcode zip, count(*) n FROM \"{t}\" GROUP BY 1")
if "pa" not in data: data["pa"]=sql("SELECT \"ZIP_CODE\" zip, count(*) n FROM \"ee73430d-96c0-423e-ad21-c4cfb54c8961\" GROUP BY 1")
if "old" not in data: data["old"]=sql("SELECT \"ZIP_CODE\" zip, count(*) n FROM \"ee73430d-96c0-423e-ad21-c4cfb54c8961\" WHERE \"YR_BUILT\" < '1920' AND \"YR_BUILT\" > '1000' GROUP BY 1")
json.dump(data,open("data.json","w"))
for k,v in data.items(): print(k,len(v))
for r in data["types"][:60]: print(r["n"],r["d"])
