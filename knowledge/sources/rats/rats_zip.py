import json, sys
from collections import defaultdict

d = sys.argv[1]
def recs(f): return json.load(open(f"{d}/{f}"))["result"]["records"]
def z(v): return (v or "").strip()[:5].zfill(5) if v else ""

rows = defaultdict(lambda: defaultdict(float))
for r in recs("t311.json"): rows[z(r["z"])][r["type"]] += float(r["n"])
for r in recs("food.json"): rows[z(r["z"])]["Restaurant rodent citations"] += float(r["n"])
for r in recs("rs.json"): rows[z(r["z"])]["Housing rodent/pest violations"] += float(r["n"])
den = {z(r["z"]): float(r["n"]) for r in recs("pa.json")}

zips = [k for k in rows if k.startswith("021") and den.get(k, 0) >= 1000 and rows[k]["Rodent Activity"] > 0]
def rate(k, f): return rows[k][f] / den[k] * 1000

def rank(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i]); r = [0] * len(xs)
    for pos, i in enumerate(o): r[i] = pos
    return r
def spearman(a, b):
    ra, rb = rank(a), rank(b); n = len(a)
    ma, mb = sum(ra) / n, sum(rb) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    va = sum((x - ma) ** 2 for x in ra) ** .5; vb = sum((y - mb) ** 2 for y in rb) ** .5
    return cov / (va * vb)

target = [rate(k, "Rodent Activity") for k in zips]
print("ZIPs:", len(zips))
factors = ["Improper Storage of Trash (Barrels)", "Missed Trash/Recycling/Yard Waste/Bulk Item", "Illegal Dumping",
           "Empty Litter Basket", "Overflowing or Un-kept Dumpster", "Construction Debris", "Trash on Vacant Lot",
           "Pick up Dead Animal", "Restaurant rodent citations", "Housing rodent/pest violations", "Pest Infestation - Residential"]
for f in sorted(factors, key=lambda f: -spearman(target, [rate(k, f) for k in zips])):
    tot = sum(rows[k][f] for k in zips)
    print(f"{spearman(target, [rate(k, f) for k in zips]):+.2f}  {f}  (total {int(tot)})")

print("\nTop ZIPs by rodent reports per 1,000 property records:")
for k in sorted(zips, key=lambda k: -rate(k, "Rodent Activity"))[:8]:
    print(k, round(rate(k, "Rodent Activity"), 1), "| trash storage", round(rate(k, "Improper Storage of Trash (Barrels)"), 1),
          "| restaurant cites", int(rows[k]["Restaurant rodent citations"]), "| housing violations", int(rows[k]["Housing rodent/pest violations"]))
