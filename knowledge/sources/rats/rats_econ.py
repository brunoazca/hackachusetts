import csv, gzip, json, re, sys
from collections import defaultdict

econ, rats = sys.argv[1], sys.argv[2]
csv.field_size_limit(10**9)

# Inside Airbnb: reviews mentioning rodents, by neighbourhood
nb, price = {}, {}
with gzip.open(f"{econ}/listings.csv.gz", "rt", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        nb[r["id"]] = r["neighbourhood_cleansed"]
pat = re.compile(r"\b(rats?|mice|mouse|rodents?)\b", re.I)
noise = re.compile(r"\b(mouse ?pad|computer mouse|wireless mouse|rat ?race|rate)\b", re.I)
tot, hit, examples = defaultdict(int), defaultdict(int), []
with gzip.open(f"{econ}/reviews.csv.gz", "rt", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        n = nb.get(r["listing_id"], "?"); c = r.get("comments") or ""
        tot[n] += 1
        if pat.search(c) and not noise.search(c):
            hit[n] += 1
            if len(examples) < 6 and r["date"] >= "2024": examples.append((r["date"], n, c[:160].replace("\n", " ")))
T, H = sum(tot.values()), sum(hit.values())
print(f"Airbnb reviews: {T:,}; mentioning rats/mice/rodents: {H:,} ({100*H/T:.2f}%)")
for n in sorted(tot, key=lambda n: -(hit[n] / tot[n]) if tot[n] >= 2000 else 0)[:8]:
    if tot[n] >= 2000: print(f"  {n}: {hit[n]} of {tot[n]:,} ({100*hit[n]/tot[n]:.2f}%)")
for e in examples: print("  e.g.", e)

# Zillow home values and rents by ZIP vs rodent reports per 1,000 property records
def recs(f): return json.load(open(f"{rats}/{f}"))["result"]["records"]
rod = defaultdict(float)
for r in recs("t311.json"):
    if r["type"] == "Rodent Activity": rod[(r["z"] or "")[:5]] += float(r["n"])
den = {(r["z"] or "")[:5]: float(r["n"]) for r in recs("pa.json")}
def zillow(path):
    out = {}
    with open(path, encoding="utf-8") as f:
        rd = csv.reader(f); head = next(rd)
        cols = [i for i, h in enumerate(head) if h.startswith("2025-")]
        zi = head.index("RegionName")
        for row in rd:
            z = row[zi].zfill(5)
            if z.startswith("021"):
                v = [float(row[i]) for i in cols if row[i]]
                if v: out[z] = sum(v) / len(v)
    return out
zhvi, zori = zillow(f"{econ}/zhvi.csv"), zillow(f"{econ}/zori.csv")

def rank(xs):
    o = sorted(range(len(xs)), key=lambda i: xs[i]); r = [0]*len(xs)
    for p, i in enumerate(o): r[i] = p
    return r
def rho(a, b):
    ra, rb = rank(a), rank(b); n = len(a); ma, mb = sum(ra)/n, sum(rb)/n
    num = sum((x-ma)*(y-mb) for x, y in zip(ra, rb))
    return num / ((sum((x-ma)**2 for x in ra) * sum((y-mb)**2 for y in rb)) ** .5)
for name, idx in [("home value (ZHVI 2025 avg)", zhvi), ("rent (ZORI 2025 avg)", zori)]:
    zs = [z for z in idx if den.get(z, 0) >= 1000 and rod.get(z)]
    a = [rod[z] / den[z] * 1000 for z in zs]; b = [idx[z] for z in zs]
    print(f"Spearman rodent rate vs {name}: {rho(a, b):+.2f} over {len(zs)} ZIPs")
for z in ["02134", "02120", "02113", "02119", "02121", "02118", "02116", "02108"]:
    if z in den: print(z, "rodent/1k", round(rod.get(z, 0) / den[z] * 1000, 1), "ZHVI", int(zhvi.get(z, 0)), "ZORI", int(zori.get(z, 0)))
