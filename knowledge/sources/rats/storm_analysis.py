import json, sys, statistics
from collections import Counter, defaultdict
from datetime import datetime

d = sys.argv[1]
rows = json.load(open(f"{d}/storm311.json"))["result"]["records"]
tracts = json.load(open(f"{d}/crb.geojson"))["features"]

def rings(geom):
    if geom["type"] == "Polygon":
        return [geom["coordinates"]]
    return geom["coordinates"]

def inside(x, y, poly):
    ok = False
    for ring in poly[:1]:
        n = len(ring)
        for i in range(n):
            x1, y1 = ring[i][:2]; x2, y2 = ring[i - 1][:2]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                ok = not ok
    return ok

polys = [(t["properties"], rings(t["geometry"])) for t in tracts]
def tract_of(lon, lat):
    for p, ps in polys:
        if any(inside(lon, lat, poly) for poly in ps):
            return p
    return None

def ts(s):
    return datetime.fromisoformat(s.split(".")[0]) if s else None

print("rows", len(rows))
print("types", Counter(r["type"] for r in rows).most_common())
days = Counter(r["open_dt"][:10] for r in rows)
print("by day", sorted(days.items()))

storm = [r for r in rows if "2022-01-29" <= r["open_dt"][:10] <= "2022-02-05"]
hrs = []
for r in storm:
    o, c = ts(r["open_dt"]), ts(r["closed_dt"])
    r["_h"] = (c - o).total_seconds() / 3600 if c else None
    if r["_h"] is not None: hrs.append(r["_h"])
print("storm-week rows", len(storm), "closed", len(hrs), "median h", round(statistics.median(hrs), 1))
print("on_time", Counter(r["on_time"] for r in storm))

by_t = defaultdict(list)
miss = 0
for r in storm:
    try:
        lat, lon = float(r["latitude"]), float(r["longitude"])
    except (TypeError, ValueError):
        miss += 1; continue
    p = tract_of(lon, lat)
    if p is None: miss += 1; continue
    by_t[p["GEOID10"]].append(r)
print("unplaced", miss)

out = []
for p, _ in polys:
    rs = by_t.get(p["GEOID10"], [])
    pop = p["POP100_RE"] or 0
    if pop < 500: continue
    hs = [r["_h"] for r in rs if r["_h"] is not None]
    over48 = sum(1 for r in rs if r["_h"] is None or r["_h"] > 48)
    out.append(dict(
        geoid=p["GEOID10"], name=p["Name"], pop=pop, n=len(rs),
        per1k=round(1000 * len(rs) / pop, 1),
        med_h=round(statistics.median(hs), 1) if hs else None,
        over48=over48, sidewalk=sum(1 for r in rs if r["type"] == "Unshoveled Sidewalk"),
        older=round(100 * p["OlderAdult"] / pop, 1), lowinc=round(100 * p["Low_to_No"] / pop, 1),
        lep=round(100 * p["LEP"] / pop, 1), dis=round(100 * p["TotDis"] / pop, 1),
    ))

def rank(key):
    vals = sorted(o[key] for o in out)
    return lambda v: vals.index(v) / (len(vals) - 1)
ro, rl, rd = rank("older"), rank("lowinc"), rank("dis")
for o in out:
    o["vuln"] = round((ro(o["older"]) + rl(o["lowinc"]) + rd(o["dis"])) / 3, 2)

print("\nTop vulnerable tracts with slow or heavy storm complaints:")
cand = [o for o in out if o["n"] >= 15]
for o in sorted(cand, key=lambda o: -(o["vuln"] * (o["med_h"] or 0)))[:10]:
    print(o)

nb = defaultdict(list)
for geo, rs in by_t.items():
    for r in rs: nb[r["neighborhood"]].append(r)
print("\nNeighborhood summary (n, median hours to close, % open > 48h):")
for k, rs in sorted(nb.items(), key=lambda kv: -len(kv[1]))[:12]:
    hs = [r["_h"] for r in rs if r["_h"] is not None]
    o48 = sum(1 for r in rs if r["_h"] is None or r["_h"] > 48)
    print(k, len(rs), round(statistics.median(hs), 1) if hs else None, f"{100*o48/len(rs):.0f}%")

json.dump(out, open(f"{d}/tracts.json", "w"))
