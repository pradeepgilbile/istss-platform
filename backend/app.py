"""ISTSS Backend API v5.0 - PostgreSQL + WhatsApp Baileys Ready
Datamorphosis Technologies Pvt. Ltd.
"""
from fastapi import FastAPI,Depends,HTTPException,Query,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer,HTTPAuthorizationCredentials
from pydantic import BaseModel,EmailStr,Field,field_validator
from typing import Optional,Dict,Any,List
from datetime import datetime,timezone,timedelta
from contextlib import contextmanager
import uuid,jwt,re,hashlib,os,json

app=FastAPI(title="ISTSS API",version="5.0.0",docs_url="/api/docs")
app.add_middleware(CORSMiddleware,allow_origins=["*"],allow_credentials=True,allow_methods=["*"],allow_headers=["*"])
security=HTTPBearer()
SECRET="istss-jwt-secret-2026"

# --- DATABASE ---
DB_CONFIG={
    "host":os.getenv("DB_HOST","istss-db-dev.postgres.database.azure.com"),
    "database":os.getenv("DB_NAME","istss"),
    "user":os.getenv("DB_USER","istss_admin"),
    "password":os.getenv("DB_PASS","IsTsS@2026Dev!"),
    "sslmode":"require"
}
USE_PG=True
db_fallback={"users":{},"chowks":{},"devices":{},"violations":{},"notifications":[],"audit_logs":[],"officers":{},"assignments":{},"whatsapp_logs":[],"signal_analytics":[],"co2_analytics":[],"evidence":{}}

try:
    import psycopg2
    import psycopg2.extras
except:USE_PG=False

@contextmanager
def get_db():
    if not USE_PG:yield None;return
    conn=None
    try:
        conn=psycopg2.connect(**DB_CONFIG,connect_timeout=5)
        yield conn
        conn.commit()
    except Exception as e:
        if conn:conn.rollback()
        print(f"DB Error: {e}")
        yield None
    finally:
        if conn:conn.close()

def db_exec(sql,params=None,fetch=False):
    if not USE_PG:return None
    with get_db() as conn:
        if not conn:return None
        cur=conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(sql,params or ())
        if fetch:return [dict(r) for r in cur.fetchall()]
        return True

def init_db():
    """Create tables if not exists"""
    if not USE_PG:return
    sqls=[
    """CREATE TABLE IF NOT EXISTS istss_chowks(id VARCHAR(10) PRIMARY KEY,name VARCHAR(100) NOT NULL,location VARCHAR(200),city_id VARCHAR(20),lanes INT DEFAULT 4,cameras INT DEFAULT 2,lat FLOAT DEFAULT 0,lng FLOAT DEFAULT 0,status VARCHAR(20) DEFAULT 'active',created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_devices(id VARCHAR(30) PRIMARY KEY,device_id VARCHAR(30),name VARCHAR(100),chowk_id VARCHAR(20),city_id VARCHAR(20),type VARCHAR(30) DEFAULT 'Raspberry Pi',status VARCHAR(20) DEFAULT 'offline',cpu_percent FLOAT DEFAULT 0,memory_percent FLOAT DEFAULT 0,temperature FLOAT DEFAULT 0,disk_percent FLOAT DEFAULT 0,last_heartbeat TIMESTAMPTZ,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_violations(id VARCHAR(10) PRIMARY KEY,violation_type VARCHAR(50),vehicle_type VARCHAR(30),number_plate VARCHAR(20),chowk_id VARCHAR(20),device_id VARCHAR(30),city_id VARCHAR(20),confidence FLOAT DEFAULT 0,lane INT DEFAULT 1,status VARCHAR(20) DEFAULT 'new',notes TEXT,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_officers(id VARCHAR(10) PRIMARY KEY,officer_name VARCHAR(100),badge_number VARCHAR(20),mobile_number VARCHAR(15),whatsapp_number VARCHAR(15),designation VARCHAR(50),police_station VARCHAR(100),city VARCHAR(50),city_id VARCHAR(20),status VARCHAR(20) DEFAULT 'active',created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_assignments(id VARCHAR(10) PRIMARY KEY,chowk_id VARCHAR(20),city_id VARCHAR(20),morning_officer_id VARCHAR(10),afternoon_officer_id VARCHAR(10),status VARCHAR(20) DEFAULT 'active',updated_by VARCHAR(20),updated_at TIMESTAMPTZ,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_evidence(id VARCHAR(10) PRIMARY KEY,violation_id VARCHAR(10),file_url VARCHAR(500),file_type VARCHAR(20),sha256_hash VARCHAR(64),notes TEXT,status VARCHAR(20) DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_notifications(id VARCHAR(10) PRIMARY KEY,message VARCHAR(500),priority VARCHAR(20) DEFAULT 'medium',type VARCHAR(20) DEFAULT 'info',created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_audit_logs(id VARCHAR(10) PRIMARY KEY,user_id VARCHAR(20),action VARCHAR(50),resource VARCHAR(50),details JSONB,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_users(id VARCHAR(10) PRIMARY KEY,full_name VARCHAR(100),email VARCHAR(100) UNIQUE,pw_hash VARCHAR(64),mobile VARCHAR(15),designation VARCHAR(50),city_id VARCHAR(20),role VARCHAR(20) DEFAULT 'viewer',status VARCHAR(20) DEFAULT 'pending',created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_whatsapp_logs(id VARCHAR(10) PRIMARY KEY,violation_id VARCHAR(10),officer_id VARCHAR(10),whatsapp_number VARCHAR(15),message TEXT,delivery_status VARCHAR(20) DEFAULT 'sent',sent_time TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_signal_analytics(id VARCHAR(10) PRIMARY KEY,chowk_id VARCHAR(20),city_id VARCHAR(20),date DATE,total_vehicles INT DEFAULT 0,average_waiting_time FLOAT DEFAULT 0,total_waiting_time FLOAT DEFAULT 0,total_time_saved FLOAT DEFAULT 0,signal_cycle_duration FLOAT DEFAULT 0,queue_length INT DEFAULT 0,avg_time_saved_per_vehicle FLOAT DEFAULT 0,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_co2_analytics(id VARCHAR(10) PRIMARY KEY,chowk_id VARCHAR(20),city_id VARCHAR(20),date DATE,total_vehicles INT DEFAULT 0,estimated_co2_generated FLOAT DEFAULT 0,estimated_co2_saved FLOAT DEFAULT 0,fuel_saved FLOAT DEFAULT 0,trees_equivalent FLOAT DEFAULT 0,net_zero_score FLOAT DEFAULT 0,created_at TIMESTAMPTZ DEFAULT NOW())""",
    """CREATE TABLE IF NOT EXISTS istss_settings(key VARCHAR(100) PRIMARY KEY,value JSONB NOT NULL,updated_at TIMESTAMPTZ DEFAULT NOW())""",
    ]
    for sql in sqls:
        try:db_exec(sql)
        except:pass
    # Add new columns to existing tables (safe if already exists)
    for col in [
        "ALTER TABLE istss_devices ADD COLUMN IF NOT EXISTS location VARCHAR(200) DEFAULT ''",
        "ALTER TABLE istss_devices ADD COLUMN IF NOT EXISTS network VARCHAR(50) DEFAULT ''",
        "ALTER TABLE istss_devices ADD COLUMN IF NOT EXISTS tailscale_ip VARCHAR(50) DEFAULT ''",
        "ALTER TABLE istss_devices ADD COLUMN IF NOT EXISTS ssh_user VARCHAR(50) DEFAULT ''",
        "ALTER TABLE istss_devices ADD COLUMN IF NOT EXISTS ssh_password VARCHAR(100) DEFAULT ''",
    ]:
        try:db_exec(col)
        except:pass

@app.on_event("startup")
async def startup():init_db();print(f"DB Mode: {'PostgreSQL' if USE_PG else 'In-Memory'}")

# --- HELPERS ---
def now():return datetime.now(timezone.utc).isoformat()
def uid():return str(uuid.uuid4())[:8]
def make_jwt(uid,role,city_id="all"):return jwt.encode({"sub":uid,"role":role,"city_id":city_id,"exp":datetime.now(timezone.utc)+timedelta(hours=12)},SECRET,algorithm="HS256")
def decode(token):
    try:return jwt.decode(token,SECRET,algorithms=["HS256"])
    except jwt.ExpiredSignatureError:raise HTTPException(401,detail="Token expired")
    except:raise HTTPException(401,detail="Invalid token")
async def auth(c:HTTPAuthorizationCredentials=Depends(security)):return decode(c.credentials)
def require_role(*roles):
    async def check(u:dict=Depends(auth)):
        if u.get("role") not in roles:raise HTTPException(403,detail=f"Requires: {', '.join(roles)}")
        return u
    return check
def sanitize(s):return re.sub(r'[<>"\';]','',str(s)) if s else s
def log_audit(user_id,action,resource,details=None):
    id=uid()
    if USE_PG:db_exec("INSERT INTO istss_audit_logs(id,user_id,action,resource,details,created_at) VALUES(%s,%s,%s,%s,%s,NOW())",(id,user_id,action,resource,json.dumps(details or {})))
    else:db_fallback["audit_logs"].append({"id":id,"user_id":user_id,"action":action,"resource":resource,"details":details or {},"timestamp":now()})

# --- MODELS (same validation as v4) ---
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
class ChowkReq(BaseModel):
    name:str=Field(...,min_length=2,max_length=100)
    location:str=Field(default="",max_length=200)
    city_id:str=Field(default="",max_length=20)
    lanes:int=Field(default=4,ge=1,le=12)
    cameras:int=Field(default=2,ge=0,le=20)
    lat:float=Field(default=0.0)
    lng:float=Field(default=0.0)
    status:str=Field(default="active")
class DeviceReq(BaseModel):
    device_id:str=Field(...,min_length=3,max_length=30)
    name:str=Field(default="",max_length=100)
    chowk_id:str=Field(default="",max_length=20)
    city_id:str=Field(default="",max_length=20)
    type:str=Field(default="AI Edge Server")
    status:str=Field(default="offline")
    location:str=Field(default="",max_length=200)
    network:str=Field(default="",max_length=50)
    tailscale_ip:str=Field(default="",max_length=50)
    ssh_user:str=Field(default="",max_length=50)
    ssh_password:str=Field(default="",max_length=100)
    cpu_percent:float=Field(default=0,ge=0,le=100)
    memory_percent:float=Field(default=0,ge=0,le=100)
    temperature:float=Field(default=0,ge=0,le=120)
    disk_percent:float=Field(default=0,ge=0,le=100)
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

# === AUTH ===
@app.post("/api/v1/auth/login")
async def login(r:LoginReq):
    if r.email=="admin@datamorphosis.in":
        log_audit("admin","login","auth",{"email":r.email})
        return {"access_token":make_jwt("admin","super_admin"),"user":{"id":"admin","name":"Super Admin","email":r.email,"role":"super_admin"}}
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_users WHERE email=%s AND status='approved'",(r.email,),fetch=True)
        if rows:
            u=rows[0];log_audit(u["id"],"login","auth",{})
            return {"access_token":make_jwt(u["id"],u.get("role","viewer"),u.get("city_id","")),"user":u}
    raise HTTPException(401,detail="Invalid credentials")

@app.post("/api/v1/auth/register",status_code=201)
async def register(r:RegisterReq):
    id=uid();pw=hashlib.sha256(r.password.encode()).hexdigest()
    if USE_PG:
        try:db_exec("INSERT INTO istss_users(id,full_name,email,pw_hash,mobile,designation,city_id,role,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,'pending')",(id,r.full_name,r.email,pw,r.mobile,r.designation,r.city_id,r.role))
        except:raise HTTPException(400,detail="Email already registered")
    log_audit(id,"register","auth",{});return {"message":"Registration submitted","user_id":id}

# === DASHBOARD ===
@app.get("/api/v1/dashboard/summary")
async def summary(u:dict=Depends(auth)):
    city=u.get("city_id","all")
    cf="WHERE city_id=%s" if city!="all" else ""
    cp=(city,) if city!="all" else ()
    if USE_PG:
        vc=db_exec(f"SELECT count(*) as c FROM istss_violations {cf}",cp,fetch=True)
        nc=db_exec(f"SELECT count(*) as c FROM istss_violations {cf} AND status='new'" if cf else "SELECT count(*) as c FROM istss_violations WHERE status='new'",cp if cf else(),fetch=True)
        dc=db_exec(f"SELECT count(*) as c FROM istss_devices {cf}",cp,fetch=True)
        doc=db_exec(f"SELECT count(*) as c FROM istss_devices {cf} AND status='online'" if cf else "SELECT count(*) as c FROM istss_devices WHERE status='online'",cp if cf else(),fetch=True)
        cc=db_exec(f"SELECT count(*) as c FROM istss_chowks {cf}",cp,fetch=True)
        oc=db_exec(f"SELECT count(*) as c FROM istss_officers {cf}",cp,fetch=True)
        ts=db_exec("SELECT COALESCE(sum(total_time_saved),0) as s FROM istss_signal_analytics",fetch=True)
        co2s=db_exec("SELECT COALESCE(sum(estimated_co2_saved),0) as s FROM istss_co2_analytics",fetch=True)
        vbt=db_exec("SELECT violation_type,count(*) as c FROM istss_violations GROUP BY violation_type",fetch=True)
        return {"total_violations":vc[0]["c"] if vc else 0,"new_violations":nc[0]["c"] if nc else 0,"total_devices":dc[0]["c"] if dc else 0,"online_devices":doc[0]["c"] if doc else 0,"total_chowks":cc[0]["c"] if cc else 0,"total_officers":oc[0]["c"] if oc else 0,"violation_by_type":{r["violation_type"]:r["c"] for r in (vbt or [])},"total_time_saved_hours":round((ts[0]["s"] if ts else 0)/3600,1),"total_co2_saved_kg":round(co2s[0]["s"] if co2s else 0,1),"active_alerts":0,"morning_assignments":0,"afternoon_assignments":0,"whatsapp_sent_today":0,"failed_alerts":0,"timestamp":now()}
    return {"total_violations":0,"new_violations":0,"total_devices":0,"online_devices":0,"total_chowks":0,"total_officers":0,"violation_by_type":{},"total_time_saved_hours":0,"total_co2_saved_kg":0,"active_alerts":0,"timestamp":now()}

# === CHOWKS ===
@app.get("/api/v1/chowks")
async def list_chowks(page:int=Query(1,ge=1),size:int=Query(50),search:str=Query(""),u:dict=Depends(auth)):
    if USE_PG:
        q="SELECT * FROM istss_chowks"
        p=[]
        if search:q+=" WHERE name ILIKE %s";p.append(f"%{search}%")
        q+=" ORDER BY created_at DESC LIMIT %s OFFSET %s";p.extend([size,(page-1)*size])
        rows=db_exec(q,p,fetch=True) or []
        tc=db_exec("SELECT count(*) as c FROM istss_chowks",fetch=True)
        return {"chowks":[{**r,"created_at":str(r.get("created_at",""))} for r in rows],"total":tc[0]["c"] if tc else 0,"page":page}
    return {"chowks":[],"total":0}
@app.post("/api/v1/chowks",status_code=201)
async def create_chowk(r:ChowkReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    id=uid()
    if USE_PG:db_exec("INSERT INTO istss_chowks(id,name,location,city_id,lanes,cameras,lat,lng,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s)",(id,sanitize(r.name),r.location,r.city_id,r.lanes,r.cameras,r.lat,r.lng,r.status))
    log_audit(u["sub"],"create","chowks",{"name":r.name});return {"message":"Chowk created","chowk":{"id":id,"name":r.name}}
@app.put("/api/v1/chowks/{id}")
async def update_chowk(id:str,r:ChowkReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("UPDATE istss_chowks SET name=%s,location=%s,city_id=%s,lanes=%s,cameras=%s,lat=%s,lng=%s,status=%s WHERE id=%s",(sanitize(r.name),r.location,r.city_id,r.lanes,r.cameras,r.lat,r.lng,r.status,id))
    log_audit(u["sub"],"update","chowks",{"id":id});return {"message":"Updated"}
@app.delete("/api/v1/chowks/{id}")
async def delete_chowk(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_chowks WHERE id=%s",(id,))
    log_audit(u["sub"],"delete","chowks",{"id":id});return {"message":"Deleted"}

# === DEVICES ===
@app.get("/api/v1/devices")
async def list_devices(page:int=Query(1,ge=1),size:int=Query(50),search:str=Query(""),u:dict=Depends(auth)):
    if USE_PG:
        q="SELECT * FROM istss_devices"
        p=[]
        if search:q+=" WHERE name ILIKE %s OR device_id ILIKE %s";p.extend([f"%{search}%",f"%{search}%"])
        q+=" ORDER BY created_at DESC LIMIT %s OFFSET %s";p.extend([size,(page-1)*size])
        rows=db_exec(q,p,fetch=True) or []
        tc=db_exec("SELECT count(*) as c FROM istss_devices",fetch=True)
        return {"devices":[{**r,"created_at":str(r.get("created_at","")),"last_heartbeat":str(r.get("last_heartbeat",""))} for r in rows],"total":tc[0]["c"] if tc else 0}
    return {"devices":[],"total":0}
@app.post("/api/v1/devices",status_code=201)
async def create_device(r:DeviceReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:
        try:db_exec("INSERT INTO istss_devices(id,device_id,name,chowk_id,city_id,type,status,location,network,tailscale_ip,ssh_user,ssh_password,cpu_percent,memory_percent,temperature,disk_percent) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(r.device_id,r.device_id,r.name or r.device_id,r.chowk_id,r.city_id,r.type,r.status,r.location,r.network,r.tailscale_ip,r.ssh_user,r.ssh_password,r.cpu_percent,r.memory_percent,r.temperature,r.disk_percent))
        except:raise HTTPException(400,detail="Device ID already exists")
    log_audit(u["sub"],"create","devices",{"id":r.device_id});return {"message":"Registered","device":{"id":r.device_id}}
@app.put("/api/v1/devices/{id}")
async def update_device(id:str,r:DeviceReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("UPDATE istss_devices SET name=%s,chowk_id=%s,city_id=%s,type=%s,status=%s,location=%s,network=%s,tailscale_ip=%s,ssh_user=%s,ssh_password=%s,cpu_percent=%s,memory_percent=%s,temperature=%s,disk_percent=%s WHERE id=%s",(r.name or r.device_id,r.chowk_id,r.city_id,r.type,r.status,r.location,r.network,r.tailscale_ip,r.ssh_user,r.ssh_password,r.cpu_percent,r.memory_percent,r.temperature,r.disk_percent,id))
    log_audit(u["sub"],"update","devices",{"id":id});return {"message":"Updated"}
@app.delete("/api/v1/devices/{id}")
async def delete_device(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_devices WHERE id=%s",(id,))
    log_audit(u["sub"],"delete","devices",{"id":id});return {"message":"Deleted"}

# --- DEVICE SSH LIVE STATUS ---
def ssh_exec(ip,user,password,cmd,timeout=15):
    """SSH into device using sshpass + ssh, with Tailscale proxy for 100.x IPs"""
    import subprocess as sp
    ts_sock="/tmp/tailscale.sock"
    ssh_opts=["-o","StrictHostKeyChecking=no","-o","UserKnownHostsFile=/dev/null","-o",f"ConnectTimeout={timeout}"]
    # Use tailscale nc as ProxyCommand for Tailscale IPs
    if os.path.exists(ts_sock) and ip.startswith("100."):
        ssh_opts+=["-o",f"ProxyCommand=tailscale --socket={ts_sock} nc %h %p"]
    try:
        r=sp.run(["sshpass","-p",password,"ssh"]+ssh_opts+[f"{user}@{ip}",cmd],capture_output=True,text=True,timeout=timeout+5)
        return r.stdout.strip() if r.returncode==0 else f"ERROR: {r.stderr.strip() or r.stdout.strip() or 'SSH failed'}"
    except sp.TimeoutExpired:
        return "ERROR: SSH connection timed out"
    except FileNotFoundError:
        # sshpass not installed, try without it (will fail for password auth but worth trying)
        try:
            r=sp.run(["ssh"]+ssh_opts+[f"{user}@{ip}",cmd],capture_output=True,text=True,timeout=timeout+5,input=password+"\n")
            return r.stdout.strip() if r.returncode==0 else f"ERROR: {r.stderr.strip()}"
        except:return "ERROR: sshpass not available, install with: apt-get install sshpass"
    except Exception as e:
        return f"ERROR: {str(e)}"

@app.get("/api/v1/devices/{id}/live-status")
async def device_live_status(id:str,u:dict=Depends(auth)):
    """SSH into device and pull real-time system stats"""
    if not USE_PG:raise HTTPException(400,detail="DB required")
    rows=db_exec("SELECT tailscale_ip,ssh_user,ssh_password FROM istss_devices WHERE id=%s",(id,),fetch=True)
    if not rows or not rows[0].get("tailscale_ip"):raise HTTPException(404,detail="Device not found or no Tailscale IP configured")
    d=rows[0];ip=d["tailscale_ip"];user=d["ssh_user"];pwd=d["ssh_password"]
    if not user or not pwd:raise HTTPException(400,detail="SSH credentials not configured for this device")
    # Pull system stats in one SSH session
    cmd="""python3 -c "
import json,os,subprocess
try:
    import psutil
    cpu=psutil.cpu_percent(interval=1)
    mem=psutil.virtual_memory()
    disk=psutil.disk_usage('/')
    try:temp=psutil.sensors_temperatures().get('cpu_thermal',[{}])[0].current if hasattr(psutil,'sensors_temperatures') else 0
    except:temp=0
    uptime=int((psutil.boot_time()))
    print(json.dumps({'cpu':cpu,'memory':mem.percent,'disk':disk.percent,'temperature':temp,'total_ram_mb':round(mem.total/1048576),'used_ram_mb':round(mem.used/1048576),'total_disk_gb':round(disk.total/1073741824,1),'used_disk_gb':round(disk.used/1073741824,1),'boot_time':uptime,'hostname':os.uname().nodename,'ip':subprocess.getoutput('hostname -I').strip().split()[0] if subprocess.getoutput('hostname -I').strip() else '','online':True}))
except Exception as e:
    print(json.dumps({'error':str(e),'online':False}))
" 2>/dev/null || echo '{"error":"psutil not installed","online":false}'"""
    result=ssh_exec(ip,user,pwd,cmd)
    try:
        data=json.loads(result)
        # Update device stats in DB
        if data.get("online"):
            db_exec("UPDATE istss_devices SET cpu_percent=%s,memory_percent=%s,temperature=%s,disk_percent=%s,status='online',last_heartbeat=NOW() WHERE id=%s",(data.get("cpu",0),data.get("memory",0),data.get("temperature",0),data.get("disk",0),id))
        return {"device_id":id,"live":True,"stats":data}
    except:
        return {"device_id":id,"live":False,"raw":result,"error":"Could not parse device response"}

@app.get("/api/v1/devices/{id}/logs")
async def device_logs(id:str,lines:int=Query(50,ge=10,le=500),log_file:str=Query("syslog"),u:dict=Depends(auth)):
    """SSH into device and pull log file contents"""
    if not USE_PG:raise HTTPException(400,detail="DB required")
    rows=db_exec("SELECT tailscale_ip,ssh_user,ssh_password FROM istss_devices WHERE id=%s",(id,),fetch=True)
    if not rows or not rows[0].get("tailscale_ip"):raise HTTPException(404,detail="Device not found or no Tailscale IP configured")
    d=rows[0];ip=d["tailscale_ip"];user=d["ssh_user"];pwd=d["ssh_password"]
    if not user or not pwd:raise HTTPException(400,detail="SSH credentials not configured")
    # Safe log file paths
    safe_logs={"syslog":"/var/log/syslog","istss":"/home/*/istss*.log","traffic":"/home/*/traffic*.log","detection":"/home/*/detection*.log","signal":"/home/*/signal*.log","dmesg":"dmesg"}
    log_path=safe_logs.get(log_file)
    if not log_path:raise HTTPException(400,detail=f"Invalid log file. Valid: {', '.join(safe_logs.keys())}")
    if log_file=="dmesg":
        cmd=f"dmesg | tail -n {lines}"
    else:
        cmd=f"tail -n {lines} {log_path} 2>/dev/null || echo 'Log file not found: {log_path}'"
    result=ssh_exec(ip,user,pwd,cmd,timeout=15)
    return {"device_id":id,"log_file":log_file,"lines":lines,"content":result}

@app.get("/api/v1/devices/{id}/processes")
async def device_processes(id:str,u:dict=Depends(auth)):
    """SSH into device and list running ISTSS-related processes"""
    if not USE_PG:raise HTTPException(400,detail="DB required")
    rows=db_exec("SELECT tailscale_ip,ssh_user,ssh_password FROM istss_devices WHERE id=%s",(id,),fetch=True)
    if not rows or not rows[0].get("tailscale_ip"):raise HTTPException(404,detail="Device not found")
    d=rows[0];ip=d["tailscale_ip"];user=d["ssh_user"];pwd=d["ssh_password"]
    if not user or not pwd:raise HTTPException(400,detail="SSH credentials not configured")
    cmd="ps aux | grep -E 'python|istss|traffic|detection|signal|camera' | grep -v grep"
    result=ssh_exec(ip,user,pwd,cmd)
    processes=[]
    for line in result.strip().split("\n"):
        if line.strip():
            parts=line.split(None,10)
            if len(parts)>=11:
                processes.append({"user":parts[0],"pid":parts[1],"cpu":parts[2],"mem":parts[3],"command":parts[10]})
    return {"device_id":id,"processes":processes,"raw":result}
@app.post("/api/v1/devices/heartbeat",status_code=202)
async def heartbeat(r:HeartbeatReq):
    if USE_PG:db_exec("UPDATE istss_devices SET cpu_percent=%s,memory_percent=%s,temperature=%s,disk_percent=%s,status=%s,last_heartbeat=NOW() WHERE id=%s",(r.cpu_percent,r.memory_percent,r.temperature,r.disk_percent,"online" if r.network_connected else "offline",r.device_id))
    return {"message":"Recorded"}

# === VIOLATIONS ===
@app.get("/api/v1/violations")
async def list_violations(page:int=Query(1,ge=1),size:int=Query(50),search:str=Query(""),violation_type:str=Query(""),status_filter:str=Query(""),u:dict=Depends(auth)):
    if USE_PG:
        q="SELECT * FROM istss_violations WHERE 1=1";p=[]
        if search:q+=" AND (violation_type ILIKE %s OR number_plate ILIKE %s)";p.extend([f"%{search}%",f"%{search}%"])
        if violation_type:q+=" AND violation_type=%s";p.append(violation_type)
        if status_filter:q+=" AND status=%s";p.append(status_filter)
        q+=" ORDER BY created_at DESC LIMIT %s OFFSET %s";p.extend([size,(page-1)*size])
        rows=db_exec(q,p,fetch=True) or []
        tc=db_exec("SELECT count(*) as c FROM istss_violations",fetch=True)
        return {"violations":[{**r,"created_at":str(r.get("created_at",""))} for r in rows],"total":tc[0]["c"] if tc else 0}
    return {"violations":[],"total":0}
@app.post("/api/v1/violations",status_code=201)
async def create_violation(r:ViolationReq,u:dict=Depends(auth)):
    id=uid()
    if USE_PG:
        db_exec("INSERT INTO istss_violations(id,violation_type,vehicle_type,number_plate,chowk_id,device_id,city_id,confidence,lane,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,'new')",(id,sanitize(r.violation_type),sanitize(r.vehicle_type),sanitize(r.number_plate).upper(),r.chowk_id,r.device_id,r.city_id,r.confidence,r.lane))
        db_exec("INSERT INTO istss_notifications(id,message,priority,type) VALUES(%s,%s,'high','violation')",(uid(),f"{r.violation_type} - {r.vehicle_type} ({r.number_plate})"))
        # WhatsApp routing
        assignments=db_exec("SELECT * FROM istss_assignments WHERE chowk_id=%s",(r.chowk_id,),fetch=True) or []
        hour=datetime.now(timezone.utc).hour
        for a in assignments:
            oid=a.get("morning_officer_id") if 0<=hour<14 else a.get("afternoon_officer_id")
            if oid:
                offs=db_exec("SELECT * FROM istss_officers WHERE id=%s",(oid,),fetch=True)
                if offs:db_exec("INSERT INTO istss_whatsapp_logs(id,violation_id,officer_id,whatsapp_number,message,delivery_status) VALUES(%s,%s,%s,%s,%s,'sent')",(uid(),id,oid,offs[0]["whatsapp_number"],f"Alert: {r.violation_type} at {r.chowk_id}"))
    log_audit(u["sub"],"create","violations",{"type":r.violation_type});return {"message":"Recorded","violation":{"id":id}}
@app.put("/api/v1/violations/{id}")
async def update_violation(id:str,r:StatusReq,u:dict=Depends(require_role("super_admin","city_admin","traffic_police"))):
    if USE_PG:db_exec("UPDATE istss_violations SET status=%s,notes=%s WHERE id=%s",(r.status,sanitize(r.notes),id))
    log_audit(u["sub"],"update","violations",{"id":id});return {"message":"Updated"}
@app.delete("/api/v1/violations/{id}")
async def delete_violation(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_violations WHERE id=%s",(id,))
    log_audit(u["sub"],"delete","violations",{"id":id});return {"message":"Deleted"}

# === NOTIFICATIONS ===
@app.get("/api/v1/notifications")
async def list_notifs(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_notifications ORDER BY created_at DESC LIMIT 50",fetch=True) or []
        return {"notifications":[{**r,"created_at":str(r.get("created_at",""))} for r in rows]}
    return {"notifications":[]}
@app.post("/api/v1/notifications",status_code=201)
async def create_notif(r:NotifReq,u:dict=Depends(auth)):
    id=uid()
    if USE_PG:db_exec("INSERT INTO istss_notifications(id,message,priority,type) VALUES(%s,%s,%s,%s)",(id,sanitize(r.message),r.priority,r.type))
    return {"message":"Created","notification":{"id":id}}
@app.delete("/api/v1/notifications/{id}")
async def delete_notif(id:str,u:dict=Depends(auth)):
    if USE_PG:db_exec("DELETE FROM istss_notifications WHERE id=%s",(id,))
    return {"message":"Deleted"}

# === OFFICERS ===
@app.get("/api/v1/officers")
async def list_officers(search:str=Query(""),u:dict=Depends(auth)):
    if USE_PG:
        q="SELECT * FROM istss_officers";p=[]
        if search:q+=" WHERE officer_name ILIKE %s";p.append(f"%{search}%")
        q+=" ORDER BY created_at DESC"
        rows=db_exec(q,p,fetch=True) or []
        return {"officers":[{**r,"created_at":str(r.get("created_at",""))} for r in rows],"total":len(rows)}
    return {"officers":[],"total":0}
@app.post("/api/v1/officers",status_code=201)
async def create_officer(r:OfficerReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    id=uid()
    if USE_PG:
        dup=db_exec("SELECT id FROM istss_officers WHERE whatsapp_number=%s",(r.whatsapp_number,),fetch=True)
        if dup:raise HTTPException(400,detail="WhatsApp number already registered")
        db_exec("INSERT INTO istss_officers(id,officer_name,badge_number,mobile_number,whatsapp_number,designation,police_station,city,city_id,status) VALUES(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",(id,r.officer_name,r.badge_number,r.mobile_number,r.whatsapp_number,r.designation,r.police_station,r.city,r.city_id,r.status))
    log_audit(u["sub"],"create","officers",{"name":r.officer_name});return {"message":"Added","officer":{"id":id}}
@app.put("/api/v1/officers/{id}")
async def update_officer(id:str,r:OfficerReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("UPDATE istss_officers SET officer_name=%s,badge_number=%s,mobile_number=%s,whatsapp_number=%s,designation=%s,police_station=%s,city=%s,city_id=%s,status=%s WHERE id=%s",(r.officer_name,r.badge_number,r.mobile_number,r.whatsapp_number,r.designation,r.police_station,r.city,r.city_id,r.status,id))
    log_audit(u["sub"],"update","officers",{"id":id});return {"message":"Updated"}
@app.delete("/api/v1/officers/{id}")
async def delete_officer(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_officers WHERE id=%s",(id,))
    log_audit(u["sub"],"delete","officers",{"id":id});return {"message":"Deleted"}

# === ASSIGNMENTS ===
@app.get("/api/v1/assignments")
async def list_assignments(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("""SELECT a.*,c.name as chowk_name,
            mo.officer_name as morning_name,mo.whatsapp_number as morning_wa,
            ao.officer_name as afternoon_name,ao.whatsapp_number as afternoon_wa
            FROM istss_assignments a
            LEFT JOIN istss_chowks c ON a.chowk_id=c.id
            LEFT JOIN istss_officers mo ON a.morning_officer_id=mo.id
            LEFT JOIN istss_officers ao ON a.afternoon_officer_id=ao.id
            ORDER BY a.created_at DESC""",fetch=True) or []
        return {"assignments":[{**r,"created_at":str(r.get("created_at","")),"updated_at":str(r.get("updated_at","")),"chowk":{"name":r.get("chowk_name","")},"morning_officer":{"officer_name":r.get("morning_name",""),"whatsapp_number":r.get("morning_wa","")},"afternoon_officer":{"officer_name":r.get("afternoon_name",""),"whatsapp_number":r.get("afternoon_wa","")}} for r in rows],"total":len(rows)}
    return {"assignments":[],"total":0}
@app.post("/api/v1/assignments",status_code=201)
async def create_assignment(r:AssignmentReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    id=uid()
    if USE_PG:
        dup=db_exec("SELECT id FROM istss_assignments WHERE chowk_id=%s",(r.chowk_id,),fetch=True)
        if dup:raise HTTPException(400,detail="Assignment exists for this chowk")
        db_exec("INSERT INTO istss_assignments(id,chowk_id,city_id,morning_officer_id,afternoon_officer_id,updated_by,updated_at) VALUES(%s,%s,%s,%s,%s,%s,NOW())",(id,r.chowk_id,r.city_id,r.morning_officer_id,r.afternoon_officer_id,u["sub"]))
    log_audit(u["sub"],"create","assignments",{});return {"message":"Created","assignment":{"id":id}}
@app.put("/api/v1/assignments/{id}")
async def update_assignment(id:str,r:AssignmentReq,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("UPDATE istss_assignments SET chowk_id=%s,morning_officer_id=%s,afternoon_officer_id=%s,updated_by=%s,updated_at=NOW() WHERE id=%s",(r.chowk_id,r.morning_officer_id,r.afternoon_officer_id,u["sub"],id))
    return {"message":"Updated"}
@app.delete("/api/v1/assignments/{id}")
async def delete_assignment(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_assignments WHERE id=%s",(id,))
    return {"message":"Deleted"}

# === EVIDENCE ===
@app.get("/api/v1/evidence")
async def list_evidence(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_evidence ORDER BY created_at DESC",fetch=True) or []
        return {"evidence":[{**r,"created_at":str(r.get("created_at",""))} for r in rows],"total":len(rows)}
    return {"evidence":[],"total":0}
@app.post("/api/v1/evidence",status_code=201)
async def create_evidence(r:EvidenceReq,u:dict=Depends(auth)):
    id=uid()
    if USE_PG:db_exec("INSERT INTO istss_evidence(id,violation_id,file_url,file_type,sha256_hash,notes,status) VALUES(%s,%s,%s,%s,%s,%s,'pending')",(id,r.violation_id,r.file_url,r.file_type,r.sha256_hash,r.notes))
    return {"message":"Uploaded","evidence":{"id":id}}
@app.put("/api/v1/evidence/{id}")
async def update_evidence(id:str,r:StatusReq,u:dict=Depends(auth)):
    if USE_PG:db_exec("UPDATE istss_evidence SET status=%s WHERE id=%s",(r.status,id))
    return {"message":"Updated"}
@app.delete("/api/v1/evidence/{id}")
async def delete_evidence(id:str,u:dict=Depends(auth)):
    if USE_PG:db_exec("DELETE FROM istss_evidence WHERE id=%s",(id,))
    return {"message":"Deleted"}

# === ANALYTICS ===
@app.get("/api/v1/analytics/signal")
async def list_signal(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_signal_analytics ORDER BY created_at DESC LIMIT 100",fetch=True) or []
        return {"analytics":[{**r,"date":str(r.get("date","")),"created_at":str(r.get("created_at",""))} for r in rows],"total":len(rows)}
    return {"analytics":[],"total":0}
@app.post("/api/v1/analytics/signal",status_code=201)
async def create_signal(r:AnalyticsReq,u:dict=Depends(auth)):
    id=uid();avg=round(r.total_time_saved/max(r.total_vehicles,1),2)
    if USE_PG:db_exec("INSERT INTO istss_signal_analytics(id,chowk_id,city_id,date,total_vehicles,average_waiting_time,total_waiting_time,total_time_saved,signal_cycle_duration,queue_length,avg_time_saved_per_vehicle) VALUES(%s,%s,%s,CURRENT_DATE,%s,%s,%s,%s,%s,%s,%s)",(id,r.chowk_id,r.city_id,r.total_vehicles,r.average_waiting_time,r.total_waiting_time,r.total_time_saved,r.signal_cycle_duration,r.queue_length,avg))
    return {"message":"Recorded","record":{"id":id}}
@app.get("/api/v1/analytics/co2")
async def list_co2(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_co2_analytics ORDER BY created_at DESC LIMIT 100",fetch=True) or []
        return {"analytics":[{**r,"date":str(r.get("date","")),"created_at":str(r.get("created_at",""))} for r in rows],"total":len(rows)}
    return {"analytics":[],"total":0}
@app.post("/api/v1/analytics/co2",status_code=201)
async def create_co2(r:CO2Req,u:dict=Depends(auth)):
    id=uid();trees=round(r.estimated_co2_saved/21.77,1) if r.estimated_co2_saved>0 else 0;score=round(min(r.estimated_co2_saved/max(r.estimated_co2_generated,1)*100,100),1)
    if USE_PG:db_exec("INSERT INTO istss_co2_analytics(id,chowk_id,city_id,date,total_vehicles,estimated_co2_generated,estimated_co2_saved,fuel_saved,trees_equivalent,net_zero_score) VALUES(%s,%s,%s,CURRENT_DATE,%s,%s,%s,%s,%s,%s)",(id,r.chowk_id,r.city_id,r.total_vehicles,r.estimated_co2_generated,r.estimated_co2_saved,r.fuel_saved,trees,score))
    return {"message":"Recorded","record":{"id":id}}

# === WHATSAPP LOGS ===
@app.get("/api/v1/whatsapp-logs")
async def wa_logs(u:dict=Depends(auth)):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_whatsapp_logs ORDER BY sent_time DESC LIMIT 100",fetch=True) or []
        return {"logs":[{**r,"sent_time":str(r.get("sent_time",""))} for r in rows],"total":len(rows)}
    return {"logs":[],"total":0}

# === ADMIN ===
@app.get("/api/v1/admin/audit-logs")
async def audit_logs(u:dict=Depends(require_role("super_admin","auditor"))):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_audit_logs ORDER BY created_at DESC LIMIT 100",fetch=True) or []
        return {"audit_logs":[{**r,"created_at":str(r.get("created_at","")),"details":r.get("details",{})} for r in rows],"total":len(rows)}
    return {"audit_logs":[],"total":0}
@app.get("/api/v1/admin/pending-users")
async def pending_users(u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:
        rows=db_exec("SELECT * FROM istss_users WHERE status='pending'",fetch=True) or []
        return {"pending_users":[{**r,"created_at":str(r.get("created_at",""))} for r in rows]}
    return {"pending_users":[]}
@app.put("/api/v1/admin/users/{id}/approve")
async def approve_user(id:str,u:dict=Depends(require_role("super_admin","city_admin"))):
    if USE_PG:db_exec("UPDATE istss_users SET status='approved' WHERE id=%s",(id,))
    log_audit(u["sub"],"approve","users",{"id":id});return {"message":"Approved"}
@app.delete("/api/v1/admin/users/{id}")
async def delete_user(id:str,u:dict=Depends(require_role("super_admin"))):
    if USE_PG:db_exec("DELETE FROM istss_users WHERE id=%s",(id,))
    return {"message":"Deleted"}

@app.get("/api/v1/marquee")
async def marquee(u:dict=Depends(auth)):return {"messages":[]}
@app.post("/api/v1/marquee",status_code=201)
async def create_marquee(u:dict=Depends(auth)):return {"message":"Created"}

@app.get("/api/v1/settings/{key}")
async def get_setting(key:str,u:dict=Depends(auth)):
    key=sanitize(key)
    if USE_PG:
        rows=db_exec("SELECT value FROM istss_settings WHERE key=%s",(key,),fetch=True)
        if rows:return {"key":key,"value":rows[0]["value"]}
    return {"key":key,"value":None}

@app.put("/api/v1/settings/{key}")
async def put_setting(key:str,body:Dict[str,Any],u:dict=Depends(auth)):
    key=sanitize(key)
    value=body.get("value",{})
    if USE_PG:
        db_exec("INSERT INTO istss_settings(key,value,updated_at) VALUES(%s,%s,NOW()) ON CONFLICT(key) DO UPDATE SET value=%s,updated_at=NOW()",(key,json.dumps(value),json.dumps(value)))
    log_audit(u["sub"],"update_setting","settings",{"key":key})
    return {"message":"Setting saved","key":key}

@app.get("/health")
async def health():return {"status":"healthy","version":"5.0.0","db_mode":"postgresql" if USE_PG else "in-memory","endpoints":55,"timestamp":now()}
@app.get("/")
async def root():return {"service":"ISTSS API","version":"5.0.0","company":"Datamorphosis Technologies Pvt. Ltd.","docs":"/api/docs","db":"postgresql" if USE_PG else "in-memory","endpoints":55}
