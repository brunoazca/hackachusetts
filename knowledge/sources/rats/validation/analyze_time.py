# Time-based tests: rain, temperature, snow, demolitions (before/after vs roof-permit control), Sept 1 move-out, Fenway games, holiday weeks.
import json, math, random, numpy as np
from datetime import date, timedelta, datetime
from collections import defaultdict, Counter
T=json.load(open("time.json"))
D=lambda s: datetime.strptime(str(s)[:10],"%Y-%m-%d").date()
rod=[(D(r["open_dt"]),r["latitude"],r["longitude"],str(r["z"] or "")[:5].zfill(5)) for r in T["rod"] if r["open_dt"]]
start,end=date(2023,1,1),date(2026,10,22)
days=[start+timedelta(i) for i in range((end-start).days+1)]
cnt=Counter(d for d,*_ in rod)
y=np.array([cnt[d] for d in days],float)
# expected = mean for same weekday within same month-year (removes season, trend, weekday)
grp=defaultdict(list)
for i,d in enumerate(days): grp[(d.year,d.month,d.weekday())].append(i)
exp=np.zeros(len(days))
for g,ix in grp.items(): exp[ix]=y[ix].mean()
ratio=y.sum()/exp.sum()
wx={D(r[0]):r for r in T["wx"]["data"]}
num=lambda v: 0.001 if v=="T" else (float(v) if v not in ("M","",None) else float("nan"))
rain=np.array([num(wx[d][1]) if d in wx else np.nan for d in days]); tmax=np.array([num(wx[d][2]) if d in wx else np.nan for d in days])
snow=np.array([num(wx[d][4]) if d in wx else np.nan for d in days])
print(f"Daily rodent reports {start}..{end}: {int(y.sum())}, mean {y.mean():.1f}/day")
# Rain: reports in days +1..+7 after a heavy-rain day vs expected
def window_effect(event_idx, lo, hi, label):
    o=e=0; used=0
    for i in event_idx:
        ix=[j for j in range(i+lo,i+hi+1) if 0<=j<len(days)]
        if not ix: continue
        o+=y[ix].sum(); e+=exp[ix].sum(); used+=1
    # permutation: random days in same months
    months=defaultdict(list)
    for i,d in enumerate(days): months[(d.year,d.month)].append(i)
    sims=[]
    rng=random.Random(1)
    for _ in range(500):
        so=se=0
        for i in event_idx:
            j=rng.choice(months[(days[i].year,days[i].month)])
            ix=[k for k in range(j+lo,j+hi+1) if 0<=k<len(days)]
            so+=y[ix].sum(); se+=exp[ix].sum()
        sims.append(so/se)
    obs=o/e; p=np.mean([s>=obs for s in sims])
    print(f"  {label:52s} events {used:3d}  observed/expected {obs:.3f}  (random same-month days: {np.mean(sims):.3f}, one-sided p={p:.3f})")
    return obs,p
print("\nRAIN (Logan Airport daily precipitation)")
heavy=[i for i in range(len(days)) if rain[i]>=1.0]
mod=[i for i in range(len(days)) if 0.5<=rain[i]<1.0]
window_effect(heavy,1,7,"days 1-7 after >=1.0 in rain")
window_effect(heavy,8,14,"days 8-14 after >=1.0 in rain")
window_effect(mod,1,7,"days 1-7 after 0.5-1.0 in rain")
# weekly correlation of residual with prior-week rain
wk=defaultdict(lambda:[0,0,0])
for i,d in enumerate(days):
    k=(d-start).days//7; wk[k][0]+=y[i]; wk[k][1]+=exp[i]; wk[k][2]+=0 if math.isnan(rain[i]) else rain[i]
ks=sorted(wk)[1:-1]
res=[wk[k][0]/wk[k][1] for k in ks]; prev=[wk[k-1][2] for k in ks]; same=[wk[k][2] for k in ks]
print(f"  weekly residual vs same-week rain r={np.corrcoef(res,same)[0,1]:+.2f}, vs previous-week rain r={np.corrcoef(res,prev)[0,1]:+.2f} ({len(ks)} weeks)")
print("\nTEMPERATURE / SEASON")
mon=defaultdict(lambda:[0,[],0])
for i,d in enumerate(days):
    m=(d.year,d.month); mon[m][0]+=y[i]; mon[m][2]+=1
    if not math.isnan(tmax[i]): mon[m][1].append(tmax[i])
ms=[m for m in sorted(mon) if mon[m][2]>=28]
mc=[mon[m][0]/mon[m][2] for m in ms]; mt=[np.mean(mon[m][1]) for m in ms]
print(f"  monthly reports/day vs mean daily high: r={np.corrcoef(mc,mt)[0,1]:+.2f} ({len(ms)} months)")
lag=[np.mean(mon[ms[i-1]][1]) for i in range(1,len(ms))]
print(f"  vs previous month's high: r={np.corrcoef(mc[1:],lag)[0,1]:+.2f}")
byM=defaultdict(list)
for m,c in zip(ms,mc): byM[m[1]].append(c)
print("  reports/day by calendar month: "+"  ".join(f"{k}:{np.mean(v):.1f}" for k,v in sorted(byM.items())))
# hot-day effect beyond season: daily residual vs tmax anomaly
anom=np.array([tmax[i]-np.nanmean([tmax[j] for j in grp[(days[i].year,days[i].month,days[i].weekday())]]) for i in range(len(days))])
okk=~np.isnan(anom)
print(f"  day-level: residual vs temp anomaly (same month), next 3 days: r={np.corrcoef(anom[okk][:-3],(y/np.maximum(exp,0.1))[3:][okk[:-3]])[0,1]:+.2f}")
winters=[]
for yr in (2023,2024,2025,2026):
    w=[np.nanmean([tmax[i] for i,d in enumerate(days) if (d.year==yr and d.month in (1,2)) ])]
    spring=sum(y[i] for i,d in enumerate(days) if d.year==yr and d.month in (4,5,6))
    winters.append((yr,w[0],spring))
print("  winter (Jan-Feb mean high) vs Apr-Jun reports: "+"; ".join(f"{a}: {b:.1f}F -> {int(c)}" for a,b,c in winters)+"  (only 4 winters: not testable)")
print("\nSNOW")
big=[i for i in range(len(days)) if snow[i]>=4]
window_effect(big,7,21,"days 7-21 after >=4 in snowfall (melt)")
print("\nDEMOLITIONS (reports within 200 m, 90 days before vs after; roof permits as control)")
from math import radians, cos
pts=[(d,float(la),float(lo)) for d,la,lo,z in rod if la and lo]
grid=defaultdict(list)
for d,la,lo in pts: grid[(int(la*500),int(lo*500))].append((d,la,lo))
def near(la,lo,r=200):
    out=[]
    for a in range(int(la*500)-1,int(la*500)+2):
        for b in range(int(lo*500)-1,int(lo*500)+2):
            for d,pla,plo in grid[(a,b)]:
                dx=(plo-lo)*111320*cos(radians(la)); dy=(pla-la)*110540
                if dx*dx+dy*dy<=r*r: out.append(d)
    return out
def ba(rows,label):
    B=A=n=0; per=[]
    for r in rows:
        try: d=D(r["d"]); la=float(r["la"]); lo=float(r["lo"])
        except: continue
        if not (42.2<la<42.42) or d<date(2023,4,1) or d>end-timedelta(90): continue
        ds=near(la,lo); b=sum(1 for x in ds if d-timedelta(90)<=x<d); a=sum(1 for x in ds if d<x<=d+timedelta(90))
        B+=b;A+=a;n+=1; per.append(a-b)
    print(f"  {label:20s} sites {n:4d}  before {B:5d}  after {A:5d}  after/before {A/max(B,1):.2f}")
    return A/max(B,1),n,per
rd,nd,pd=ba(T["demo"],"demolitions")
rr,nr,pr=ba(T["roof"],"roof permits")
print(f"  difference-in-differences ratio: {rd/rr:.2f}  (1.00 = no demolition effect)")
# bootstrap
rng=random.Random(2); sims=[]
for _ in range(1000):
    sd=[rng.choice(pd) for _ in pd]; sr=[rng.choice(pr) for _ in pr]
    sims.append(np.mean(sd)-np.mean(sr))
print(f"  mean change per site: demolition {np.mean(pd):+.2f}, roof {np.mean(pr):+.2f}; 95% CI of difference [{np.percentile(sims,2.5):+.2f}, {np.percentile(sims,97.5):+.2f}]")
print("\nSEPT 1 MOVE-OUT (student ZIPs 02134 02135 02215 02115 02120 vs rest)")
stu={"02134","02135","02215","02115","02120"}
for yr in (2023,2024,2025):
    def c(zs,inside,m): return sum(1 for d,la,lo,z in rod if d.year==yr and d.month==m and ((z in zs)==inside))
    s8,s9,o8,o9=c(stu,True,8),c(stu,True,9),c(stu,False,8),c(stu,False,9)
    s7,o7=c(stu,True,7),c(stu,False,7)
    print(f"  {yr}: student ZIPs Jul {s7} Aug {s8} Sep {s9} (Sep/Jul {s9/max(s7,1):.2f}) | rest Jul {o7} Aug {o8} Sep {o9} (Sep/Jul {o9/max(o7,1):.2f})")
# 30-day windows after Sept 1 vs before
def win(inside,yr,a,b): return sum(1 for d,la,lo,z in rod if (z in stu)==inside and date(yr,9,1)+timedelta(a)<=d<date(yr,9,1)+timedelta(b))
for yr in (2023,2024,2025):
    print(f"  {yr}: 3 weeks after Sept 1 / 3 weeks before: student {win(True,yr,0,21)/max(win(True,yr,-21,0),1):.2f}, rest {win(False,yr,0,21)/max(win(False,yr,-21,0),1):.2f}")
print("\nFENWAY HOME GAMES (reports within 1 km of Fenway Park, Apr-Sep)")
F=(42.3467,-71.0972)
fen=Counter(d for d,la,lo,z in rod if la and lo and ((float(la)-F[0])*110540)**2+((float(lo)-F[1])*111320*cos(radians(F[0])))**2<=1000**2)
games=set(D(g) for g in T["fenway"])
rows=[]
for i,d in enumerate(days):
    if d.month in range(4,10):
        g7=sum(1 for k in range(1,8) if d-timedelta(k) in games)
        rows.append((g7, fen[d], y[i]))
g=np.array([r[0] for r in rows]); f=np.array([r[1] for r in rows]); c=np.array([r[2] for r in rows])
hi=g>=5; lo_=g<=1
print(f"  days {len(rows)}; Fenway-area reports {int(f.sum())} ({f.sum()/c.sum():.1%} of city)")
print(f"  share of city reports in Fenway area: after busy home week (>=5 games prior 7d) {f[hi].sum()/c[hi].sum():.2%} vs quiet week (<=1) {f[lo_].sum()/c[lo_].sum():.2%}")
print("\nHOLIDAY WEEKS (Boston delays pickup one day after weekday holidays)")
hol=[]
import calendar
for yr in (2023,2024,2025,2026):
    fixed=[date(yr,1,1),date(yr,7,4),date(yr,12,25)]
    def nth(m,wd,n):
        d=date(yr,m,1); c=0
        while True:
            if d.weekday()==wd:
                c+=1
                if c==n: return d
            d+=timedelta(1)
    def last(m,wd):
        d=date(yr,m,calendar.monthrange(yr,m)[1])
        while d.weekday()!=wd: d-=timedelta(1)
        return d
    hol+= [h for h in fixed+[nth(1,0,3),nth(2,0,3),last(5,0),nth(9,0,1),nth(11,3,4)] if h.weekday()<5]
hol=[h for h in hol if start<=h<=end-timedelta(14)]
hidx=[days.index(h) for h in hol]
window_effect(hidx,0,13,"rodent: holiday day to +13 days")
imp=Counter(D(r["open_dt"]) for r in T["improper"] if r["open_dt"])
yi=np.array([imp[d] for d in days],float)
o=e=0
for i in hidx:
    for j in range(i,i+7):
        if days[j].year<=2025:
            o+=yi[j]
            same=[k for k in grp[(days[j].year,days[j].month,days[j].weekday())]]
            e+=yi[same].mean()
print(f"  improper-trash reports in holiday week vs same weekday/month mean: {o/e:.3f}")
