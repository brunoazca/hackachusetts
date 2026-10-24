# EPSG:2249 (NAD83 / Massachusetts Mainland, US ft) -> lat/lon. Lambert Conformal Conic 2SP inverse.
import math
a=6378137.0; f=1/298.257222101; e=math.sqrt(2*f-f*f)
p1,p2,p0,l0=map(math.radians,(42.68333333333334,41.71666666666667,41.0,-71.5)); FE,FN=200000.0,750000.0
m=lambda p: math.cos(p)/math.sqrt(1-(e*math.sin(p))**2)
t=lambda p: math.tan(math.pi/4-p/2)/((1-e*math.sin(p))/(1+e*math.sin(p)))**(e/2)
n=(math.log(m(p1))-math.log(m(p2)))/(math.log(t(p1))-math.log(t(p2))); F=m(p1)/(n*t(p1)**n); r0=a*F*t(p0)**n
def sp2ll(x_ft,y_ft):
    x=float(x_ft)*0.3048006096-FE; y=r0-(float(y_ft)*0.3048006096-FN)
    r=math.copysign(math.hypot(x,y),n); tt=(r/(a*F))**(1/n); th=math.atan2(x,y)
    p=math.pi/2-2*math.atan(tt)
    for _ in range(8): p=math.pi/2-2*math.atan(tt*((1-e*math.sin(p))/(1+e*math.sin(p)))**(e/2))
    return math.degrees(p), math.degrees(th/n+l0)
if __name__=="__main__": print(sp2ll(780726.4250252247,2963447.8978366405))
