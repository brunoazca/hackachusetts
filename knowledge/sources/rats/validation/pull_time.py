import json
from lib import *
out={}
pts=[]
for y,t in [("2023",Y23),("2024",Y24),("2025",Y25),("2026",Y26)]:
    try: rs=sql(f'SELECT open_dt, latitude, longitude, location_zipcode z FROM "{t}" WHERE type=\'Rodent Activity\'')
    except RuntimeError as e: print(y,e); continue
    print(y,len(rs)); pts+=rs
out["rod"]=pts
it=[]
for y,t in [("2023",Y23),("2024",Y24),("2025",Y25)]:
    rs=sql(f'SELECT open_dt FROM "{t}" WHERE type=\'Improper Storage of Trash (Barrels)\''); it+=rs
out["improper"]=it; print("improper",len(it))
P="6ddcd912-32a0-43df-9908-63574f8c7e77"
out["demo"]=sql(f"SELECT issued_date d, y_latitude la, x_longitude lo FROM \"{P}\" WHERE worktype IN ('RAZE','EXTDEM') AND issued_date >= '2023-01-01'")
out["roof"]=sql(f"SELECT issued_date d, y_latitude la, x_longitude lo FROM \"{P}\" WHERE worktype = 'ROOF' AND issued_date >= '2023-01-01' AND issued_date < '2024-07-01'")
print("demo",len(out["demo"]),"roof",len(out["roof"]))
out["wx"]=getjson("https://data.rcc-acis.org/StnData?sid=USW00014739&sdate=2022-12-01&edate=2026-10-23&elems=pcpn,maxt,mint,snow&output=json")
print("wx days",len(out["wx"]["data"]))
games=[]
for s in (2023,2024,2025,2026):
    d=getjson(f"https://statsapi.mlb.com/api/v1/schedule?sportId=1&teamId=111&season={s}&gameType=R")
    for day in d.get("dates",[]):
        for g in day["games"]:
            if g["teams"]["home"]["team"]["id"]==111: games.append(day["date"])
out["fenway"]=sorted(set(games)); print("fenway home dates",len(out["fenway"]))
json.dump(out,open("time.json","w"))
