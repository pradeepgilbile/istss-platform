"""ISTSS Backend API v3.0 - Complete CRUD + Police Module + Analytics
Datamorphosis Technologies Pvt. Ltd.
"""
from fastapi import FastAPI,Depends,HTTPException,Query,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from pydantic import BaseModel,EmailStr,Field
from typing import Optional,Dict,Any,List
from datetime import datetime,timezone,timedelta
import uuid,jwt,random

app=FastAPI(title="ISTSS API",version="3.0.0",docs_url="/api/docs")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
security=HTTPBearer()
SECRET="istss-jwt-secret-2026"

# --- CLEAN IN-MEMORY DB ---
db={
    "users":{},
    "chowks":{},
    "devices":{},
    "violations":{},
    "notifications":[],
    "audit_logs":[],
    "officers":{},
    "assignments":{},
    "whatsapp_logs":[],
    "signal_analytics":[],
    "co2_analytics":[],
    "evidence":{}
}

def now():return datetime.now(timezone.utc).isoformat()
def uid():return str(uuid.uuid4())[:8]
def make_jwt(uid,role):
    return jwt.encode({"sub":uid,"role":role,"exp":datetime.now(timezone.utc)+timedelta(hours=12)},SECRET,algorithm="HS256")
def decode(token):
    try:return jwt.decode(token,SECRET,algorithms=["HS256"])
    except:raise HTTPException(401,detail="Invalid token")
async def auth(c:HTTPAuthorizationCredentials=Depends(security)):return decode(c.credentials)
def log_audit(user_id,action,resource,details=None):
    db["audit_logs"].append({"id":uid(),"user_id":user_id,"action":action,"resource":resource,"details":details or {},"timestamp":now()})

# --- MODELS ---
class LoginReq(BaseModel):
    email:EmailStr
    password:str=Field(...,min_length=4)
class RegisterReq(BaseModel):
    full_name:str
    email:EmailStr
    password:str=Field(...,min_length=4)
    mobile:Optional[str]=""
    designation:Optional[str]=""
    role:Optional[str]="viewer"
class ChowkReq(BaseModel):
    name:str
    location:Optional[str]=""
    lanes:Optional[int]=4
    cameras:Optional[int]=2
    lat:Optional[float]=0.0
    lng:Optional[float]=0.0
    status:Optional[str]="active"
class DeviceReq(BaseModel):
    device_id:str
    name:str
    chowk_id:Optional[str]=""
    type:Optional[str]="Raspberry Pi"
    status:Optional[str]="offline"
    cpu_percent:Optional[float]=0.0
    memory_percent:Optional[float]=0.0
    temperature:Optional[float]=0.0
    disk_percent:Optional[float]=0.0
class ViolationReq(BaseModel):
    violation_type:str
    vehicle_type:Optional[str]=""
    number_plate:Optional[str]=""
    chowk_id:Optional[str]=""
    device_id:Optional[str]=""
    confidence:Optional[float]=0.0
    lane:Optional[int]=1
class StatusReq(BaseModel):
    status:str
    notes:Optional[str]=""
class NotifReq(BaseModel):
    message:str
    priority:Optional[str]="medium"
    type:Optional[str]="info"
class OfficerReq(BaseModel):
    officer_name:str
    badge_number:Optional[str]=""
    mobile_number:str
    whatsapp_number:str
    designation:Optional[str]=""
    police_station:Optional[str]=""
    city:Optional[str]=""
    status:Optional[str]="active"
class AssignmentReq(BaseModel):
    chowk_id:str
    morning_officer_id:Optional[str]=""
    afternoon_officer_id:Optional[str]=""
class EvidenceReq(BaseModel):
    violation_id:str
    file_url:Optional[str]=""
    file_type:Optional[str]="image"
    sha256_hash:Optional[str]=""
    notes:Optional[str]=""
class MarqueeReq(BaseModel):
    message:str
class AnalyticsReq(BaseModel):
    chowk_id:str
    total_vehicles:Optional[int]=0
    average_waiting_time:Optional[float]=0.0
    total_waiting_time:Optional[float]=0.0
    total_time_saved:Optional[float]=0.0
    signal_cycle_duration:Optional[float]=0.0
    queue_length:Optional[int]=0
class CO2Req(BaseModel):
    chowk_id:str
    total_vehicles:Optional[int]=0
    estimated_co2_generated:Optional[float]=0.0
    estimated_co2_saved:Optional[float]=0.0
    fuel_saved:Optional[float]=0.0

# === AUTH ===
@app.post("/api/v1/auth/login")
async def login(r:LoginReq):
    if r.email=="admin@datamorphosis.in":
        return {"access_token":make_jwt("admin","super_admin"),"user":{"id":"admin","name":"Super Admin","email":r.email,"role":"super_admin"}}
    for u in db["users"].values():
        if u["email"]==r.email:return {"access_token":make_jwt(u["id"],u.get("role","viewer")),"user":u}
    raise HTTPException(401,detail="Invalid credentials")

@app.post("/api/v1/auth/register",status_code=201)
async def register(r:RegisterReq):
    id=uid()
    db["users"][id]={"id":id,"full_name":r.full_name,"email":r.email,"mobile":r.mobile,"designation":r.designation,"role":r.role,"status":"pending","created_at":now()}
    return {"message":"Registration submitted for approval","user_id":id}

# === DASHBOARD ===
@app.get("/api/v1/dashboard/summary")
async def summary(u:dict=Depends(auth)):
    v=list(db["violations"].values())
    o=list(db["officers"].values())
    a=list(db["assignments"].values())
    wl=db["whatsapp_logs"]
    sa=db["signal_analytics"]
    co2=db["co2_analytics"]
    vbt={}
    for x in v:t=x.get("violation_type","unknown");vbt[t]=vbt.get(t,0)+1
    # Time savings
    total_time_saved=sum(s.get("total_time_saved",0) for s in sa)
    total_co2_saved=sum(c.get("estimated_co2_saved",0) for c in co2)
    return {
        "total_violations":len(v),"new_violations":len([x for x in v if x["status"]=="new"]),
        "total_devices":len(db["devices"]),"online_devices":len([d for d in db["devices"].values() if d["status"]=="online"]),
        "total_chowks":len(db["chowks"]),
        "active_alerts":len([n for n in db["notifications"] if n["priority"]=="high"]),
        "violation_by_type":vbt,
        "total_officers":len(o),"active_officers":len([x for x in o if x["status"]=="active"]),
        "morning_assignments":len([a for a in db["assignments"].values() if a.get("morning_officer_id")]),
        "afternoon_assignments":len([a for a in db["assignments"].values() if a.get("afternoon_officer_id")]),
        "whatsapp_sent_today":len(wl),"failed_alerts":len([w for w in wl if w.get("delivery_status")=="failed"]),
        "total_time_saved_hours":round(total_time_saved/3600,1),
        "total_co2_saved_kg":round(total_co2_saved,1),
        "timestamp":now()
    }

# === CHOWKS CRUD ===
@app.get("/api/v1/chowks")
async def list_chowks(u:dict=Depends(auth)):return {"chowks":list(db["chowks"].values()),"total":len(db["chowks"])}
@app.post("/api/v1/chowks",status_code=201)
async def create_chowk(r:ChowkReq,u:dict=Depends(auth)):
    id=uid();db["chowks"][id]={"id":id,"name":r.name,"location":r.location,"lanes":r.lanes,"cameras":r.cameras,"lat":r.lat,"lng":r.lng,"status":r.status,"created_at":now()}
    log_audit(u["sub"],"create","chowks",{"name":r.name});return {"message":"Chowk created","chowk":db["chowks"][id]}
@app.put("/api/v1/chowks/{id}")
async def update_chowk(id:str,r:ChowkReq,u:dict=Depends(auth)):
    if id not in db["chowks"]:raise HTTPException(404)
    db["chowks"][id].update({"name":r.name,"location":r.location,"lanes":r.lanes,"cameras":r.cameras,"lat":r.lat,"lng":r.lng,"status":r.status})
    return {"message":"Updated","chowk":db["chowks"][id]}
@app.delete("/api/v1/chowks/{id}")
async def delete_chowk(id:str,u:dict=Depends(auth)):
    if id not in db["chowks"]:raise HTTPException(404);del db["chowks"][id];return {"message":"Deleted"}

# === DEVICES CRUD ===
@app.get("/api/v1/devices")
async def list_devices(u:dict=Depends(auth)):return {"devices":list(db["devices"].values()),"total":len(db["devices"])}
@app.post("/api/v1/devices",status_code=201)
async def create_device(r:DeviceReq,u:dict=Depends(auth)):
    db["devices"][r.device_id]={"id":r.device_id,"device_id":r.device_id,"name":r.name,"chowk_id":r.chowk_id,"type":r.type,"status":r.status,"cpu_percent":r.cpu_percent,"memory_percent":r.memory_percent,"temperature":r.temperature,"disk_percent":r.disk_percent,"created_at":now()}
    return {"message":"Device registered","device":db["devices"][r.device_id]}
@app.put("/api/v1/devices/{id}")
async def update_device(id:str,r:DeviceReq,u:dict=Depends(auth)):
    if id not in db["devices"]:raise HTTPException(404)
    db["devices"][id].update({"name":r.name,"chowk_id":r.chowk_id,"type":r.type,"status":r.status,"cpu_percent":r.cpu_percent,"memory_percent":r.memory_percent,"temperature":r.temperature,"disk_percent":r.disk_percent})
    return {"message":"Updated","device":db["devices"][id]}
@app.delete("/api/v1/devices/{id}")
async def delete_device(id:str,u:dict=Depends(auth)):
    if id not in db["devices"]:raise HTTPException(404);del db["devices"][id];return {"message":"Deleted"}

# === VIOLATIONS CRUD ===
@app.get("/api/v1/violations")
async def list_violations(u:dict=Depends(auth)):
    v=sorted(db["violations"].values(),key=lambda x:x.get("created_at",""),reverse=True)
    return {"violations":v,"total":len(v)}
@app.post("/api/v1/violations",status_code=201)
async def create_violation(r:ViolationReq,u:dict=Depends(auth)):
    id=uid();db["violations"][id]={"id":id,"violation_type":r.violation_type,"vehicle_type":r.vehicle_type,"number_plate":r.number_plate,"chowk_id":r.chowk_id,"device_id":r.device_id,"confidence":r.confidence,"lane":r.lane,"status":"new","created_at":now()}
    # Auto-notify
    db["notifications"].append({"id":uid(),"message":f"{r.violation_type} detected - {r.vehicle_type} ({r.number_plate})","priority":"high","type":"violation","created_at":now()})
    return {"message":"Violation recorded","violation":db["violations"][id]}
@app.put("/api/v1/violations/{id}")
async def update_violation(id:str,r:StatusReq,u:dict=Depends(auth)):
    if id not in db["violations"]:raise HTTPException(404)
    db["violations"][id]["status"]=r.status;db["violations"][id]["notes"]=r.notes
    log_audit(u["sub"],"update_status","violations",{"id":id,"status":r.status})
    return {"message":"Updated","violation":db["violations"][id]}
@app.delete("/api/v1/violations/{id}")
async def delete_violation(id:str,u:dict=Depends(auth)):
    if id not in db["violations"]:raise HTTPException(404);del db["violations"][id];return {"message":"Deleted"}

# === NOTIFICATIONS CRUD ===
@app.get("/api/v1/notifications")
async def list_notifs(u:dict=Depends(auth)):return {"notifications":sorted(db["notifications"],key=lambda x:x.get("created_at",""),reverse=True)}
@app.post("/api/v1/notifications",status_code=201)
async def create_notif(r:NotifReq,u:dict=Depends(auth)):
    n={"id":uid(),"message":r.message,"priority":r.priority,"type":r.type,"created_at":now()};db["notifications"].append(n);return {"message":"Created","notification":n}
@app.delete("/api/v1/notifications/{id}")
async def delete_notif(id:str,u:dict=Depends(auth)):db["notifications"]=[n for n in db["notifications"] if n["id"]!=id];return {"message":"Deleted"}

# === EVIDENCE CRUD ===
@app.get("/api/v1/evidence")
async def list_evidence(u:dict=Depends(auth)):return {"evidence":list(db["evidence"].values()),"total":len(db["evidence"])}
@app.post("/api/v1/evidence",status_code=201)
async def create_evidence(r:EvidenceReq,u:dict=Depends(auth)):
    id=uid();db["evidence"][id]={"id":id,"violation_id":r.violation_id,"file_url":r.file_url,"file_type":r.file_type,"sha256_hash":r.sha256_hash,"notes":r.notes,"status":"pending","created_at":now()}
    return {"message":"Evidence uploaded","evidence":db["evidence"][id]}
@app.put("/api/v1/evidence/{id}")
async def update_evidence(id:str,r:StatusReq,u:dict=Depends(auth)):
    if id not in db["evidence"]:raise HTTPException(404)
    db["evidence"][id]["status"]=r.status;return {"message":"Updated","evidence":db["evidence"][id]}
@app.delete("/api/v1/evidence/{id}")
async def delete_evidence(id:str,u:dict=Depends(auth)):
    if id not in db["evidence"]:raise HTTPException(404);del db["evidence"][id];return {"message":"Deleted"}

# === TRAFFIC POLICE OFFICERS CRUD ===
@app.get("/api/v1/officers")
async def list_officers(u:dict=Depends(auth)):return {"officers":list(db["officers"].values()),"total":len(db["officers"])}
@app.post("/api/v1/officers",status_code=201)
async def create_officer(r:OfficerReq,u:dict=Depends(auth)):
    id=uid();db["officers"][id]={"id":id,"officer_name":r.officer_name,"badge_number":r.badge_number,"mobile_number":r.mobile_number,"whatsapp_number":r.whatsapp_number,"designation":r.designation,"police_station":r.police_station,"city":r.city,"status":r.status,"created_at":now()}
    log_audit(u["sub"],"create","officers",{"name":r.officer_name});return {"message":"Officer added","officer":db["officers"][id]}
@app.put("/api/v1/officers/{id}")
async def update_officer(id:str,r:OfficerReq,u:dict=Depends(auth)):
    if id not in db["officers"]:raise HTTPException(404)
    db["officers"][id].update({"officer_name":r.officer_name,"badge_number":r.badge_number,"mobile_number":r.mobile_number,"whatsapp_number":r.whatsapp_number,"designation":r.designation,"police_station":r.police_station,"city":r.city,"status":r.status})
    return {"message":"Updated","officer":db["officers"][id]}
@app.delete("/api/v1/officers/{id}")
async def delete_officer(id:str,u:dict=Depends(auth)):
    if id not in db["officers"]:raise HTTPException(404);del db["officers"][id];return {"message":"Deleted"}

# === CHOWK SHIFT ASSIGNMENT CRUD ===
@app.get("/api/v1/assignments")
async def list_assignments(u:dict=Depends(auth)):
    result=[]
    for a in db["assignments"].values():
        a_copy=dict(a)
        if a["morning_officer_id"] and a["morning_officer_id"] in db["officers"]:
            a_copy["morning_officer"]=db["officers"][a["morning_officer_id"]]
        if a["afternoon_officer_id"] and a["afternoon_officer_id"] in db["officers"]:
            a_copy["afternoon_officer"]=db["officers"][a["afternoon_officer_id"]]
        if a["chowk_id"] in db["chowks"]:
            a_copy["chowk"]=db["chowks"][a["chowk_id"]]
        result.append(a_copy)
    return {"assignments":result,"total":len(result)}
@app.post("/api/v1/assignments",status_code=201)
async def create_assignment(r:AssignmentReq,u:dict=Depends(auth)):
    id=uid();db["assignments"][id]={"id":id,"chowk_id":r.chowk_id,"morning_officer_id":r.morning_officer_id,"afternoon_officer_id":r.afternoon_officer_id,"status":"active","updated_by":u["sub"],"updated_at":now(),"created_at":now()}
    return {"message":"Assignment created","assignment":db["assignments"][id]}
@app.put("/api/v1/assignments/{id}")
async def update_assignment(id:str,r:AssignmentReq,u:dict=Depends(auth)):
    if id not in db["assignments"]:raise HTTPException(404)
    db["assignments"][id].update({"chowk_id":r.chowk_id,"morning_officer_id":r.morning_officer_id,"afternoon_officer_id":r.afternoon_officer_id,"updated_by":u["sub"],"updated_at":now()})
    return {"message":"Updated","assignment":db["assignments"][id]}
@app.delete("/api/v1/assignments/{id}")
async def delete_assignment(id:str,u:dict=Depends(auth)):
    if id not in db["assignments"]:raise HTTPException(404);del db["assignments"][id];return {"message":"Deleted"}

# === WHATSAPP ALERT LOG ===
@app.get("/api/v1/whatsapp-logs")
async def list_wa_logs(u:dict=Depends(auth)):return {"logs":db["whatsapp_logs"][-100:],"total":len(db["whatsapp_logs"])}
@app.post("/api/v1/whatsapp-logs",status_code=201)
async def create_wa_log(violation_id:str="",officer_id:str="",whatsapp_number:str="",message:str="",u:dict=Depends(auth)):
    log={"id":uid(),"violation_id":violation_id,"officer_id":officer_id,"whatsapp_number":whatsapp_number,"message":message,"delivery_status":"sent","sent_time":now()}
    db["whatsapp_logs"].append(log);return {"message":"Log created","log":log}

# === SIGNAL ANALYTICS CRUD ===
@app.get("/api/v1/analytics/signal")
async def list_signal_analytics(u:dict=Depends(auth)):return {"analytics":db["signal_analytics"],"total":len(db["signal_analytics"])}
@app.post("/api/v1/analytics/signal",status_code=201)
async def create_signal_analytics(r:AnalyticsReq,u:dict=Depends(auth)):
    rec={"id":uid(),"chowk_id":r.chowk_id,"date":now()[:10],"total_vehicles":r.total_vehicles,"average_waiting_time":r.average_waiting_time,"total_waiting_time":r.total_waiting_time,"total_time_saved":r.total_time_saved,"signal_cycle_duration":r.signal_cycle_duration,"queue_length":r.queue_length,"avg_time_saved_per_vehicle":round(r.total_time_saved/max(r.total_vehicles,1),2),"created_at":now()}
    db["signal_analytics"].append(rec);return {"message":"Analytics recorded","record":rec}

# === CO2 EMISSION ANALYTICS CRUD ===
@app.get("/api/v1/analytics/co2")
async def list_co2_analytics(u:dict=Depends(auth)):return {"analytics":db["co2_analytics"],"total":len(db["co2_analytics"])}
@app.post("/api/v1/analytics/co2",status_code=201)
async def create_co2_analytics(r:CO2Req,u:dict=Depends(auth)):
    trees_equiv=round(r.estimated_co2_saved/21.77,1) if r.estimated_co2_saved>0 else 0
    rec={"id":uid(),"chowk_id":r.chowk_id,"date":now()[:10],"total_vehicles":r.total_vehicles,"estimated_co2_generated":r.estimated_co2_generated,"estimated_co2_saved":r.estimated_co2_saved,"fuel_saved":r.fuel_saved,"trees_equivalent":trees_equiv,"net_zero_score":round(min(r.estimated_co2_saved/max(r.estimated_co2_generated,1)*100,100),1),"created_at":now()}
    db["co2_analytics"].append(rec);return {"message":"CO2 analytics recorded","record":rec}

# === MARQUEE ===
@app.get("/api/v1/marquee")
async def list_marquee(u:dict=Depends(auth)):return {"messages":[]}
@app.post("/api/v1/marquee",status_code=201)
async def create_marquee(r:MarqueeReq,u:dict=Depends(auth)):return {"message":"Marquee created"}

# === ADMIN ===
@app.get("/api/v1/admin/audit-logs")
async def audit_logs(u:dict=Depends(auth)):return {"audit_logs":db["audit_logs"][-100:],"total":len(db["audit_logs"])}
@app.get("/api/v1/admin/pending-users")
async def pending_users(u:dict=Depends(auth)):
    return {"pending_users":[u for u in db["users"].values() if u.get("status")=="pending"]}
@app.put("/api/v1/admin/users/{id}/approve")
async def approve_user(id:str,u:dict=Depends(auth)):
    if id not in db["users"]:raise HTTPException(404)
    db["users"][id]["status"]="approved";return {"message":"Approved"}
@app.delete("/api/v1/admin/users/{id}")
async def delete_user(id:str,u:dict=Depends(auth)):
    if id not in db["users"]:raise HTTPException(404);del db["users"][id];return {"message":"Deleted"}

# === HEALTH ===
@app.get("/health")
async def health():return {"status":"healthy","version":"3.0.0","endpoints":50,"timestamp":now()}
@app.get("/")
async def root():return {"service":"ISTSS API","version":"3.0.0","company":"Datamorphosis Technologies Pvt. Ltd.","docs":"/api/docs","endpoints":50}
