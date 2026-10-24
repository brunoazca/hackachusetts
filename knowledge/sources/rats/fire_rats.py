import json
from collections import defaultdict
D=json.load(open("data.json"))
z=lambda v:(str(v or "").strip()[:5].zfill(5))
def agg(key):
    o=defaultdict(float)
    for r in D[key]: o[z(r["zip"])]+=float(r["n"])
    return o
elec=agg("elec"); allf=agg("all"); bf=agg("bldgfire"); e26=agg("elec26"); a26=agg("all26")
wire=defaultdict(float)
for r in D["elec"]:
    if r["d"].startswith(("Heat from short","Arcing")): wire[z(r["zip"])]+=float(r["n"])
rod=defaultdict(float); t311=defaultdict(float)
for y in ("2023","2024"):
    for k,v in agg("rod"+y).items(): rod[k]+=v
    for k,v in agg("t311"+y).items(): t311[k]+=v
r26=agg("rod2026"); t26=agg("t3112026")
pa=agg("pa"); old=agg("old")
Z=[k for k in pa if k.startswith("021") and pa[k]>=1000 and rod[k]>0 and allf[k]>0]
def rank(x):
    o=sorted(range(len(x)),key=lambda i:x[i]); r=[0.0]*len(x); i=0
    while i<len(o):
        j=i
        while j+1<len(o) and x[o[j+1]]==x[o[i]]: j+=1
        for t in range(i,j+1): r[o[t]]=(i+j)/2
        i=j+1
    return r
def pear(a,b):
    n=len(a);ma=sum(a)/n;mb=sum(b)/n
    c=sum((x-ma)*(y-mb) for x,y in zip(a,b));va=sum((x-ma)**2 for x in a)**.5;vb=sum((y-mb)**2 for y in b)**.5
    return c/(va*vb)
sp=lambda a,b:pear(rank(a),rank(b))
def partial(a,b,c):
    ra,rb,rc=rank(a),rank(b),rank(c)
    rab,rac,rbc=pear(ra,rb),pear(ra,rc),pear(rb,rc)
    return (rab-rac*rbc)/(((1-rac**2)*(1-rbc**2))**.5)
per=lambda d,k:d[k]/pa[k]*1000
R=[per(rod,k) for k in Z]
rows=[
 ("Electrical incidents per 1,000 properties (2023–24)",[per(elec,k) for k in Z]),
 ("  wiring only: short circuit + arcing",[per(wire,k) for k in Z]),
 ("Electrical share of all BFD incidents",[elec[k]/allf[k] for k in Z]),
 ("All BFD incidents per 1,000 properties (activity control)",[per(allf,k) for k in Z]),
 ("Building/cooking fires per 1,000 properties",[per(bf,k) for k in Z]),
 ("Share of properties built before 1920",[old[k]/pa[k] for k in Z]),
]
print(f"ZIPs: {len(Z)}  electrical incidents 2023–24: {int(sum(elec[k] for k in Z))}  wiring-only: {int(sum(wire[k] for k in Z))}  rodent reports: {int(sum(rod[k] for k in Z))}\n")
print("Spearman ρ with rodent reports per 1,000 properties (2023–24)")
for name,v in rows: print(f"  {sp(R,v):+.2f}  {name}")
E_=[per(elec,k) for k in Z]; A=[per(allf,k) for k in Z]; O=[old[k]/pa[k] for k in Z]
print("\nPartial ρ (electrical vs rodent):")
print(f"  {partial(R,E_,A):+.2f}  controlling for all BFD incidents per 1,000")
print(f"  {partial(R,E_,O):+.2f}  controlling for pre-1920 share")
# share vs share: removes density and reporting volume entirely
RS=[rod[k]/t311[k] for k in Z]; ES=[elec[k]/allf[k] for k in Z]
print(f"  {sp(RS,ES):+.2f}  rodent share of 311 vs electrical share of BFD calls (no denominators)")
# 2026 replication with new BFD codes
Z6=[k for k in Z if a26[k]>0 and r26[k]>0]
print(f"\n2026 check (new BFD codes, Jan–Oct, {len(Z6)} ZIPs, {int(sum(e26[k] for k in Z6))} electrical hazard calls):")
print(f"  {sp([per(r26,k) for k in Z6],[per(e26,k) for k in Z6]):+.2f}  per 1,000 properties")
print(f"  {partial([per(r26,k) for k in Z6],[per(e26,k) for k in Z6],[per(a26,k) for k in Z6]):+.2f}  controlling for all BFD incidents")
print("\nTop ZIPs by rodent rate:")
for k in sorted(Z,key=lambda k:-per(rod,k))[:8]:
    print(f"  {k}  rodent {per(rod,k):6.1f}  electrical {per(elec,k):5.1f}  all BFD {per(allf,k):6.0f}  pre-1920 {old[k]/pa[k]:.0%}")
med=sorted(per(elec,k) for k in Z)[len(Z)//2]
print(f"  median electrical rate: {med:.1f}")
