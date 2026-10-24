# Tests each grid feature against rodent reports. Two tests:
#  assoc: partial Spearman with 2024 rodent reports, controlling for non-rodent 311 volume and address count
#  predict: partial Spearman with 2025-26 rodent reports, also controlling for 2024 rodent reports
import json, numpy as np
from collections import defaultdict
G={k:defaultdict(float,v) for k,v in json.load(open("grid.json")).items()}
cells=[k for k,v in G.items() if v["all311_24"]-v["rod24"]>=50 and v["addresses"]>=20]
def col(f): return np.array([G[k][f] for k in cells],float)
def rank(x):
    from scipy.stats import rankdata
    return rankdata(x)
try: import scipy
except ImportError:
    def rank(x):
        o=np.argsort(x,kind="mergesort"); r=np.empty(len(x)); r[o]=np.arange(len(x))
        # average ties
        xs=x[o]; i=0
        while i<len(xs):
            j=i
            while j+1<len(xs) and xs[j+1]==xs[i]: j+=1
            r[o[i:j+1]]=(i+j)/2; i=j+1
        return r
def resid(y,X):
    X=np.column_stack([np.ones(len(y))]+X); b,*_=np.linalg.lstsq(X,y,rcond=None); return y-X@b
def pcor(a,b,ctrl):
    ra,rb=rank(a),rank(b); rc=[rank(c) for c in ctrl]
    if not rc: return np.corrcoef(ra,rb)[0,1]
    return np.corrcoef(resid(ra,rc),resid(rb,rc))[0,1]
rod24=col("rod24"); fut=col("rod25")+col("rod26"); vol=col("all311_24")-rod24; addr=col("addresses")
n=len(cells)
feats=[k for k in sorted({f for v in G.values() for f in v}) if k not in ("rod24","rod25","rod26","all311_24","addresses") and not k.startswith("td_")]
res=[]
for f in feats:
    x=col(f)
    if (x>0).sum()<10: res.append((f,int(x.sum()),int((x>0).sum()),None,None,None)); continue
    res.append((f,int(x.sum()),int((x>0).sum()),pcor(x,rod24,[]),pcor(x,rod24,[vol,addr]),pcor(x,fut,[rod24,vol,addr])))
print(f"cells analysed: {n}  (≥50 non-rodent 311 reports and ≥20 addresses in 2024)")
print(f"rodent reports in these cells: 2024 {int(rod24.sum())}, 2025-26 {int(fut.sum())}")
print(f"baseline: 2024 rodent -> 2025-26 rodent, partial on volume+addresses: {pcor(rod24,fut,[vol,addr]):+.2f}")
print(f"\n{'feature':34s} {'total':>7s} {'cells':>6s} {'raw':>6s} {'assoc':>6s} {'predict':>8s}")
for f,t,c,r,a,p in sorted(res,key=lambda r:-(r[4] if r[4] is not None else -9)):
    fmt=lambda v:"   n/a" if v is None else f"{v:+.2f}"
    print(f"{f:34s} {t:>7d} {c:>6d} {fmt(r):>6s} {fmt(a):>6s} {fmt(p):>8s}")
# trash day
days=defaultdict(list)
rr=resid(rank(rod24),[rank(vol),rank(addr)])
for i,k in enumerate(cells):
    td={d:G[k][d] for d in G[k] if d.startswith("td_")}
    if td: days[max(td,key=td.get)].append(rr[i])
print("\nMean rodent residual (rank units, + = more rodents than volume predicts) by main trash day:")
for d,v in sorted(days.items(),key=lambda kv:-np.mean(kv[1])):
    if len(v)>=20: print(f"  {d:8s} cells {len(v):4d}  {np.mean(v):+7.1f}  (se {np.std(v)/np.sqrt(len(v)):.1f})")
json.dump({"n":n,"res":res},open("grid_results.json","w"))
