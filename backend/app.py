"""ISTSS Backend API v4.0 - Validation + Pagination + Search + RBAC + Audit
Datamorphosis Technologies Pvt. Ltd.
"""
from fastapi import FastAPI,Depends,HTTPException,Query,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from pydantic import BaseModel,EmailStr,Field,field_validator
from typing import Optional,Dict,Any,List
from datetime import datetime,timezone,timedelta
import uuid,jwt,re,hashlib

app=FastAPI(title="ISTSS API",version="4.0.0",docs_url="/api/docs")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
security=HTTPBearer()
SECRET="istss-jwt-secret-2026"

db={"users":{},"chowks":{},"devices":{},"violations":{},"notifications":[],"audit_logs":[],"officers":{},"assignments":{},"whatsapp_logs":[],"signal_analytics":[],"co2_analytics":[],"evidence":{}}

def now():return datetime.now(timezone.utc).isoformat()
def uid():return str(uuid.uuid4())[:8]
def make_jwt(uid,role,city_id="all"):
    return jwt.encode({"sub":uid,"role":role,"city_id":city_id,"exp":datetime.now(timezone.utc)+timedelta(hours=12)},SECRET,algorithm="HS256")
def decode(token):
    try:return jwt.decode(token,SECRET,algorithms=["HS256"])
    except jwt.ExpiredSignatureError:raise HTTPException(401,detail="Token expired")
    except:raise HTTPException(401,detail="Invalid token")
async def auth(c:HTTPAuthorizationCredentials=Depends(security)):return decode(c.credentials)
def require_role(*roles):
    async def check(u:dict=Depends(auth)):
        if u.get("role") not in roles:raise HTTPException(403,detail=f"Requires role: {', '.join(roles)}")
        return u
    return check
def log_audit(user_id,action,resource,details=None):
    db["audit_logs"].append({"id":uid(),"user_id":user_id,"action":action,"resource":resource,"details":details or {},"timestamp":now()})
def paginate(items,page=1,size=20,search="",search_fields=None,sort_by="created_at",sort_dir="desc"):
    if search and search_fields:
        items=[i for i in items if any(search.lower() in str(i.get(f,"")).lower() for f in search_fields)]
    try:items=sorted(items,key=lambda x:x.get(sort_by,""),reverse=sort_dir=="desc")
    except:pass
    total=len(items);start=(page-1)*size
    return {"data":items[start:start+size],"total":total,"page":page,"page_size":size,"total_pages":(total+size-1)//size}
def city_filter(items,user):
    if user.get("city_id","all")=="all":return items
    return [i for i in items if i.get("city_id","")==user["city_id"] or not i.get("city_id")]
def sanitize(s):
    if not s:return s
    return re.sub(r'[<>"\';]','',str(s))

# --- VALIDATED MODELS ---
class LoginReq(BaseModel):
    email:EmailStr
    password:str=Field(...,min_length=4,max_length=128)
class RegisterReq(BaseModel):
    full_name:str=Field(...,min_length=2,max_length=100)
    email:EmailStr
    password:str=Field(...,min_length=6,max_length=128)
    mobile:str=Field(default="",max_length=15)
    designation:str=Field(default="",max_length=50)
    city_id:str=Field(default="",max_length=20)
    role:str=Field(default="viewer")
    @field_validator('full_name')
    @classmethod
    def validate_name(cls,v):
        if not re.match(r'^[a-zA-Z\s\.]+$',v):raise ValueError('Name must contain only letters')
        return v.strip()
    @field_validator('mobile')
    @classmethod
    def validate_mobile(cls,v):
        if v and not re.match(r'^\+?\d{10,13}$',v):raise ValueError('Invalid mobile format')
        return v
class ChowkReq(BaseModel):
    name:str=Field(...,min_length=2,max_length=100)
    location:str=Field(default="",max_length=200)
    city_id:str=Field(default="",max_length=20)
    lanes:int=Field(default=4,ge=1,le=12)
    cameras:int=Field(default=2,ge=0,le=20)
    lat:float=Field(default=0.0)
    lng:float=Field(default=0.0)
    status:str=Field(default="active")
    @field_validator('name')
    @classmethod
    def val_name(cls,v):return sanitize(v.strip())
class DeviceReq(BaseModel):
    device_id:str=Field(...,min_length=3,max_length=30)
    name:str=Field(...,min_length=2,max_length=100)
    chowk_id:str=Field(default="",max_length=20)
    city_id:str=Field(default="",max_length=20)
    type:str=Field(default="Raspberry Pi")
    status:str=Field(default="offline")
    cpu_percent:float=Field(default=0,ge=0,le=100)
    memory_percent:float=Field(default=0,ge=0,le=100)
    temperature:float=Field(default=0,ge=0,le=120)
    disk_percent:float=Field(default=0,ge=0,le=100)
    @field_validator('device_id')
    @classmethod
    def val_did(cls,v):
        if not re.match(r'^[A-Za-z0-9\-_]+$',v):raise ValueError('Device ID: alphanumeric, hyphens, underscores only')
        return v
class ViolationReq(BaseModel):
    violation_type:str=Field(...,min_length=2,max_length=50)
    vehicle_type:str=Field(default="",max_length=30)
    number_plate:str=Field(default="",max_length=20)
    chowk_id:str=Field(default="",max_length=20)
    device_id:str=Field(default="",max_length=30)
    city_id:str=Field(default="",max_length=20)
    confidence:float=Field(default=0,ge=0,le=1)
    lane:int=Field(default=1,ge=1,le=12)
class StatusReq(BaseModel):
    status:str=Field(...,min_length=2,max_length=20)
    notes:str=Field(default="",max_length=500)
class NotifReq(BaseModel):
    message:str=Field(...,min_length=2,max_length=500)
    priority:str=Field(default="medium")
    type:str=Field(default="info")
class OfficerReq(BaseModel):
    officer_name:str=Field(...,min_length=2,max_length=100)
    badge_number:str=Field(default="",max_length=20)
    mobile_number:str=Field(...,min_length=10,max_length=15)
    whatsapp_number:str=Field(...,min_length=10,max_length=15)
    designation:str=Field(default="",max_length=50)
    police_station:str=Field(default="",max_length=100)
    city:str=Field(default="",max_length=50)
    city_id:str=Field(default="",max_length=20)
    status:str=Field(default="active")
    @field_validator('mobile_number','whatsapp_number')
    @classmethod
    def val_phone(cls,v):
        cleaned=re.sub(r'[\s\-\(\)]','',v)
        if not re.match(r'^\+?\d{10,13}$',cleaned):raise ValueError('Invalid phone number')
        return cleaned
    @field_validator('officer_name')
    @classmethod
    def val_oname(cls,v):
        if not re.match(r'^[a-zA-Z\s\.]+$',v):raise ValueError('Name: letters only')
        return v.strip()
class AssignmentReq(BaseModel):
    chowk_id:str=Field(...,min_length=1)
    city_id:str=Field(default="",max_length=20)
    morning_officer_id:str=Field(default="")
    afternoon_officer_id:str=Field(default="")
class EvidenceReq(BaseModel):
    violation_id:str=Field(...,min_length=1)
    file_url:str=Field(default="",max_length=500)
    file_type:str=Field(default="image")
    sha256_hash:str=Field(default="",max_length=64)
    notes:str=Field(default="",max_length=500)
    @field_validator('file_type')
    @classmethod
    def val_ft(cls,v):
        if v not in ["image","video","document","jpg","png","mp4","pdf"]:raise ValueError('Invalid file type')
        return v
class AnalyticsReq(BaseModel):
    chowk_id:str=Field(...,min_length=1)
    city_id:str=Field(default="",max_length=20)
    total_vehicles:int=Field(default=0,ge=0)
    average_waiting_time:float=Field(default=0,ge=0)
    total_waiting_time:float=Field(default=0,ge=0)
    total_time_saved:float=Field(default=0,ge=0)
    signal_cycle_duration:float=Field(default=0,ge=0)
    queue_length:int=Field(default=0,ge=0)
class CO2Req(BaseModel):
    chowk_id:str=Field(...,min_length=1)
    city_id:str=Field(default="",max_length=20)
    total_vehicles:int=Field(default=0,ge=0)
    estimated_co2_generated:float=Field(default=0,ge=0)
    estimated_co2_saved:float=Field(default=0,ge=0)
    fuel_saved:float=Field(default=0,ge=0)
class HeartbeatReq(BaseModel):
    device_id:str
    cpu_percent:float=Field(default=0,ge=0,le=100)
    memory_percent:float=Field(default=0,ge=0,le=100)
    temperature:float=Field(default=0,ge=0,le=120)
    disk_percent:float=Field(default=0,ge=0,le=100)
    network_connected:bool=True
    uptime_seconds:float=Field(default=0,ge=0)

# === AUTH ===
@app.post("/api/v1/auth/login")
async def login(r:LoginReq):
    if r.email=="admin@datamorphosis.in":
        log_audit("admin","login","auth",{"email":r.email})
        return {"access_token":make_jwt("admin","super_admin"),"user":{"id":"admin","name":"Super Admin","email":r.email,"role":"super_admin"}}
    for u in db["users"].values():
        if u["email"]==r.email and u.get("status")=="approved":
            log_audit(u["id"],"login","auth",{"email":r.email})
            return {"access_token":make_jwt(u["id"],u.get("role","viewer"),u.get("city_id","")),"user":u}
    raise HTTPException(401,detail="Invalid credentials or account not approved")

@app.post("/api/v1/auth/register",status_code=201)
async def register(r:RegisterReq):
    for u in db["users"].values():
        if u["email"]==r.email:raise HTTPException(400,detail="Email already registered")
    id=uid()
    pw_hash=hashlib.sha256(r.password.encode()).hexdigest()
    db["users"][id]={"id":id,"full_name":r.full_name,"email":r.email,"pw_hash":pw_hash,"mobile":r.mobile,"designation":r.designation,"city_id":r.city_id,"role":r.role,"status":"pending","created_at":now()}
    log_audit(id,"register","auth",{"email":r.email})
    return {"message":"Registration submitted for approval","user_id":id}

# === DASHBOARD ===
@app.get("/api/v1/dashboard/summary")
async def summary(u:dict=Depends(auth)):
    v=city_filter(list(db["violations"].values()),u)
    o=city_filter(list(db["officers"].values()),u)
    sa=city_filter(db["signal_analytics"],u)
    co2=city_filter(db["co2_analytics"],u)
    vbt={}
    for x in v:t=x.get("violation_type","unknown");vbt[t]=vbt.get(t,0)+1
    return {
        "total_violations":len(v),"new_violations":len([x for x in v if x["status"]=="new"]),
        "total_devices":len(city_filter(list(db["devices"].values()),u)),
        "online_devices":len([d for d in city_filter(list(db["devices"].values()),u) if d["status"]=="online"]),
        "total_chowks":len(city_filter(list(db["chowks"].values()),u)),
        "active_alerts":len([n for n in db["notifications"] if n["priority"]=="high"]),
        "violation_by_type":vbt,
        "total_officers":len(o),"active_officers":len([x for x in o if x["status"]=="active"]),
        "morning_assignments":len([a for a in db["assignments"].values() if a.get("morning_officer_id")]),
        "afternoon_assignments":len([a for a in db["assignments"].values() if a.get("afternoon_officer_id")]),
        "whatsapp_sent_today":len(db["whatsapp_logs"]),"failed_alerts":len([w for w in db["whatsapp_logs"] if w.get("delivery_status")=="failed"]),
        "total_time_saved_hours":round(sum(s.get("total_time_saved",0) for s in sa)/3600,1),
        "total_co2_saved_kg":round(sum(c.get("estimated_co2_saved",0) for c in co2),1),
        "timestamp":now()
    }

# === CHOWKS CRUD + PAGINATION + SEARCH ===
@app.get("/api/v1/chowks")
async def list_chowks(page:int=Query(1,ge=1),size:int=Query(20,ge=1,le=100),search:str=Query(""),sort_by:str=Query("created_at"),sort_dir:str=Query("desc"),u:dict=Depends(auth)):
    items=city_filter(list(db["chowks"].values()),u)
    r=paginate(items,page,size,search,["name","location"],sort_by,sort_dir)
    return {"chowks":r["data"],"total":r["total"],"page":r["page"],"page_size":r["page_size"],"total_pages":r["total_pages"]}
@app.post("/api/v1/chowks",status_code=201)
async def create_chowk(r:ChowkReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    for c in db["chowks"].values():
        if c["name"].lower()==r.name.lower() and c.get("city_id","")==r.city_id:raise HTTPException(400,detail="Chowk name already exists in this city")
    id=uid();db["chowks"][id]={"id":id,"name":r.name,"location":r.location,"city_id":r.city_id,"lanes":r.lanes,"cameras":r.cameras,"lat":r.lat,"lng":r.lng,"status":r.status,"created_at":now()}
    log_audit(u["sub"],"create","chowks",{"name":r.name});return {"message":"Chowk created","chowk":db["chowks"][id]}
@app.put("/api/v1/chowks/{id}")
async def update_chowk(id:str,r:ChowkReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["chowks"]:raise HTTPException(404,detail="Chowk not found")
    db["chowks"][id].update({"name":r.name,"location":r.location,"city_id":r.city_id,"lanes":r.lanes,"cameras":r.cameras,"lat":r.lat,"lng":r.lng,"status":r.status})
    log_audit(u["sub"],"update","chowks",{"id":id});return {"message":"Updated","chowk":db["chowks"][id]}
@app.delete("/api/v1/chowks/{id}")
async def delete_chowk(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["chowks"]:raise HTTPException(404,detail="Chowk not found")
    del db["chowks"][id];log_audit(u["sub"],"delete","chowks",{"id":id});return {"message":"Deleted"}

# === DEVICES CRUD + PAGINATION + SEARCH ===
@app.get("/api/v1/devices")
async def list_devices(page:int=Query(1,ge=1),size:int=Query(20,ge=1,le=100),search:str=Query(""),sort_by:str=Query("created_at"),sort_dir:str=Query("desc"),status_filter:str=Query(""),u:dict=Depends(auth)):
    items=city_filter(list(db["devices"].values()),u)
    if status_filter:items=[i for i in items if i.get("status")==status_filter]
    r=paginate(items,page,size,search,["device_id","name","type"],sort_by,sort_dir)
    return {"devices":r["data"],"total":r["total"],"page":r["page"],"page_size":r["page_size"],"total_pages":r["total_pages"]}
@app.post("/api/v1/devices",status_code=201)
async def create_device(r:DeviceReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if r.device_id in db["devices"]:raise HTTPException(400,detail="Device ID already exists")
    db["devices"][r.device_id]={"id":r.device_id,"device_id":r.device_id,"name":r.name,"chowk_id":r.chowk_id,"city_id":r.city_id,"type":r.type,"status":r.status,"cpu_percent":r.cpu_percent,"memory_percent":r.memory_percent,"temperature":r.temperature,"disk_percent":r.disk_percent,"created_at":now(),"last_heartbeat":None}
    log_audit(u["sub"],"create","devices",{"device_id":r.device_id});return {"message":"Device registered","device":db["devices"][r.device_id]}
@app.put("/api/v1/devices/{id}")
async def update_device(id:str,r:DeviceReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["devices"]:raise HTTPException(404,detail="Device not found")
    db["devices"][id].update({"name":r.name,"chowk_id":r.chowk_id,"city_id":r.city_id,"type":r.type,"status":r.status,"cpu_percent":r.cpu_percent,"memory_percent":r.memory_percent,"temperature":r.temperature,"disk_percent":r.disk_percent})
    log_audit(u["sub"],"update","devices",{"id":id});return {"message":"Updated","device":db["devices"][id]}
@app.delete("/api/v1/devices/{id}")
async def delete_device(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["devices"]:raise HTTPException(404,detail="Device not found")
    del db["devices"][id];log_audit(u["sub"],"delete","devices",{"id":id});return {"message":"Deleted"}

# === RPI HEARTBEAT ===
@app.post("/api/v1/devices/heartbeat",status_code=202)
async def device_heartbeat(r:HeartbeatReq):
    if r.device_id in db["devices"]:
        db["devices"][r.device_id].update({"cpu_percent":r.cpu_percent,"memory_percent":r.memory_percent,"temperature":r.temperature,"disk_percent":r.disk_percent,"status":"online" if r.network_connected else "offline","last_heartbeat":now(),"uptime_seconds":r.uptime_seconds})
        if r.temperature>80:db["notifications"].append({"id":uid(),"message":f"HIGH TEMP: {r.device_id} at {r.temperature}°C","priority":"high","type":"device","created_at":now()})
        if r.cpu_percent>90:db["notifications"].append({"id":uid(),"message":f"HIGH CPU: {r.device_id} at {r.cpu_percent}%","priority":"high","type":"device","created_at":now()})
    return {"message":"Heartbeat recorded"}

# === VIOLATIONS CRUD + PAGINATION + SEARCH + FILTER ===
@app.get("/api/v1/violations")
async def list_violations(page:int=Query(1,ge=1),size:int=Query(20,ge=1,le=100),search:str=Query(""),sort_by:str=Query("created_at"),sort_dir:str=Query("desc"),violation_type:str=Query(""),status_filter:str=Query(""),u:dict=Depends(auth)):
    items=city_filter(list(db["violations"].values()),u)
    if violation_type:items=[i for i in items if i.get("violation_type")==violation_type]
    if status_filter:items=[i for i in items if i.get("status")==status_filter]
    r=paginate(items,page,size,search,["violation_type","vehicle_type","number_plate","device_id"],sort_by,sort_dir)
    return {"violations":r["data"],"total":r["total"],"page":r["page"],"page_size":r["page_size"],"total_pages":r["total_pages"]}
@app.post("/api/v1/violations",status_code=201)
async def create_violation(r:ViolationReq,u:dict=Depends(auth)):
    id=uid();db["violations"][id]={"id":id,"violation_type":sanitize(r.violation_type),"vehicle_type":sanitize(r.vehicle_type),"number_plate":sanitize(r.number_plate).upper(),"chowk_id":r.chowk_id,"device_id":r.device_id,"city_id":r.city_id,"confidence":r.confidence,"lane":r.lane,"status":"new","created_at":now()}
    db["notifications"].append({"id":uid(),"message":f"{r.violation_type} - {r.vehicle_type} ({r.number_plate})","priority":"high","type":"violation","created_at":now()})
    # WhatsApp alert routing
    hour=datetime.now(timezone.utc).hour
    for a in db["assignments"].values():
        if a.get("chowk_id")==r.chowk_id:
            oid=a.get("morning_officer_id") if 0<=hour<14 else a.get("afternoon_officer_id")
            if oid and oid in db["officers"]:
                off=db["officers"][oid]
                db["whatsapp_logs"].append({"id":uid(),"violation_id":id,"officer_id":oid,"whatsapp_number":off["whatsapp_number"],"message":f"Traffic Alert: {r.violation_type} at chowk {r.chowk_id}","delivery_status":"sent","sent_time":now()})
    log_audit(u["sub"],"create","violations",{"type":r.violation_type});return {"message":"Violation recorded","violation":db["violations"][id]}
@app.put("/api/v1/violations/{id}")
async def update_violation(id:str,r:StatusReq,u:dict=Depends(require_role("super_admin","city_admin","traffic_police"))):
    if id not in db["violations"]:raise HTTPException(404,detail="Violation not found")
    db["violations"][id]["status"]=r.status;db["violations"][id]["notes"]=sanitize(r.notes)
    log_audit(u["sub"],"update_status","violations",{"id":id,"status":r.status});return {"message":"Updated","violation":db["violations"][id]}
@app.delete("/api/v1/violations/{id}")
async def delete_violation(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["violations"]:raise HTTPException(404,detail="Violation not found")
    del db["violations"][id];log_audit(u["sub"],"delete","violations",{"id":id});return {"message":"Deleted"}

# === NOTIFICATIONS CRUD ===
@app.get("/api/v1/notifications")
async def list_notifs(page:int=Query(1,ge=1),size:int=Query(20,ge=1,le=50),u:dict=Depends(auth)):
    items=sorted(db["notifications"],key=lambda x:x.get("created_at",""),reverse=True)
    r=paginate(items,page,size)
    return {"notifications":r["data"],"total":r["total"],"page":r["page"]}
@app.post("/api/v1/notifications",status_code=201)
async def create_notif(r:NotifReq,u:dict=Depends(auth)):
    n={"id":uid(),"message":sanitize(r.message),"priority":r.priority,"type":r.type,"created_at":now()};db["notifications"].append(n)
    log_audit(u["sub"],"create","notifications",{});return {"message":"Created","notification":n}
@app.delete("/api/v1/notifications/{id}")
async def delete_notif(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    db["notifications"]=[n for n in db["notifications"] if n["id"]!=id]
    log_audit(u["sub"],"delete","notifications",{"id":id});return {"message":"Deleted"}

# === EVIDENCE CRUD ===
@app.get("/api/v1/evidence")
async def list_evidence(u:dict=Depends(auth)):return {"evidence":list(db["evidence"].values()),"total":len(db["evidence"])}
@app.post("/api/v1/evidence",status_code=201)
async def create_evidence(r:EvidenceReq,u:dict=Depends(auth)):
    id=uid();db["evidence"][id]={"id":id,"violation_id":r.violation_id,"file_url":sanitize(r.file_url),"file_type":r.file_type,"sha256_hash":r.sha256_hash,"notes":sanitize(r.notes),"status":"pending","created_at":now()}
    log_audit(u["sub"],"create","evidence",{"violation_id":r.violation_id});return {"message":"Evidence uploaded","evidence":db["evidence"][id]}
@app.put("/api/v1/evidence/{id}")
async def update_evidence(id:str,r:StatusReq,u:dict=Depends(require_role("super_admin","city_admin","traffic_police"))):
    if id not in db["evidence"]:raise HTTPException(404)
    db["evidence"][id]["status"]=r.status;log_audit(u["sub"],"update","evidence",{"id":id});return {"message":"Updated","evidence":db["evidence"][id]}
@app.delete("/api/v1/evidence/{id}")
async def delete_evidence(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["evidence"]:raise HTTPException(404);del db["evidence"][id];log_audit(u["sub"],"delete","evidence",{"id":id});return {"message":"Deleted"}

# === OFFICERS CRUD + SEARCH + PAGINATION ===
@app.get("/api/v1/officers")
async def list_officers(page:int=Query(1,ge=1),size:int=Query(20,ge=1,le=100),search:str=Query(""),status_filter:str=Query(""),u:dict=Depends(auth)):
    items=city_filter(list(db["officers"].values()),u)
    if status_filter:items=[i for i in items if i.get("status")==status_filter]
    r=paginate(items,page,size,search,["officer_name","badge_number","mobile_number","police_station"],sort_by="created_at")
    return {"officers":r["data"],"total":r["total"],"page":r["page"],"page_size":r["page_size"],"total_pages":r["total_pages"]}
@app.post("/api/v1/officers",status_code=201)
async def create_officer(r:OfficerReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    for o in db["officers"].values():
        if o["whatsapp_number"]==r.whatsapp_number:raise HTTPException(400,detail="WhatsApp number already registered")
    id=uid();db["officers"][id]={"id":id,"officer_name":r.officer_name,"badge_number":sanitize(r.badge_number),"mobile_number":r.mobile_number,"whatsapp_number":r.whatsapp_number,"designation":sanitize(r.designation),"police_station":sanitize(r.police_station),"city":sanitize(r.city),"city_id":r.city_id,"status":r.status,"created_at":now()}
    log_audit(u["sub"],"create","officers",{"name":r.officer_name});return {"message":"Officer added","officer":db["officers"][id]}
@app.put("/api/v1/officers/{id}")
async def update_officer(id:str,r:OfficerReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["officers"]:raise HTTPException(404,detail="Officer not found")
    for oid,o in db["officers"].items():
        if oid!=id and o["whatsapp_number"]==r.whatsapp_number:raise HTTPException(400,detail="WhatsApp number already in use")
    db["officers"][id].update({"officer_name":r.officer_name,"badge_number":sanitize(r.badge_number),"mobile_number":r.mobile_number,"whatsapp_number":r.whatsapp_number,"designation":sanitize(r.designation),"police_station":sanitize(r.police_station),"city":sanitize(r.city),"city_id":r.city_id,"status":r.status})
    log_audit(u["sub"],"update","officers",{"id":id});return {"message":"Updated","officer":db["officers"][id]}
@app.delete("/api/v1/officers/{id}")
async def delete_officer(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["officers"]:raise HTTPException(404);del db["officers"][id];log_audit(u["sub"],"delete","officers",{"id":id});return {"message":"Deleted"}

# === ASSIGNMENTS CRUD ===
@app.get("/api/v1/assignments")
async def list_assignments(u:dict=Depends(auth)):
    result=[]
    for a in db["assignments"].values():
        ac=dict(a)
        if a["morning_officer_id"] and a["morning_officer_id"] in db["officers"]:ac["morning_officer"]=db["officers"][a["morning_officer_id"]]
        if a["afternoon_officer_id"] and a["afternoon_officer_id"] in db["officers"]:ac["afternoon_officer"]=db["officers"][a["afternoon_officer_id"]]
        if a["chowk_id"] in db["chowks"]:ac["chowk"]=db["chowks"][a["chowk_id"]]
        result.append(ac)
    return {"assignments":city_filter(result,u),"total":len(result)}
@app.post("/api/v1/assignments",status_code=201)
async def create_assignment(r:AssignmentReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if r.chowk_id not in db["chowks"]:raise HTTPException(400,detail="Chowk not found")
    for a in db["assignments"].values():
        if a["chowk_id"]==r.chowk_id:raise HTTPException(400,detail="Assignment already exists for this chowk. Update instead.")
    id=uid();db["assignments"][id]={"id":id,"chowk_id":r.chowk_id,"city_id":r.city_id,"morning_officer_id":r.morning_officer_id,"afternoon_officer_id":r.afternoon_officer_id,"status":"active","updated_by":u["sub"],"updated_at":now(),"created_at":now()}
    log_audit(u["sub"],"create","assignments",{"chowk_id":r.chowk_id});return {"message":"Assignment created","assignment":db["assignments"][id]}
@app.put("/api/v1/assignments/{id}")
async def update_assignment(id:str,r:AssignmentReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["assignments"]:raise HTTPException(404)
    db["assignments"][id].update({"chowk_id":r.chowk_id,"city_id":r.city_id,"morning_officer_id":r.morning_officer_id,"afternoon_officer_id":r.afternoon_officer_id,"updated_by":u["sub"],"updated_at":now()})
    log_audit(u["sub"],"update","assignments",{"id":id});return {"message":"Updated","assignment":db["assignments"][id]}
@app.delete("/api/v1/assignments/{id}")
async def delete_assignment(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["assignments"]:raise HTTPException(404);del db["assignments"][id];log_audit(u["sub"],"delete","assignments",{"id":id});return {"message":"Deleted"}

# === WHATSAPP LOG ===
@app.get("/api/v1/whatsapp-logs")
async def list_wa_logs(u:dict=Depends(auth)):return {"logs":db["whatsapp_logs"][-100:],"total":len(db["whatsapp_logs"])}

# === SIGNAL ANALYTICS ===
@app.get("/api/v1/analytics/signal")
async def list_signal(u:dict=Depends(auth)):return {"analytics":city_filter(db["signal_analytics"],u),"total":len(db["signal_analytics"])}
@app.post("/api/v1/analytics/signal",status_code=201)
async def create_signal(r:AnalyticsReq,u:dict=Depends(auth)):
    rec={"id":uid(),"chowk_id":r.chowk_id,"city_id":r.city_id,"date":now()[:10],"total_vehicles":r.total_vehicles,"average_waiting_time":r.average_waiting_time,"total_waiting_time":r.total_waiting_time,"total_time_saved":r.total_time_saved,"signal_cycle_duration":r.signal_cycle_duration,"queue_length":r.queue_length,"avg_time_saved_per_vehicle":round(r.total_time_saved/max(r.total_vehicles,1),2),"created_at":now()}
    db["signal_analytics"].append(rec);log_audit(u["sub"],"create","signal_analytics",{});return {"message":"Recorded","record":rec}

# === CO2 ANALYTICS ===
@app.get("/api/v1/analytics/co2")
async def list_co2(u:dict=Depends(auth)):return {"analytics":city_filter(db["co2_analytics"],u),"total":len(db["co2_analytics"])}
@app.post("/api/v1/analytics/co2",status_code=201)
async def create_co2(r:CO2Req,u:dict=Depends(auth)):
    trees=round(r.estimated_co2_saved/21.77,1) if r.estimated_co2_saved>0 else 0
    rec={"id":uid(),"chowk_id":r.chowk_id,"city_id":r.city_id,"date":now()[:10],"total_vehicles":r.total_vehicles,"estimated_co2_generated":r.estimated_co2_generated,"estimated_co2_saved":r.estimated_co2_saved,"fuel_saved":r.fuel_saved,"trees_equivalent":trees,"net_zero_score":round(min(r.estimated_co2_saved/max(r.estimated_co2_generated,1)*100,100),1),"created_at":now()}
    db["co2_analytics"].append(rec);log_audit(u["sub"],"create","co2_analytics",{});return {"message":"Recorded","record":rec}

# === ADMIN ===
@app.get("/api/v1/admin/audit-logs")
async def audit_logs(page:int=Query(1,ge=1),size:int=Query(50,ge=1,le=200),search:str=Query(""),u:dict=Depends(require_role("super_admin","auditor"))):
    items=sorted(db["audit_logs"],key=lambda x:x["timestamp"],reverse=True)
    r=paginate(items,page,size,search,["action","resource","user_id"])
    return {"audit_logs":r["data"],"total":r["total"],"page":r["page"]}
@app.get("/api/v1/admin/pending-users")
async def pending_users(u:dict=Depends(require_role("super_admin","city_admin"))):
    return {"pending_users":[u for u in db["users"].values() if u.get("status")=="pending"]}
@app.put("/api/v1/admin/users/{id}/approve")
async def approve_user(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if id not in db["users"]:raise HTTPException(404)
    db["users"][id]["status"]="approved";log_audit(u["sub"],"approve","users",{"id":id});return {"message":"Approved"}
@app.delete("/api/v1/admin/users/{id}")
async def delete_user(id:str,u:dict=Depends(require_role("super_admin"))):
    if id not in db["users"]:raise HTTPException(404);del db["users"][id];log_audit(u["sub"],"delete","users",{"id":id});return {"message":"Deleted"}

# === MARQUEE ===
@app.get("/api/v1/marquee")
async def get_marquee(u:dict=Depends(auth)):return {"messages":[]}
@app.post("/api/v1/marquee",status_code=201)
async def create_marquee(message:str="",u:dict=Depends(auth)):return {"message":"Created"}

@app.get("/health")
async def health():return {"status":"healthy","version":"4.0.0","endpoints":55,"timestamp":now()}
@app.get("/")
async def root():return {"service":"ISTSS API","version":"4.0.0","company":"Datamorphosis Technologies Pvt. Ltd.","docs":"/api/docs","endpoints":55}
