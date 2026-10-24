import json,os,time,urllib.parse,urllib.request,hashlib
C=os.path.join(os.path.dirname(os.path.abspath(__file__)),"cache"); os.makedirs(C,exist_ok=True)
def sql(s,tries=3):
    h=os.path.join(C,hashlib.md5(s.encode()).hexdigest()+".json")
    if os.path.exists(h): return json.load(open(h))
    u="https://data.boston.gov/api/3/action/datastore_search_sql?"+urllib.parse.urlencode({"sql":s})
    for i in range(tries):
        try:
            d=json.load(urllib.request.urlopen(u,timeout=240))
            if d.get("success"):
                r=d["result"]["records"]; json.dump(r,open(h,"w")); return r
            raise RuntimeError(str(d)[:300])
        except Exception as e:
            print("  retry",i,str(e)[:150]); time.sleep(6*(i+1))
    raise RuntimeError("failed: "+s[:200])
def getjson(u):
    h=os.path.join(C,hashlib.md5(u.encode()).hexdigest()+".json")
    if os.path.exists(h): return json.load(open(h))
    d=json.load(urllib.request.urlopen(u,timeout=240)); json.dump(d,open(h,"w")); return d
Y25="9d7c2214-4709-478a-a2e8-fb2020a5bb94"; Y24="dff4d804-5031-443a-8409-8344efd0e5c8"; Y26="1a0b420d-99f1-4887-9851-990b2a5a6e17"; Y23="e6013a93-1321-4f2a-bf91-8d8a02f1e62f"
NEW="254adca6-64ab-4c5c-9fc0-a6da622be185"
