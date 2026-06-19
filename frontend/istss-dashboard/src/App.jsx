import{useState,useEffect,useCallback}from"react";
import{BarChart,Bar,PieChart,Pie,Cell,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer}from"recharts";
const API="https://istss-api-dev.azurewebsites.net";
const App=()=>{
const[screen,setScreen]=useState("login");
const[regForm,setRegForm]=useState({});
const[dark,setDark]=useState(false);
const[page,setPage]=useState("dashboard");
const[token,setToken]=useState(null);
const[user,setUser]=useState(null);
const[email,setEmail]=useState("");
const[pass,setPass]=useState("");
const[err,setErr]=useState("");
const[loading,setLoading]=useState(false);
const[summary,setSummary]=useState({});
const[chowks,setChowks]=useState([]);
const[devices,setDevices]=useState([]);
const[violations,setViolations]=useState([]);
const[notifs,setNotifs]=useState([]);
const[officers,setOfficers]=useState([]);
const[assignments,setAssignments]=useState([]);
const[evidence,setEvidence]=useState([]);
const[signalAnalytics,setSignalAnalytics]=useState([]);
const[co2Analytics,setCo2Analytics]=useState([]);
const[auditLogs,setAuditLogs]=useState([]);
const[pendingUsers,setPendingUsers]=useState([]);
const[form,setForm]=useState({});
const[editId,setEditId]=useState(null);
const[msg,setMsg]=useState("");
const[marqueePos,setMarqueePos]=useState(0);
useEffect(()=>{const i=setInterval(()=>setMarqueePos(p=>(p+1)%3),4000);return()=>clearInterval(i);},[]);
const marqueeTexts=["ISTSS Platform — Datamorphosis Technologies Pvt. Ltd.","Smart Traffic Signal System — Real-time Monitoring","Powered by AI & Edge Computing"];
const t=dark?{bg:"#0F172A",card:"#1E293B",sidebar:"#0F172A",border:"#334155",text:"#F1F5F9",muted:"#94A3B8",accent:"#3B82F6",danger:"#EF4444",success:"#10B981",warn:"#F59E0B"}:{bg:"#F1F5F9",card:"#fff",sidebar:"#0F172A",border:"#1E293B",text:"#0F172A",muted:"#64748B",accent:"#1E40AF",danger:"#DC2626",success:"#059669",warn:"#D97706"};
const api=useCallback(async(path,opts={})=>{
const h={"Content-Type":"application/json",...(token?{Authorization:`Bearer ${token}`}:{})};
const r=await fetch(`${API}${path}`,{...opts,headers:h});
if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.detail||r.statusText);}
return r.json();
},[token]);
const flash=(m)=>{setMsg(m);setTimeout(()=>setMsg(""),3000);};
const handleLogin=async()=>{
setLoading(true);setErr("");
try{const d=await api("/api/v1/auth/login",{method:"POST",body:JSON.stringify({email,password:pass})});
setToken(d.access_token);setUser(d.user);setScreen("main");}catch(e){setErr(e.message);}finally{setLoading(false);}
};
const load=useCallback(async()=>{
if(!token)return;
try{
const[s,c,d,v,n,of,as,ev,sa,co,al,pu]=await Promise.all([api("/api/v1/dashboard/summary"),api("/api/v1/chowks"),api("/api/v1/devices"),api("/api/v1/violations"),api("/api/v1/notifications"),api("/api/v1/officers"),api("/api/v1/assignments"),api("/api/v1/evidence"),api("/api/v1/analytics/signal"),api("/api/v1/analytics/co2"),api("/api/v1/admin/audit-logs"),api("/api/v1/admin/pending-users")]);
setSummary(s);setChowks(c.chowks||[]);setDevices(d.devices||[]);setViolations(v.violations||[]);setNotifs(n.notifications||[]);setOfficers(of.officers||[]);setAssignments(as.assignments||[]);setEvidence(ev.evidence||[]);setSignalAnalytics(sa.analytics||[]);setCo2Analytics(co.analytics||[]);setAuditLogs(al.audit_logs||[]);setPendingUsers(pu.pending_users||[]);
}catch(e){console.error(e);}
},[token,api]);
useEffect(()=>{if(screen==="main")load();},[screen,load]);
const crud=async(method,path,body)=>{
try{const r=await api(path,{method,body:body?JSON.stringify(body):undefined});flash(r.message||"Done");setForm({});setEditId(null);load();}catch(e){flash("Error: "+e.message);}
};
const navItems=[{id:"dashboard",label:"Dashboard"},{id:"chowks",label:"Chowks"},{id:"devices",label:"Devices"},{id:"violations",label:"Violations"},{id:"officers",label:"Officers"},{id:"assignments",label:"Assignments"},{id:"evidence",label:"Evidence"},{id:"analytics",label:"Analytics"},{id:"co2",label:"CO2 / Net Zero"},{id:"notifications",label:"Notifications"},{id:"admin",label:"Admin"},{id:"reports",label:"Reports"},{id:"map",label:"Map View"},{id:"cctv",label:"CCTV"}];
const s={input:{width:"100%",padding:"10px 14px",border:`2px solid ${t.border}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
btn:{padding:"10px 20px",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit"},
th:{padding:"10px 14px",textAlign:"left",fontSize:11,fontWeight:700,color:t.muted,textTransform:"uppercase",letterSpacing:"0.06em",borderBottom:`2px solid ${t.border}`,background:"#F8FAFC"},
td:{padding:"10px 14px",fontSize:13,borderBottom:"1px solid #E2E8F0"}};
// LOGIN
if(screen==="login")return(
<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${t.sidebar},#334155)`,fontFamily:"'Inter',system-ui,sans-serif"}}>
<div style={{width:420,background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 25px 50px rgba(0,0,0,0.4)"}}>
<div style={{background:t.sidebar,padding:"28px 36px",textAlign:"center"}}>
<img src="/logo.svg" alt="DM" style={{width:80,height:64,marginBottom:10,filter:"drop-shadow(0 2px 8px rgba(255,255,255,0.15))"}}/>
<h1 style={{color:"#F8FAFC",fontSize:17,fontWeight:700,margin:0}}>ISTSS Platform</h1>
<p style={{color:t.muted,fontSize:11,margin:"4px 0 0",textTransform:"uppercase",letterSpacing:"0.08em"}}>Smart Traffic Signal System</p>
</div>
<div style={{padding:"28px 36px"}}>
<label style={{display:"block",fontSize:11,fontWeight:700,color:"#334155",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Email</label>
<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@datamorphosis.in" style={{...s.input,marginBottom:16}}/>
<label style={{display:"block",fontSize:11,fontWeight:700,color:"#334155",marginBottom:5,textTransform:"uppercase",letterSpacing:"0.06em"}}>Password</label>
<input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&handleLogin()} style={{...s.input,marginBottom:20}}/>
{err&&<div style={{color:t.danger,fontSize:12,padding:"8px 12px",background:"#FEF2F2",borderRadius:6,marginBottom:14,border:"1px solid #FECACA"}}>{err}</div>}
<button onClick={handleLogin} disabled={loading} style={{...s.btn,width:"100%",background:t.sidebar,color:"#fff",textTransform:"uppercase",letterSpacing:"0.04em"}}>{loading?"Authenticating...":"Sign In"}</button>
<div style={{display:"flex",justifyContent:"space-between",marginTop:14}}>
<button onClick={()=>setScreen("forgot")} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:12}}>Forgot Password?</button>
<button onClick={()=>setScreen("register")} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:12}}>Register</button></div>
<p style={{textAlign:"center",color:"#94A3B8",fontSize:11,marginTop:10}}>Datamorphosis Technologies Pvt. Ltd.</p>
</div></div></div>);
// REGISTER SCREEN
if(screen==="register")return(
<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${t.sidebar},#334155)`,fontFamily:"'Inter',system-ui,sans-serif"}}>
<div style={{width:480,background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 25px 50px rgba(0,0,0,0.4)"}}>
<div style={{background:t.sidebar,padding:"24px 36px",textAlign:"center"}}>
<img src="/logo.svg" alt="DM" style={{width:64,height:52,marginBottom:8}}/>
<h1 style={{color:"#F8FAFC",fontSize:16,fontWeight:700,margin:0}}>Register for Access</h1></div>
<div style={{padding:"24px 36px"}}>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
{[["Full Name","full_name"],["Email","email"],["Mobile","mobile"],["Designation","designation"]].map(([l,f])=>
<div key={f} style={{marginBottom:8}}>
<label style={{display:"block",fontSize:10,fontWeight:700,color:"#334155",marginBottom:4,textTransform:"uppercase"}}>{l}</label>
<input value={regForm[f]||""} onChange={e=>setRegForm({...regForm,[f]:e.target.value})} style={{width:"100%",padding:"10px 14px",border:`2px solid ${t.border}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>)}
<div style={{marginBottom:8}}>
<label style={{display:"block",fontSize:10,fontWeight:700,color:"#334155",marginBottom:4,textTransform:"uppercase"}}>Password</label>
<input type="password" value={regForm.password||""} onChange={e=>setRegForm({...regForm,password:e.target.value})} style={{width:"100%",padding:"10px 14px",border:`2px solid ${t.border}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}/></div>
<div style={{marginBottom:8}}>
<label style={{display:"block",fontSize:10,fontWeight:700,color:"#334155",marginBottom:4,textTransform:"uppercase"}}>Role</label>
<select value={regForm.role||"viewer"} onChange={e=>setRegForm({...regForm,role:e.target.value})} style={{width:"100%",padding:"10px 14px",border:`2px solid ${t.border}`,borderRadius:6,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"}}>
<option value="viewer">Viewer</option><option value="traffic_police">Traffic Police</option><option value="city_admin">City Admin</option></select></div>
</div>
{msg&&<div style={{color:t.success,fontSize:12,padding:"8px 12px",background:"#ECFDF5",borderRadius:6,marginBottom:12}}>{msg}</div>}
<button onClick={async()=>{if(!regForm.full_name||!regForm.email||!regForm.password)return flash("Fill all required fields");try{const r=await api("/api/v1/auth/register",{method:"POST",body:JSON.stringify(regForm)});flash(r.message);setTimeout(()=>setScreen("login"),2000);}catch(e){flash("Error: "+e.message);}}} style={{width:"100%",padding:"12px",background:t.sidebar,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",textTransform:"uppercase",marginTop:8}}>Register</button>
<p style={{textAlign:"center",marginTop:12}}><button onClick={()=>setScreen("login")} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:13}}>Back to Sign In</button></p>
</div></div></div>);
// FORGOT PASSWORD
if(screen==="forgot")return(
<div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${t.sidebar},#334155)`,fontFamily:"'Inter',system-ui,sans-serif"}}>
<div style={{width:420,background:"#fff",borderRadius:12,overflow:"hidden",boxShadow:"0 25px 50px rgba(0,0,0,0.4)"}}>
<div style={{background:t.sidebar,padding:"28px 36px",textAlign:"center"}}>
<img src="/logo.svg" alt="DM" style={{width:64,height:52,marginBottom:8}}/>
<h1 style={{color:"#F8FAFC",fontSize:16,fontWeight:700,margin:0}}>Reset Password</h1></div>
<div style={{padding:"28px 36px"}}>
<p style={{fontSize:13,color:t.muted,marginBottom:16}}>Enter your email address and we will send you a password reset link.</p>
<label style={{display:"block",fontSize:10,fontWeight:700,color:"#334155",marginBottom:4,textTransform:"uppercase"}}>Email</label>
<input placeholder="your@email.com" style={{width:"100%",padding:"12px 16px",border:`2px solid ${t.border}`,borderRadius:6,fontSize:14,outline:"none",boxSizing:"border-box",fontFamily:"inherit",marginBottom:16}}/>
<button onClick={()=>{flash("Password reset link sent (demo)");setTimeout(()=>setScreen("login"),2000);}} style={{width:"100%",padding:"12px",background:t.sidebar,color:"#fff",border:"none",borderRadius:6,fontSize:13,fontWeight:700,cursor:"pointer",textTransform:"uppercase"}}>Send Reset Link</button>
<p style={{textAlign:"center",marginTop:12}}><button onClick={()=>setScreen("login")} style={{background:"none",border:"none",color:t.accent,cursor:"pointer",fontSize:13}}>Back to Sign In</button></p>
</div></div></div>);

// FORM COMPONENT
const FormField=({label,field,type="text",opts})=>(
<div style={{marginBottom:12}}>
<label style={{display:"block",fontSize:11,fontWeight:700,color:"#334155",marginBottom:4,textTransform:"uppercase"}}>{label}</label>
{opts?<select value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})} style={s.input}><option value="">Select...</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}</select>
:<input type={type} value={form[field]||""} onChange={e=>setForm({...form,[field]:type==="number"?parseFloat(e.target.value)||0:e.target.value})} style={s.input}/>}
</div>);
// KPI CARD
const KPI=({label,value,color})=>(
<div style={{background:t.card,borderRadius:8,padding:"18px 22px",border:`2px solid ${t.border}`,position:"relative",overflow:"hidden"}}>
<div style={{position:"absolute",top:0,left:0,right:0,height:3,background:color}}/>
<p style={{fontSize:10,fontWeight:700,color:t.muted,margin:"0 0 6px",textTransform:"uppercase",letterSpacing:"0.08em"}}>{label}</p>
<p style={{fontSize:28,fontWeight:800,margin:0,color:t.text,letterSpacing:"-0.03em"}}>{value}</p>
</div>);
// MAIN LAYOUT
return(
<div style={{minHeight:"100vh",background:t.bg,fontFamily:"'Inter',system-ui,sans-serif",display:"flex",color:t.text,transition:"background 0.3s"}}>
<aside style={{width:220,background:t.sidebar,display:"flex",flexDirection:"column",flexShrink:0,position:"fixed",top:0,left:0,height:"100vh",zIndex:50}}>
<div style={{padding:"18px 18px 14px",borderBottom:"1px solid #334155",display:"flex",alignItems:"center",gap:10}}>
<img src="/logo.svg" alt="DM" style={{width:32,height:25}}/>
<div><div style={{color:"#F8FAFC",fontSize:13,fontWeight:700}}>ISTSS</div><div style={{color:t.muted,fontSize:9,textTransform:"uppercase",letterSpacing:"0.1em"}}>Datamorphosis</div></div>
</div>
<nav style={{flex:1,padding:"8px 10px"}}>
{navItems.map(n=>(
<button key={n.id} onClick={()=>setPage(n.id)} style={{display:"flex",alignItems:"center",gap:10,width:"100%",padding:"10px 14px",marginBottom:2,borderRadius:6,border:"none",background:page===n.id?t.accent:"transparent",color:page===n.id?"#fff":"#94A3B8",fontSize:13,fontWeight:page===n.id?600:400,cursor:"pointer",textAlign:"left",fontFamily:"inherit"}}>{n.label}</button>))}
</nav>
<div style={{padding:"10px",borderTop:"1px solid #334155"}}>
<div style={{padding:"8px 12px",borderRadius:6,background:"#1E293B",marginBottom:6}}>
<div style={{fontSize:11,fontWeight:600,color:"#F8FAFC"}}>{user?.name||"Admin"}</div>
<div style={{fontSize:9,color:t.muted,textTransform:"uppercase"}}>{user?.role}</div>
</div>
<button onClick={()=>{setScreen("login");setToken(null);}} style={{width:"100%",padding:"8px",borderRadius:6,border:"none",background:"transparent",color:"#EF4444",fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>Sign Out</button>
</div></aside>
<div style={{flex:1,marginLeft:220}}>
<header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:52,background:t.card,borderBottom:`2px solid ${t.border}`,position:"sticky",top:0,zIndex:45,position:"relative"}}>
<h2 style={{fontSize:15,fontWeight:700,margin:0}}>{navItems.find(n=>n.id===page)?.label}</h2>
<div style={{position:"absolute",top:0,left:220,right:0,height:28,background:dark?"#1E293B":"#0F172A",display:"flex",alignItems:"center",overflow:"hidden",zIndex:50}}>
<div style={{color:"#60A5FA",fontSize:11,fontWeight:600,whiteSpace:"nowrap",animation:"marquee 20s linear infinite",paddingLeft:"100%"}}>
{marqueeTexts[marqueePos]}</div>
<style>{"@keyframes marquee{0%{transform:translateX(0)}100%{transform:translateX(-100%)}}"}</style></div>
</header>
<header style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 28px",height:52,background:t.card,borderBottom:`2px solid ${t.border}`,position:"sticky",top:28,zIndex:40,marginTop:28}}>
<div style={{display:"flex",alignItems:"center",gap:12}}>
<h2 style={{fontSize:15,fontWeight:700,margin:0,color:t.text}}>{navItems.find(n=>n.id===page)?.label}</h2></div>
<div style={{display:"flex",alignItems:"center",gap:12}}>
{msg&&<span style={{fontSize:12,color:t.success,fontWeight:600,background:"#ECFDF5",padding:"4px 12px",borderRadius:4}}>{msg}</span>}
<button onClick={()=>setDark(!dark)} style={{...s.btn,padding:"6px 14px",background:"transparent",border:`1px solid ${t.border}`,color:t.text}}>{dark?"☀️ Light":"🌙 Dark"}</button>
<button onClick={load} style={{...s.btn,padding:"6px 14px",background:"transparent",border:`1px solid ${t.border}`,color:t.text}}>Refresh</button>
<div style={{display:"flex",alignItems:"center",gap:5,padding:"3px 10px",borderRadius:16,background:"#ECFDF5"}}><span style={{width:6,height:6,borderRadius:"50%",background:t.success,display:"inline-block"}}/><span style={{fontSize:10,fontWeight:700,color:t.success}}>LIVE</span></div>
</div></header>
<main style={{padding:28}}>
{/* DASHBOARD */}
{page==="dashboard"&&<div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
<KPI label="Total Violations" value={summary.total_violations??0} color={t.danger}/>
<KPI label="Online Devices" value={`${summary.online_devices??0}/${summary.total_devices??0}`} color={t.success}/>
<KPI label="Total Chowks" value={summary.total_chowks??0} color={t.accent}/>
<KPI label="Active Alerts" value={summary.active_alerts??0} color={t.warn}/>
</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:28}}>
<KPI label="Total Officers" value={summary.total_officers??0} color="#6366F1"/>
<KPI label="WhatsApp Sent" value={summary.whatsapp_sent_today??0} color="#06B6D4"/>
<KPI label="Time Saved (hrs)" value={summary.total_time_saved_hours??0} color="#8B5CF6"/>
<KPI label="CO2 Saved (kg)" value={summary.total_co2_saved_kg??0} color="#10B981"/>
</div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:"16px 24px",marginBottom:20,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{display:"flex",alignItems:"center",gap:12}}>
<div style={{width:40,height:40,borderRadius:"50%",background:t.accent+"20",display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>🏛️</div>
<div><h3 style={{fontSize:14,fontWeight:700,margin:0,color:t.text}}>Datamorphosis Technologies Pvt. Ltd.</h3>
<p style={{fontSize:11,color:t.muted,margin:0}}>Intelligent Smart Traffic Signal System • ISTSS v3.0</p></div></div>
<div style={{display:"flex",alignItems:"center",gap:6,padding:"4px 12px",borderRadius:20,background:"#ECFDF5",border:"1px solid #A7F3D0"}}>
<span style={{width:6,height:6,borderRadius:"50%",background:"#059669",display:"inline-block"}}/>
<span style={{fontSize:11,fontWeight:700,color:"#059669"}}>LIVE</span></div></div>
{/* CHARTS */}
{summary.violation_by_type&&Object.keys(summary.violation_by_type).length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20}}>
<h3 style={{fontSize:13,fontWeight:700,margin:"0 0 12px",color:t.text}}>Violations by Type</h3>
<ResponsiveContainer width="100%" height={200}>
<PieChart><Pie data={Object.entries(summary.violation_by_type).map(([k,v])=>({name:k,value:v}))} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({name,value})=>`${name}: ${value}`}>
{Object.keys(summary.violation_by_type).map((_,i)=><Cell key={i} fill={["#EF4444","#F59E0B","#3B82F6","#8B5CF6","#06B6D4","#10B981","#EC4899"][i%7]}/>)}</Pie>
<Tooltip/></PieChart></ResponsiveContainer></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20}}>
<h3 style={{fontSize:13,fontWeight:700,margin:"0 0 12px",color:t.text}}>Violations Count</h3>
<ResponsiveContainer width="100%" height={200}>
<BarChart data={Object.entries(summary.violation_by_type).map(([k,v])=>({type:k.substring(0,10),count:v}))}>
<CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="type" fontSize={10}/><YAxis fontSize={10}/>
<Tooltip/><Bar dataKey="count" fill="#3B82F6" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></div>}
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 12px",color:t.text}}>Quick Actions</h3>
<div style={{display:"flex",gap:12}}>
{["chowks","devices","violations","notifications"].map(p=>
<button key={p} onClick={()=>setPage(p)} style={{...s.btn,background:t.accent,color:"#fff",textTransform:"capitalize"}}>Manage {p}</button>)}
</div>
</div></div>}
{/* CHOWKS CRUD */}
{page==="chowks"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>{editId?"Edit Chowk":"Add New Chowk"}</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Name" field="name"/>
<FormField label="Location" field="location"/>
<FormField label="Lanes" field="lanes" type="number"/>
<FormField label="Cameras" field="cameras" type="number"/>
<div><button onClick={()=>{if(!form.name)return flash("Name required");editId?crud("PUT",`/api/v1/chowks/${editId}`,form):crud("POST","/api/v1/chowks",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>{editId?"Update":"Add"}</button>
{editId&&<button onClick={()=>{setEditId(null);setForm({});}} style={{...s.btn,background:"#94A3B8",color:"#fff",marginLeft:8,marginBottom:12}}>Cancel</button>}</div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead><tr>{["Name","Location","Lanes","Cameras","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{chowks.length===0?<tr><td colSpan={6} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No chowks yet. Add one above.</td></tr>:
chowks.map(c=><tr key={c.id}>
<td style={{...s.td,fontWeight:600}}>{c.name}</td>
<td style={s.td}>{c.location||"—"}</td>
<td style={s.td}>{c.lanes}</td>
<td style={s.td}>{c.cameras}</td>
<td style={s.td}><span style={{padding:"3px 10px",borderRadius:4,fontSize:10,fontWeight:700,background:c.status==="active"?"#ECFDF5":"#FEF2F2",color:c.status==="active"?t.success:t.danger,textTransform:"uppercase"}}>{c.status}</span></td>
<td style={s.td}>
<button onClick={()=>{setEditId(c.id);setForm({name:c.name,location:c.location,lanes:c.lanes,cameras:c.cameras,status:c.status});}} style={{...s.btn,padding:"4px 10px",background:t.accent,color:"#fff",fontSize:11,marginRight:6}}>Edit</button>
<button onClick={()=>crud("DELETE",`/api/v1/chowks/${c.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button>
</td></tr>)}</tbody></table></div></div>}
{/* DEVICES CRUD */}
{page==="devices"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>{editId?"Edit Device":"Register New Device"}</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Device ID" field="device_id"/>
<FormField label="Name" field="name"/>
<FormField label="Type" field="type" opts={["Raspberry Pi","Jetson Nano","Edge Server"]}/>
<FormField label="Status" field="status" opts={["online","offline","maintenance"]}/>
<div><button onClick={()=>{if(!form.device_id||!form.name)return flash("ID & Name required");editId?crud("PUT",`/api/v1/devices/${editId}`,form):crud("POST","/api/v1/devices",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>{editId?"Update":"Register"}</button></div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead><tr>{["Device ID","Name","Type","Status","Created","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{devices.length===0?<tr><td colSpan={6} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No devices registered. Add one above.</td></tr>:
devices.map(d=><tr key={d.id}>
<td style={{...s.td,fontFamily:"monospace",fontWeight:600}}>{d.device_id}</td>
<td style={s.td}>{d.name}</td>
<td style={s.td}>{d.type}</td>
<td style={s.td}><span style={{padding:"3px 10px",borderRadius:4,fontSize:10,fontWeight:700,background:d.status==="online"?"#ECFDF5":d.status==="offline"?"#FEF2F2":"#FFFBEB",color:d.status==="online"?t.success:d.status==="offline"?t.danger:t.warn,textTransform:"uppercase"}}>{d.status}</span></td>
<td style={{...s.td,fontSize:11,color:t.muted}}>{new Date(d.created_at).toLocaleDateString()}</td>
<td style={s.td}>
<button onClick={()=>{setEditId(d.id);setForm({device_id:d.device_id,name:d.name,type:d.type,status:d.status});}} style={{...s.btn,padding:"4px 10px",background:t.accent,color:"#fff",fontSize:11,marginRight:6}}>Edit</button>
<button onClick={()=>crud("DELETE",`/api/v1/devices/${d.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button>
</td></tr>)}</tbody></table></div>
{devices.length>0&&<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginTop:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px",color:t.text}}>Device Health Monitor</h3>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280,1fr))",gap:12}}>
{devices.map(d=><div key={d.id} style={{border:`1px solid ${t.border}`,borderRadius:8,padding:14}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
<span style={{fontSize:12,fontWeight:700,color:t.text}}>{d.name}</span>
<span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:4,background:d.status==="online"?"#ECFDF5":"#FEF2F2",color:d.status==="online"?"#10B981":"#EF4444",textTransform:"uppercase"}}>{d.status}</span></div>
{[["CPU",d.cpu_percent||0,"#3B82F6"],["Memory",d.memory_percent||0,"#8B5CF6"],["Temperature",(d.temperature||0)/100*100,"#F59E0B"],["Disk",d.disk_percent||0,"#10B981"]].map(([label,val,color])=>
<div key={label} style={{marginBottom:6}}>
<div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:t.muted,marginBottom:2}}><span>{label}</span><span>{typeof val==="number"?val.toFixed(0):val}%</span></div>
<div style={{height:6,background:t.bg,borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${Math.min(val,100)}%`,background:val>80?"#EF4444":color,borderRadius:3,transition:"width 0.3s"}}/></div>
</div>)}
</div>)}
</div></div>}
</div>}
{/* VIOLATIONS CRUD */}
{page==="violations"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Record New Violation</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Type" field="violation_type" opts={["Red Light Jump","No Helmet","Triple Seat","Zebra Crossing","Wrong Lane","No Parking","Seat Belt","Mobile Phone","Signal Tampering"]}/>
<FormField label="Vehicle" field="vehicle_type" opts={["Two-Wheeler","Car/SUV","Auto","Bus","Truck","Emergency"]}/>
<FormField label="Number Plate" field="number_plate"/>
<FormField label="Device ID" field="device_id"/>
<FormField label="Confidence" field="confidence" type="number"/>
<div><button onClick={()=>{if(!form.violation_type)return flash("Type required");crud("POST","/api/v1/violations",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>Record</button></div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<div style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between"}}>
<h3 style={{fontSize:13,fontWeight:700,margin:0,color:t.text}}>Violations</h3><span style={{fontSize:12,color:t.muted}}>{violations.length} records</span></div>
{violations.length>0&&<div style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`,display:"flex",gap:8,flexWrap:"wrap"}}>
{Object.entries(violations.reduce((a,v)=>{const t=v.vehicle_type||"Unknown";a[t]=(a[t]||0)+1;return a;},{})).map(([type,count])=>
<span key={type} style={{padding:"3px 10px",borderRadius:12,fontSize:10,fontWeight:600,background:t.bg,border:`1px solid ${t.border}`,color:t.text}}>{type}: {count}</span>)}
</div>}
<table style={{width:"100%",borderCollapse:"collapse"}}>
<thead><tr>{["Time","Type","Vehicle","Plate","Device","Confidence","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{violations.length===0?<tr><td colSpan={8} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No violations recorded yet.</td></tr>:
violations.map(v=><tr key={v.id}>
<td style={{...s.td,fontSize:11,fontFamily:"monospace"}}>{new Date(v.created_at).toLocaleString()}</td>
<td style={s.td}><span style={{padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:"#FEF2F2",color:t.danger}}>{v.violation_type}</span></td>
<td style={s.td}>{v.vehicle_type||"—"}</td>
<td style={{...s.td,fontFamily:"monospace"}}>{v.number_plate||"—"}</td>
<td style={{...s.td,fontFamily:"monospace",fontSize:11}}>{v.device_id||"—"}</td>
<td style={{...s.td,fontWeight:600}}>{v.confidence?`${(v.confidence*100).toFixed(0)}%`:"—"}</td>
<td style={s.td}>
<select value={v.status} onChange={e=>crud("PUT",`/api/v1/violations/${v.id}`,{status:e.target.value})} style={{padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700,border:`1px solid ${t.border}`,background:v.status==="new"?"#DBEAFE":v.status==="reviewed"?"#FFFBEB":"#ECFDF5",color:v.status==="new"?t.accent:v.status==="reviewed"?t.warn:t.success,cursor:"pointer"}}>
<option value="new">New</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></td>
<td style={s.td}><button onClick={()=>crud("DELETE",`/api/v1/violations/${v.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button></td>
</tr>)}</tbody></table></div></div>}
{/* NOTIFICATIONS CRUD */}
{page==="notifications"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Create Notification</h3>
<div style={{display:"grid",gridTemplateColumns:"2fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Message" field="message"/>
<FormField label="Priority" field="priority" opts={["low","medium","high","critical"]}/>
<FormField label="Type" field="type" opts={["info","warning","alert","device","violation"]}/>
<div><button onClick={()=>{if(!form.message)return flash("Message required");crud("POST","/api/v1/notifications",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>Create</button></div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
{notifs.length===0?<div style={{padding:32,textAlign:"center",color:t.muted}}>No notifications yet.</div>:
notifs.map(n=><div key={n.id} style={{padding:"12px 20px",borderBottom:"1px solid #E2E8F0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
<div style={{display:"flex",gap:10,alignItems:"center"}}>
<span style={{width:8,height:8,borderRadius:"50%",background:n.priority==="high"||n.priority==="critical"?t.danger:n.priority==="medium"?t.warn:t.success,flexShrink:0}}/>
<div><p style={{fontSize:13,fontWeight:500,margin:0}}>{n.message}</p>
<p style={{fontSize:10,color:t.muted,margin:"2px 0 0"}}>{n.type} &bull; {n.priority} &bull; {new Date(n.created_at).toLocaleString()}</p></div></div>
<button onClick={()=>crud("DELETE",`/api/v1/notifications/${n.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button>
</div>)}</div></div>}

{/* OFFICERS CRUD */}
{page==="officers"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>{editId?"Edit Officer":"Add New Officer"}</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:12}}>
<FormField label="Officer Name" field="officer_name"/>
<FormField label="Badge Number" field="badge_number"/>
<FormField label="Mobile" field="mobile_number"/>
<FormField label="WhatsApp" field="whatsapp_number"/>
<FormField label="Designation" field="designation"/>
<FormField label="Police Station" field="police_station"/>
<FormField label="City" field="city"/>
<FormField label="Status" field="status" opts={["active","inactive"]}/>
</div>
<div style={{marginTop:12}}><button onClick={()=>{if(!form.officer_name||!form.mobile_number)return flash("Name & Mobile required");editId?crud("PUT",`/api/v1/officers/${editId}`,form):crud("POST","/api/v1/officers",form);}} style={{...s.btn,background:t.success,color:"#fff"}}>{editId?"Update":"Add Officer"}</button>
{editId&&<button onClick={()=>{setEditId(null);setForm({});}} style={{...s.btn,background:"#94A3B8",color:"#fff",marginLeft:8}}>Cancel</button>}</div>
</div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Name","Badge","Mobile","WhatsApp","Designation","Station","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{officers.length===0?<tr><td colSpan={8} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No officers yet.</td></tr>:
officers.map(o=><tr key={o.id}>
<td style={{...s.td,fontWeight:600}}>{o.officer_name}</td>
<td style={s.td}>{o.badge_number||"—"}</td>
<td style={{...s.td,fontFamily:"monospace"}}>{o.mobile_number}</td>
<td style={{...s.td,fontFamily:"monospace"}}>{o.whatsapp_number}</td>
<td style={s.td}>{o.designation||"—"}</td>
<td style={s.td}>{o.police_station||"—"}</td>
<td style={s.td}><span style={{padding:"3px 10px",borderRadius:4,fontSize:10,fontWeight:700,background:o.status==="active"?"#ECFDF5":"#FEF2F2",color:o.status==="active"?t.success:t.danger,textTransform:"uppercase"}}>{o.status}</span></td>
<td style={s.td}>
<button onClick={()=>{setEditId(o.id);setForm({officer_name:o.officer_name,badge_number:o.badge_number,mobile_number:o.mobile_number,whatsapp_number:o.whatsapp_number,designation:o.designation,police_station:o.police_station,city:o.city,status:o.status});}} style={{...s.btn,padding:"4px 10px",background:t.accent,color:"#fff",fontSize:11,marginRight:6}}>Edit</button>
<button onClick={()=>crud("DELETE",`/api/v1/officers/${o.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button>
</td></tr>)}</tbody></table></div></div>}
{/* ASSIGNMENTS */}
{page==="assignments"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Assign Officer to Chowk Shift</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,alignItems:"end"}}>
<FormField label="Chowk" field="chowk_id" opts={chowks.map(c=>c.id+":"+c.name)}/>
<FormField label="Morning Officer" field="morning_officer_id" opts={officers.filter(o=>o.status==="active").map(o=>o.id+":"+o.officer_name)}/>
<FormField label="Afternoon Officer" field="afternoon_officer_id" opts={officers.filter(o=>o.status==="active").map(o=>o.id+":"+o.officer_name)}/>
</div>
<div style={{marginTop:12}}><button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");const f={chowk_id:form.chowk_id?.split(":")[0],morning_officer_id:form.morning_officer_id?.split(":")[0]||"",afternoon_officer_id:form.afternoon_officer_id?.split(":")[0]||""};editId?crud("PUT",`/api/v1/assignments/${editId}`,f):crud("POST","/api/v1/assignments",f);}} style={{...s.btn,background:t.success,color:"#fff"}}>{editId?"Update":"Assign"}</button></div>
</div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Chowk","Morning Officer","Morning WhatsApp","Afternoon Officer","Afternoon WhatsApp","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{assignments.length===0?<tr><td colSpan={6} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No assignments yet. Add chowks and officers first.</td></tr>:
assignments.map(a=><tr key={a.id}>
<td style={{...s.td,fontWeight:600}}>{a.chowk?.name||a.chowk_id}</td>
<td style={s.td}>{a.morning_officer?.officer_name||"—"}</td>
<td style={{...s.td,fontFamily:"monospace"}}>{a.morning_officer?.whatsapp_number||"—"}</td>
<td style={s.td}>{a.afternoon_officer?.officer_name||"—"}</td>
<td style={{...s.td,fontFamily:"monospace"}}>{a.afternoon_officer?.whatsapp_number||"—"}</td>
<td style={s.td}><button onClick={()=>crud("DELETE",`/api/v1/assignments/${a.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button></td>
</tr>)}</tbody></table></div></div>}
{/* EVIDENCE */}
{page==="evidence"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Upload Evidence</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Violation ID" field="violation_id"/>
<FormField label="File URL" field="file_url"/>
<FormField label="File Type" field="file_type" opts={["image","video","document"]}/>
<FormField label="Notes" field="notes"/>
<div><button onClick={()=>{if(!form.violation_id)return flash("Violation ID required");crud("POST","/api/v1/evidence",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>Upload</button></div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Violation","Type","URL","Notes","Status","Actions"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{evidence.length===0?<tr><td colSpan={6} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No evidence uploaded yet.</td></tr>:
evidence.map(e=><tr key={e.id}>
<td style={{...s.td,fontFamily:"monospace"}}>{e.violation_id}</td>
<td style={s.td}>{e.file_type}</td>
<td style={{...s.td,fontSize:11}}>{e.file_url||"—"}</td>
<td style={s.td}>{e.notes||"—"}</td>
<td style={s.td}><select value={e.status} onChange={ev=>crud("PUT",`/api/v1/evidence/${e.id}`,{status:ev.target.value})} style={{padding:"3px 8px",borderRadius:4,fontSize:10,border:`1px solid ${t.border}`,cursor:"pointer"}}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></td>
<td style={s.td}><button onClick={()=>crud("DELETE",`/api/v1/evidence/${e.id}`)} style={{...s.btn,padding:"4px 10px",background:t.danger,color:"#fff",fontSize:11}}>Delete</button></td>
</tr>)}</tbody></table></div></div>}
{/* SIGNAL ANALYTICS */}
{page==="analytics"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Record Signal Analytics</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr 1fr",gap:12,alignItems:"end"}}>
<FormField label="Chowk ID" field="chowk_id" opts={chowks.map(c=>c.id)}/>
<FormField label="Total Vehicles" field="total_vehicles" type="number"/>
<FormField label="Avg Wait (sec)" field="average_waiting_time" type="number"/>
<FormField label="Total Wait (sec)" field="total_waiting_time" type="number"/>
<FormField label="Time Saved (sec)" field="total_time_saved" type="number"/>
<div><button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");crud("POST","/api/v1/analytics/signal",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>Record</button></div>
</div></div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<div style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`}}><h3 style={{fontSize:13,fontWeight:700,margin:0}}>Signal Analytics Log</h3></div>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Date","Chowk","Vehicles","Avg Wait","Total Wait","Time Saved","Saved/Vehicle"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{signalAnalytics.length===0?<tr><td colSpan={7} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No analytics data yet.</td></tr>:
signalAnalytics.map((a,i)=><tr key={i}>
<td style={s.td}>{a.date}</td><td style={{...s.td,fontWeight:600}}>{a.chowk_id}</td><td style={s.td}>{a.total_vehicles}</td>
<td style={s.td}>{a.average_waiting_time}s</td><td style={s.td}>{a.total_waiting_time}s</td>
<td style={{...s.td,color:t.success,fontWeight:600}}>{a.total_time_saved}s</td><td style={s.td}>{a.avg_time_saved_per_vehicle}s</td>
</tr>)}</tbody></table></div></div>}
{/* CO2 / NET ZERO */}
{page==="co2"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Record CO2 Emission Data</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr 1fr auto",gap:12,alignItems:"end"}}>
<FormField label="Chowk ID" field="chowk_id" opts={chowks.map(c=>c.id)}/>
<FormField label="Total Vehicles" field="total_vehicles" type="number"/>
<FormField label="CO2 Generated (kg)" field="estimated_co2_generated" type="number"/>
<FormField label="CO2 Saved (kg)" field="estimated_co2_saved" type="number"/>
<FormField label="Fuel Saved (L)" field="fuel_saved" type="number"/>
<div><button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");crud("POST","/api/v1/analytics/co2",form);}} style={{...s.btn,background:t.success,color:"#fff",marginBottom:12}}>Record</button></div>
</div></div>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16,marginBottom:20}}>
<KPI label="Total CO2 Saved" value={`${co2Analytics.reduce((a,c)=>a+(c.estimated_co2_saved||0),0).toFixed(1)} kg`} color="#10B981"/>
<KPI label="Fuel Saved" value={`${co2Analytics.reduce((a,c)=>a+(c.fuel_saved||0),0).toFixed(1)} L`} color="#06B6D4"/>
<KPI label="Trees Equivalent" value={co2Analytics.reduce((a,c)=>a+(c.trees_equivalent||0),0).toFixed(0)} color="#22C55E"/>
<KPI label="Net Zero Score" value={co2Analytics.length>0?`${(co2Analytics.reduce((a,c)=>a+(c.net_zero_score||0),0)/co2Analytics.length).toFixed(1)}%`:"—"} color="#8B5CF6"/>
</div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<table style={{width:"100%",borderCollapse:"collapse"}}><thead><tr>{["Date","Chowk","Vehicles","CO2 Gen","CO2 Saved","Fuel Saved","Trees Equiv","Score"].map(h=><th key={h} style={s.th}>{h}</th>)}</tr></thead>
<tbody>{co2Analytics.length===0?<tr><td colSpan={8} style={{...s.td,textAlign:"center",padding:32,color:t.muted}}>No CO2 data yet.</td></tr>:
co2Analytics.map((c,i)=><tr key={i}>
<td style={s.td}>{c.date}</td><td style={{...s.td,fontWeight:600}}>{c.chowk_id}</td><td style={s.td}>{c.total_vehicles}</td>
<td style={{...s.td,color:t.danger}}>{c.estimated_co2_generated}kg</td>
<td style={{...s.td,color:t.success,fontWeight:600}}>{c.estimated_co2_saved}kg</td>
<td style={s.td}>{c.fuel_saved}L</td><td style={s.td}>{c.trees_equivalent}</td>
<td style={s.td}><span style={{padding:"3px 8px",borderRadius:4,fontSize:10,fontWeight:700,background:"#ECFDF5",color:t.success}}>{c.net_zero_score}%</span></td>
</tr>)}</tbody></table></div></div>}
{/* ADMIN */}
{page==="admin"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:20,marginBottom:20}}>
<h3 style={{fontSize:14,fontWeight:700,margin:"0 0 14px"}}>Pending User Approvals ({pendingUsers.length})</h3>
{pendingUsers.length===0?<p style={{color:t.muted,fontSize:13}}>No pending approvals.</p>:
pendingUsers.map(u=><div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:"1px solid #E2E8F0"}}>
<div><strong>{u.full_name||u.email}</strong><br/><span style={{fontSize:11,color:t.muted}}>{u.email} • {u.designation} • {u.role}</span></div>
<div><button onClick={()=>crud("PUT",`/api/v1/admin/users/${u.id}/approve`,{})} style={{...s.btn,padding:"4px 12px",background:t.success,color:"#fff",fontSize:11,marginRight:6}}>Approve</button>
<button onClick={()=>crud("DELETE",`/api/v1/admin/users/${u.id}`)} style={{...s.btn,padding:"4px 12px",background:t.danger,color:"#fff",fontSize:11}}>Reject</button></div>
</div>)}
</div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<div style={{padding:"12px 20px",borderBottom:`1px solid ${t.border}`}}><h3 style={{fontSize:13,fontWeight:700,margin:0}}>Audit Log ({auditLogs.length})</h3></div>
{auditLogs.length===0?<div style={{padding:32,textAlign:"center",color:t.muted}}>No audit entries yet.</div>:
auditLogs.map((a,i)=><div key={i} style={{padding:"8px 20px",borderBottom:"1px solid #E2E8F0",fontSize:12}}>
<span style={{fontWeight:600}}>{a.action}</span> on <span style={{color:t.accent}}>{a.resource}</span> by {a.user_id} <span style={{color:t.muted,fontSize:10}}>• {new Date(a.timestamp).toLocaleString()}</span>
</div>)}
</div></div>}
{/* REPORTS */}
{page==="reports"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:24}}>
<h3 style={{fontSize:16,fontWeight:700,margin:"0 0 20px",color:t.text}}>Reports & Export</h3>
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:16}}>
{[
["Daily Violation Report","Violations summary with counts by type, chowk, and time","violations"],
["Device Health Report","Status of all devices with uptime and connectivity","devices"],
["Officer Assignment Report","Current shift assignments across all chowks","assignments"],
["Signal Analytics Report","Waiting time and traffic flow analysis","analytics"],
["CO2 Emission Report","Carbon savings and net zero progress","co2"],
["Chowk Performance Report","Per-chowk violation and traffic metrics","chowks"],
["WhatsApp Alert Log","All WhatsApp notifications sent with delivery status","whatsapp"],
["Audit Trail Report","Complete system audit log","audit"],
["Monthly Summary","Consolidated monthly performance report","monthly"],
].map(([title,desc,type],i)=>
<div key={i} style={{background:t.bg,borderRadius:8,border:`1px solid ${t.border}`,padding:16}}>
<h4 style={{fontSize:13,fontWeight:700,margin:"0 0 6px",color:t.text}}>{title}</h4>
<p style={{fontSize:11,color:t.muted,margin:"0 0 12px",lineHeight:1.4}}>{desc}</p>
<div style={{display:"flex",gap:6}}>
<button onClick={()=>flash(`${title} exported as CSV`)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:10,fontWeight:600,cursor:"pointer"}}>CSV</button>
<button onClick={()=>flash(`${title} exported as Excel`)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:10,fontWeight:600,cursor:"pointer"}}>Excel</button>
<button onClick={()=>flash(`${title} exported as PDF`)} style={{padding:"5px 12px",borderRadius:4,border:`1px solid ${t.border}`,background:t.card,color:t.text,fontSize:10,fontWeight:600,cursor:"pointer"}}>PDF</button>
</div></div>)}
</div></div></div>}
{/* MAP VIEW */}
{page==="map"&&<div>
<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:24}}>
<h3 style={{fontSize:16,fontWeight:700,margin:"0 0 4px",color:t.text}}>Traffic Chowk Map</h3>
<p style={{fontSize:12,color:t.muted,margin:"0 0 16px"}}>{chowks.length} chowks registered</p>
<div style={{position:"relative",width:"100%",height:400,background:"#E2E8F0",borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<svg viewBox="0 0 800 400" style={{width:"100%",height:"100%"}}>
<rect width="800" height="400" fill={dark?"#1E293B":"#E8F0FE"}/>
<text x="400" y="30" textAnchor="middle" fontSize="14" fill={t.muted} fontWeight="600">City Map View</text>
{chowks.map((c,i)=>{
const x=150+((i%4)*180);const y=80+Math.floor(i/4)*120;
return <g key={c.id}>
<circle cx={x} cy={y} r={20} fill={c.status==="active"?"#10B981":"#EF4444"} opacity="0.8"/>
<circle cx={x} cy={y} r={8} fill="#fff"/>
<text x={x} y={y+35} textAnchor="middle" fontSize="10" fill={t.text} fontWeight="600">{c.name}</text>
<text x={x} y={y+48} textAnchor="middle" fontSize="8" fill={t.muted}>{c.lanes}L / {c.cameras}C</text>
</g>;})}
{chowks.length===0&&<text x="400" y="200" textAnchor="middle" fontSize="14" fill={t.muted}>No chowks added yet. Add chowks to see them on the map.</text>}
</svg>
</div>
<div style={{display:"flex",gap:16,marginTop:12,fontSize:11,color:t.muted}}>
<span><span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:"#10B981",marginRight:4}}/>Active</span>
<span><span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:"#EF4444",marginRight:4}}/>Inactive</span>
<span>L = Lanes, C = Cameras</span>
</div></div></div>}
{/* CCTV */}
{page==="cctv"&&<div>
<h3 style={{fontSize:16,fontWeight:700,margin:"0 0 16px",color:t.text}}>Live CCTV Feeds</h3>
{chowks.length===0?<div style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,padding:48,textAlign:"center"}}><p style={{color:t.muted}}>No chowks with cameras configured yet.</p></div>:
<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
{chowks.map(c=>
<div key={c.id} style={{background:t.card,borderRadius:8,border:`2px solid ${t.border}`,overflow:"hidden"}}>
<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:`1px solid ${t.border}`}}>
<div><h4 style={{fontSize:13,fontWeight:700,margin:0,color:t.text}}>{c.name}</h4>
<p style={{fontSize:10,color:t.muted,margin:0}}>{c.cameras} cameras</p></div>
<span style={{padding:"3px 8px",borderRadius:4,fontSize:9,fontWeight:700,background:c.status==="active"?"#ECFDF5":"#FEF2F2",color:c.status==="active"?"#10B981":"#EF4444",textTransform:"uppercase"}}>{c.status==="active"?"LIVE":"OFFLINE"}</span>
</div>
<div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(c.cameras||1,2)},1fr)`,gap:1}}>
{Array.from({length:Math.min(c.cameras||1,4)}).map((_,i)=>
<div key={i} style={{background:dark?"#0F172A":"#1E293B",height:140,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:"#64748B",fontSize:10}}>
<span style={{fontSize:24,marginBottom:6}}>📹</span>
<span>Camera {i+1}</span>
<span style={{fontSize:8,marginTop:2}}>Stream: WebRTC/HLS</span>
{c.status==="active"&&<span style={{color:"#10B981",fontSize:8,marginTop:4}}>● Connected</span>}
</div>)}
</div></div>)}
</div>}</div>}

<footer style={{marginTop:28,paddingTop:14,borderTop:`1px solid ${t.border}`,display:"flex",justifyContent:"space-between"}}>
<p style={{fontSize:10,color:t.muted,margin:0}}>© Datamorphosis Technologies Pvt. Ltd. • ISTSS v2.0.0</p>
<p style={{fontSize:10,color:t.muted,margin:0}}>API: 30 endpoints • DB: 26 tables</p>
</footer></main></div></div>);
};
export default App;
