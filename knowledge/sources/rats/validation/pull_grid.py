# Builds grid.json: feature counts per ~280 m x 205 m cell (1/400 degree).
import json,re,urllib.request
from collections import defaultdict
from lib import *
from sp import sp2ll
G=defaultdict(lambda: defaultdict(float))
cell=lambda la,lo:(int(__import__("math").floor(float(la)*400)),int(__import__("math").floor(float(lo)*400)))
def ok(la,lo):
    try: la,lo=float(la),float(lo); return 42.2<la<42.42 and -71.2<lo<-70.98
    except: return False
def add_sql(name,table,where,lat="latitude",lon="longitude"):
    q=f'SELECT floor({lat}::numeric*400) a, floor({lon}::numeric*400) b, count(*) n FROM "{table}" WHERE {where} GROUP BY 1,2'
    try: rs=sql(q)
    except RuntimeError:
        import re as _re
        q2=_re.sub(r" AND \w+ <> ''","",q); q2=_re.sub(r"\w+ <> '' AND ","",q2); q2=_re.sub(r"WHERE \w+ <> ''\s*GROUP","WHERE TRUE GROUP",q2)
        print("  fallback:",q2[-120:]); rs=sql(q2)
    tot=0
    for r in rs:
        if r["a"] is None: continue
        a,b=int(float(r["a"])),int(float(r["b"]))
        if 16880<=a<=16968 and -28480<=b<=-28392: G[(a,b)][name]+=r["n"]; tot+=r["n"]
    print(f"{name:34s} {tot:>8.0f}  ({len(rs)} cells)")
def add_pts(name,pts):
    tot=0
    for la,lo,w in pts:
        if ok(la,lo): G[cell(la,lo)][name]+=w; tot+=w
    print(f"{name:34s} {tot:>8.0f}  (points)")
LL="latitude IS NOT NULL AND latitude <> '' AND longitude <> ''"
# Outcome and controls
add_sql("rod24",Y24,f"type='Rodent Activity' AND {LL}")
add_sql("rod25",Y25,f"type='Rodent Activity' AND {LL}")
add_sql("rod26",Y26,f"type='Rodent Activity' AND {LL}")
add_sql("all311_24",Y24,f"{LL}")
for t,k in [("Improper Storage of Trash (Barrels)","improper_trash_311"),("Missed Trash/Recycling/Yard Waste/Bulk Item","missed_trash_311"),
            ("Pick up Dead Animal","dead_animal_311"),("Illegal Dumping","illegal_dumping_311"),("Empty Litter Basket","litter_basket_311"),
            ("Pest Infestation - Residential","pest_residential_311"),("Unsanitary Conditions - Establishment","unsanitary_estab_311"),
            ("Construction Debris","construction_debris_311"),("Overflowing or Un-kept Dumpster","overflow_dumpster_311"),
            ("Abandoned Building","abandoned_building_311"),("Trash on Vacant Lot","vacant_lot_trash_311"),("Abandoned Vehicles","PLACEBO_abandoned_vehicles")]:
    add_sql(k,Y24,f"type='{t}' AND {LL}")
for s,k in [("Trash Placed Out Early","out_early_new"),("Overflowing Trash","overflowing_trash_new"),("Litter & Debris","litter_new"),
            ("Student Move-In (Trash Collection)","student_movein_new"),("Overgrown Weeds","weeds_new"),("Improper Trash Storage","improper_trash_new")]:
    add_sql(k,NEW,f"service_name='{s}' AND {LL}")
CE="90ed3816-5e70-443c-803d-9a71f44470be"
for d,k in [("Improper storage trash: res","ce_trash_res"),("Improper storage trash: com","ce_trash_com"),("Overfilling of barrel/dumpster","ce_overfill"),
            ("Overgrown Weeds On Property","ce_weeds"),("Illegal dumping < 1 cubic yd","ce_dumping"),("Maint a dumpster wopermit","ce_dumpster_noperm")]:
    add_sql(k,CE,f"description='{d}' AND status_dttm >= '2024-01-01' AND status_dttm < '2025-01-01' AND {LL}")
add_sql("permits_demo_23_25","6ddcd912-32a0-43df-9908-63574f8c7e77","worktype IN ('RAZE','EXTDEM') AND issued_date >= '2023-01-01' AND y_latitude <> '' ","y_latitude","x_longitude")
add_sql("permits_newcon_23_25","6ddcd912-32a0-43df-9908-63574f8c7e77","worktype IN ('NEWCON','ERECT') AND issued_date >= '2023-01-01' AND y_latitude <> '' ","y_latitude","x_longitude")
add_sql("trees","995cd80f-2489-41bf-b16b-113dba4f2797","y_latitude <> ''","y_latitude","x_longitude")
add_sql("addresses","fee8ee07-b8b5-4ee5-b540-5162590ba5c1","y_coord <> ''","y_coord","x_coord")
for d in ["M","T","W","TH","F"]:
    pass
TD=sql('SELECT floor(y_coord::numeric*400) a, floor(x_coord::numeric*400) b, trashday, count(*) n FROM "fee8ee07-b8b5-4ee5-b540-5162590ba5c1" WHERE y_coord <> \'\' GROUP BY 1,2,3')
for r in TD:
    if r["a"] is None: continue
    G[(int(float(r["a"])),int(float(r["b"])))]["td_"+str(r["trashday"]).strip()]+=r["n"]
# Building stock
P="f6b5aee9-8607-4ba8-ac6b-17b3ffb43084"
add_sql("props",P,"rs_prop_lat <> ''","rs_prop_lat","rs_prop_long")
add_sql("props_pre1920",P,"rs_prop_lat <> '' AND rs_prop_yr_built IN ('1900','1905','1910','1915','1800','1850','1880','1890','1895','1875','1870','1860','1885')","rs_prop_lat","rs_prop_long")
# Point datasets
def loc(s):
    m=re.match(r"\(?\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)",s or ""); return (m.group(1),m.group(2)) if m else (None,None)
FI="4582bec6-2b4f-4f9e-bc55-cbaa73117f4c"
rows=sql(f'SELECT location FROM "{FI}" WHERE (violdesc ILIKE \'%rodent%\' OR violdesc ILIKE \'%mice%\' OR comments ILIKE \'%rodent%\' OR comments ILIKE \'%mouse%\' OR comments ILIKE \'%mice%\' OR comments ILIKE \'% rat %\') AND resultdttm >= \'2024-01-01\' AND resultdttm < \'2025-01-01\'')
add_pts("restaurant_rodent_cites_24",[(*loc(r["location"]),1) for r in rows])
add_pts("food_licenses",[(r["latitude"],r["longitude"],1) for r in sql('SELECT latitude, longitude FROM "f1e13724-284d-478c-b8bc-ef042aa5b70b"')])
add_pts("big_belly",[(*loc(r["Location"]),1) for r in sql('SELECT "Location" FROM "15e7fa44-b9a8-42da-82e1-304e43460095"')])
def spts(table,where="TRUE"):
    out=[]
    for r in sql(f'SELECT gpsx, gpsy FROM "{table}" WHERE {where}'):
        try:
            if float(r["gpsx"])>100000: out.append((*sp2ll(r["gpsx"],r["gpsy"]),1))
        except: pass
    return out
add_pts("liquor_licenses",spts("aab353c1-c797-4053-a3fc-e893f5ccf547"))
add_pts("entertainment_licenses",spts("ed8efbc1-067c-4da6-9551-a8b2eaea4a24"))
add_pts("oneday_alcohol_events",spts("957dc193-d66b-443c-b240-beaa6d822bc9","issued >= '2023-01-01'"))
add_pts("oneday_entertainment_events",spts("ea7f0605-ffc0-4ad4-a786-02c50b276f54","issued >= '2023-01-01'"))
add_pts("colleges",[(r["Latitude"],r["Longitude"],1) for r in sql('SELECT "Latitude","Longitude" FROM "f59456d7-4b3d-407d-9fcd-4a6ae473afcb"')])
add_pts("schools",[(r["POINT_Y"],r["POINT_X"],1) for r in sql('SELECT "POINT_X","POINT_Y" FROM "6ceeff38-a0db-46df-b5be-f8cfdea0186d"')])
add_pts("food_trucks",[(r["POINT_Y"],r["POINT_X"],1) for r in sql('SELECT "POINT_X","POINT_Y" FROM "f56ce26c-d020-495a-9c6a-3f3ad41b5425"')])
pf=sql('SELECT "Asset","POINT_X","POINT_Y" FROM "4d28fc98-c503-4065-987f-9fbc41947fc4"')
add_pts("dog_parks",[(r["POINT_Y"],r["POINT_X"],1) for r in pf if "dog" in (r["Asset"] or "").lower()])
add_pts("park_features",[(r["POINT_Y"],r["POINT_X"],1) for r in pf])
def first_xy(w):
    m=re.search(r"(-71\.\d+)\s+(42\.\d+)",w or ""); return (m.group(2),m.group(1)) if m else (None,None)
add_pts("city_lots",[(*first_xy(r["the_geom"]),1) for r in sql('SELECT the_geom FROM "93481af5-81ed-4850-a637-baf6e83eed43"')])
# iNaturalist
pts=[];page=1
while True:
    d=getjson(f"https://api.inaturalist.org/v1/observations?taxon_name=Rattus&nelat=42.42&nelng=-70.98&swlat=42.2&swlng=-71.2&per_page=200&page={page}")
    for o in d["results"]:
        if o.get("location"): la,lo=o["location"].split(","); pts.append((la,lo,1))
    if page*200>=d["total_results"]: break
    page+=1
add_pts("inaturalist_rats",pts)
print("cells:",len(G))
json.dump({f"{a},{b}":v for (a,b),v in G.items()},open("grid.json","w"))
