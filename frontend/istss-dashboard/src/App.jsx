import{useState,useEffect,useCallback}from"react";
import{BarChart,Bar,PieChart,Pie,Cell,AreaChart,Area,XAxis,YAxis,CartesianGrid,Tooltip,ResponsiveContainer,Legend}from"recharts";

const API="https://istss-api-dev.azurewebsites.net";

/* ─── SVG Icon Components ─── */
const I={
  dashboard:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="4" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/></svg>,
  chowks:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><rect x="7" y="1" width="10" height="22" rx="2"/></svg>,
  devices:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6m-6 3h6m-6 3h4"/></svg>,
  violations:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  officers:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  assignments:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>,
  evidence:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  analytics:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12c0 1.66-4 6-9 6s-9-4.34-9-6c0-1.66 4-6 9-6s9 4.34 9 6z"/><circle cx="12" cy="12" r="2"/></svg>,
  co2:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66L6 21c3-5 6-9 11-11"/><path d="M20.5 5l.5-2l-2 .5L12 10l2 2z"/><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z"/></svg>,
  notifications:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>,
  admin:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
  reports:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  map:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  cctv:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  refresh:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>,
  sun:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>,
  moon:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>,
};

const chartColors=["#7c3aed","#2dd4bf","#f43f5e","#f59e0b","#3b82f6","#10b981","#ec4899"];
const navItems=[
  {id:"dashboard",label:"Dashboard",icon:"dashboard"},
  {id:"chowks",label:"Chowks",icon:"chowks"},
  {id:"devices",label:"Devices",icon:"devices"},
  {id:"violations",label:"Violations",icon:"violations"},
  {id:"officers",label:"Officers",icon:"officers"},
  {id:"assignments",label:"Assignments",icon:"assignments"},
  {id:"evidence",label:"Evidence",icon:"evidence"},
  {id:"analytics",label:"Analytics",icon:"analytics"},
  {id:"co2",label:"CO₂ / Net Zero",icon:"co2"},
  {id:"notifications",label:"Notifications",icon:"notifications"},
  {id:"admin",label:"Admin",icon:"admin"},
  {id:"reports",label:"Reports",icon:"reports"},
  {id:"map",label:"Map View",icon:"map"},
  {id:"cctv",label:"CCTV",icon:"cctv"},
];

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

  // ─── Dynamic MC Authority Config (persisted in localStorage) ───
  const defaultMc={mc_name:"",mc_subtitle:"",mc_logo_url:"",officials:[
    {role:"Municipal Commissioner",name:"",designation:"",photo_url:""},
    {role:"Superintendent of Police",name:"",designation:"",photo_url:""},
    {role:"Nodal Officer — ISTSS",name:"",designation:"",photo_url:""}
  ]};
  const[mcConfig,setMcConfig]=useState(()=>{try{const s=localStorage.getItem("istss_mc_config");return s?JSON.parse(s):defaultMc;}catch(e){return defaultMc;}});
  const[mcEditing,setMcEditing]=useState(false);
  const[mcForm,setMcForm]=useState(mcConfig);
  const saveMcConfig=(cfg)=>{setMcConfig(cfg);setMcForm(cfg);localStorage.setItem("istss_mc_config",JSON.stringify(cfg));setMcEditing(false);flash("Authority details saved");};
  const mcHasData=mcConfig.mc_name||mcConfig.officials.some(o=>o.name);

  useEffect(()=>{document.documentElement.setAttribute("data-theme",dark?"dark":"light");},[dark]);

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
      const[s,c,d,v,n,of,as,ev,sa,co,al,pu]=await Promise.all([
        api("/api/v1/dashboard/summary"),api("/api/v1/chowks"),api("/api/v1/devices"),
        api("/api/v1/violations"),api("/api/v1/notifications"),api("/api/v1/officers"),
        api("/api/v1/assignments"),api("/api/v1/evidence"),api("/api/v1/analytics/signal"),
        api("/api/v1/analytics/co2"),api("/api/v1/admin/audit-logs"),api("/api/v1/admin/pending-users")
      ]);
      setSummary(s);setChowks(c.chowks||[]);setDevices(d.devices||[]);setViolations(v.violations||[]);
      setNotifs(n.notifications||[]);setOfficers(of.officers||[]);setAssignments(as.assignments||[]);
      setEvidence(ev.evidence||[]);setSignalAnalytics(sa.analytics||[]);setCo2Analytics(co.analytics||[]);
      setAuditLogs(al.audit_logs||[]);setPendingUsers(pu.pending_users||[]);
    }catch(e){console.error(e);}
  },[token,api]);

  useEffect(()=>{if(screen==="main")load();},[screen,load]);

  const crud=async(method,path,body)=>{
    try{const r=await api(path,{method,body:body?JSON.stringify(body):undefined});flash(r.message||"Done");setForm({});setEditId(null);load();}catch(e){flash("Error: "+e.message);}
  };

  /* ─── Reusable Components ─── */
  const FormField=({label,field,type="text",opts})=>(
    <div className="form-field">
      <label>{label}</label>
      {opts
        ?<select value={form[field]||""} onChange={e=>setForm({...form,[field]:e.target.value})}>
          <option value="">Select…</option>{opts.map(o=><option key={o} value={o}>{o}</option>)}
        </select>
        :<input type={type} value={form[field]||""} onChange={e=>setForm({...form,[field]:type==="number"?parseFloat(e.target.value)||0:e.target.value})} placeholder={label}/>
      }
    </div>
  );

  const KPI=({label,value,color,emoji})=>(
    <div className="kpi-card" style={{"--kpi-color":color,"--kpi-gradient":`linear-gradient(135deg,${color}40,${color}10)`,"--kpi-icon-bg":`${color}18`}}>
      <p className="kpi-label">{label}</p>
      <p className="kpi-value">{value}</p>
      <div className="kpi-icon">{emoji}</div>
    </div>
  );

  const tickerText="ISTSS Platform — Datamorphosis Technologies Pvt. Ltd.  ◈  Smart Traffic Signal System — Real-time Monitoring  ◈  Powered by AI & Edge Computing  ◈  ";

  /* ════════════════ AUTH: LOGIN ════════════════ */
  if(screen==="login")return(
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/favicon.svg" alt="DM"/>
          <h1>ISTSS Platform</h1>
          <p>Smart Traffic Signal System</p>
        </div>
        <div className="auth-body">
          <label>Email Address</label>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@datamorphosis.in"/>
          <label>Password</label>
          <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Enter password" onKeyDown={e=>e.key==="Enter"&&handleLogin()}/>
          {err&&<div className="auth-error">{err}</div>}
          <button onClick={handleLogin} disabled={loading} className="auth-btn">{loading?"Authenticating…":"Sign In"}</button>
          <div className="auth-links">
            <button onClick={()=>setScreen("forgot")} className="auth-link">Forgot Password?</button>
            <button onClick={()=>setScreen("register")} className="auth-link">Create Account</button>
          </div>
          <p className="auth-footer">Datamorphosis Technologies Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  );

  /* ════════════════ AUTH: REGISTER ════════════════ */
  if(screen==="register")return(
    <div className="auth-bg">
      <div className="auth-card auth-card-wide">
        <div className="auth-header">
          <img src="/favicon.svg" alt="DM"/>
          <h1>Request Access</h1>
          <p>Register for ISTSS Platform</p>
        </div>
        <div className="auth-body">
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 16px"}}>
            {[["Full Name","full_name"],["Email","email"],["Mobile","mobile"],["Designation","designation"]].map(([l,f])=>
              <div key={f}><label>{l}</label><input value={regForm[f]||""} onChange={e=>setRegForm({...regForm,[f]:e.target.value})} placeholder={l}/></div>
            )}
            <div><label>Password</label><input type="password" value={regForm.password||""} onChange={e=>setRegForm({...regForm,password:e.target.value})} placeholder="Choose password"/></div>
            <div><label>Role</label>
              <select value={regForm.role||"viewer"} onChange={e=>setRegForm({...regForm,role:e.target.value})}>
                <option value="viewer">Viewer</option><option value="traffic_police">Traffic Police</option><option value="city_admin">City Admin</option>
              </select>
            </div>
          </div>
          {msg&&<div style={{color:"var(--success)",fontSize:12,padding:"10px 14px",background:"var(--success-bg)",borderRadius:6,marginBottom:12}}>{msg}</div>}
          <button onClick={async()=>{if(!regForm.full_name||!regForm.email||!regForm.password)return flash("Fill all required fields");try{const r=await api("/api/v1/auth/register",{method:"POST",body:JSON.stringify(regForm)});flash(r.message);setTimeout(()=>setScreen("login"),2000);}catch(e){flash("Error: "+e.message);}}} className="auth-btn">Register</button>
          <p style={{textAlign:"center",marginTop:14}}><button onClick={()=>setScreen("login")} className="auth-link">Back to Sign In</button></p>
        </div>
      </div>
    </div>
  );

  /* ════════════════ AUTH: FORGOT ════════════════ */
  if(screen==="forgot")return(
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/favicon.svg" alt="DM"/>
          <h1>Reset Password</h1>
        </div>
        <div className="auth-body">
          <p style={{fontSize:13,color:"var(--text-tertiary)",marginBottom:16}}>Enter your email and we'll send a reset link.</p>
          <label>Email Address</label>
          <input placeholder="your@email.com"/>
          <button onClick={()=>{flash("Password reset link sent (demo)");setTimeout(()=>setScreen("login"),2000);}} className="auth-btn">Send Reset Link</button>
          <p style={{textAlign:"center",marginTop:14}}><button onClick={()=>setScreen("login")} className="auth-link">Back to Sign In</button></p>
        </div>
      </div>
    </div>
  );

  /* ════════════════════════════════════════════════
     MAIN DASHBOARD LAYOUT
     ════════════════════════════════════════════════ */
  return(
    <div style={{minHeight:"100vh",background:"var(--bg-base)",transition:"background .4s"}}>
      {/* ─── Sidebar ─── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/favicon.svg" alt="Datamorphosis"/>
          <div className="sidebar-brand-text">
            <h1>ISTSS</h1>
            <span>Datamorphosis</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n=>(
            <button key={n.id} onClick={()=>setPage(n.id)} className={`nav-item${page===n.id?" active":""}`}>
              <span className="nav-icon">{I[n.icon]}</span>{n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <div className="sidebar-user-avatar">{(user?.name||"A")[0]}</div>
            <div>
              <div className="sidebar-user-name">{user?.name||"Admin"}</div>
              <div className="sidebar-user-role">{user?.role||"admin"}</div>
            </div>
          </div>
          <button onClick={()=>{setScreen("login");setToken(null);}} className="btn-signout">Sign Out</button>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <div className="main-wrapper">
        {/* Ticker */}
        <div className="ticker">
          <div className="ticker-content">
            {[0,1].map(i=><span key={i}>{tickerText}{tickerText}</span>)}
          </div>
        </div>

        {/* Top Bar */}
        <header className="topbar">
          <h2>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</h2>
          <div className="topbar-actions">
            {msg&&<span className="flash-msg">{msg}</span>}
            <button onClick={()=>setDark(!dark)} className="btn-icon" title="Toggle theme">{dark?I.sun:I.moon}</button>
            <button onClick={load} className="btn-icon" title="Refresh data">{I.refresh}</button>
            <div className="badge-live">LIVE</div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content" key={page}>
          <div className="page-enter">

{/* ════════════════ DASHBOARD ════════════════ */}
{page==="dashboard"&&<div>

  {/* ─── Dynamic Municipal Corporation Authority Panel ─── */}
  {mcEditing?(
    <div className="form-card" style={{marginBottom:24}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18}}>
        <h3 style={{margin:0}}>Configure Authority Details</h3>
        <button onClick={()=>{setMcEditing(false);setMcForm(mcConfig);}} className="btn btn-ghost btn-sm">Cancel</button>
      </div>
      <div className="form-grid form-grid-2" style={{marginBottom:16}}>
        <div className="form-field">
          <label>Municipal Corporation Name</label>
          <input value={mcForm.mc_name} onChange={e=>setMcForm({...mcForm,mc_name:e.target.value})} placeholder="e.g. Pimpri-Chinchwad Municipal Corporation"/>
        </div>
        <div className="form-field">
          <label>Subtitle / Initiative</label>
          <input value={mcForm.mc_subtitle} onChange={e=>setMcForm({...mcForm,mc_subtitle:e.target.value})} placeholder="e.g. Smart City Initiative — ISTSS Traffic Management"/>
        </div>
        <div className="form-field">
          <label>MC Logo URL</label>
          <input value={mcForm.mc_logo_url} onChange={e=>setMcForm({...mcForm,mc_logo_url:e.target.value})} placeholder="https://... or /mc-logo.png"/>
        </div>
      </div>

      <h3 style={{fontSize:13,margin:"20px 0 14px",paddingTop:16,borderTop:"1px solid var(--border-primary)"}}>Officials</h3>
      {mcForm.officials.map((off,i)=>(
        <div key={i} style={{marginBottom:16,padding:16,background:"var(--bg-surface-hover)",borderRadius:"var(--radius-md)",border:"1px solid var(--border-subtle)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:11,fontWeight:700,color:"var(--accent-primary)",textTransform:"uppercase",letterSpacing:"0.08em"}}>Official {i+1}</span>
            {mcForm.officials.length>1&&<button onClick={()=>{const o=[...mcForm.officials];o.splice(i,1);setMcForm({...mcForm,officials:o});}} className="btn btn-danger btn-sm">Remove</button>}
          </div>
          <div className="form-grid form-grid-4">
            <div className="form-field"><label>Role / Title</label><input value={off.role} onChange={e=>{const o=[...mcForm.officials];o[i]={...o[i],role:e.target.value};setMcForm({...mcForm,officials:o});}} placeholder="e.g. Municipal Commissioner"/></div>
            <div className="form-field"><label>Full Name</label><input value={off.name} onChange={e=>{const o=[...mcForm.officials];o[i]={...o[i],name:e.target.value};setMcForm({...mcForm,officials:o});}} placeholder="e.g. Shri. Shekhar Singh, IAS"/></div>
            <div className="form-field"><label>Designation</label><input value={off.designation} onChange={e=>{const o=[...mcForm.officials];o[i]={...o[i],designation:e.target.value};setMcForm({...mcForm,officials:o});}} placeholder="e.g. Commissioner, PCMC"/></div>
            <div className="form-field"><label>Photo URL</label><input value={off.photo_url} onChange={e=>{const o=[...mcForm.officials];o[i]={...o[i],photo_url:e.target.value};setMcForm({...mcForm,officials:o});}} placeholder="https://... or /photo.jpg"/></div>
          </div>
        </div>
      ))}
      {mcForm.officials.length<5&&<button onClick={()=>setMcForm({...mcForm,officials:[...mcForm.officials,{role:"",name:"",designation:"",photo_url:""}]})} className="btn btn-ghost" style={{marginBottom:16}}>+ Add Official</button>}

      <div className="form-actions" style={{borderTop:"1px solid var(--border-primary)",paddingTop:16}}>
        <button onClick={()=>saveMcConfig(mcForm)} className="btn btn-success">Save Authority Details</button>
        <button onClick={()=>saveMcConfig(defaultMc)} className="btn btn-danger">Clear All</button>
      </div>
    </div>
  ):(
    <div className="authority-banner" style={{marginBottom:24}}>
      <div className="authority-banner-top">
        <div className="mc-branding">
          <div className="mc-logo">
            {mcConfig.mc_logo_url?<img src={mcConfig.mc_logo_url} alt="MC"/>:<span className="mc-logo-placeholder">🏛️</span>}
          </div>
          <div className="mc-info">
            <h2>{mcConfig.mc_name||"Municipal Corporation"}</h2>
            <h3>{mcConfig.mc_subtitle||"ISTSS — Smart Traffic Signal System"}</h3>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span className="mc-badge">● System Online</span>
          <button onClick={()=>{setMcForm(mcConfig);setMcEditing(true);}} className="btn btn-sm" style={{background:"rgba(255,255,255,0.15)",color:"#fff",border:"1px solid rgba(255,255,255,0.25)",fontSize:10}}>✎ Edit</button>
        </div>
      </div>

      {mcConfig.officials.some(o=>o.name)&&<div className="authority-officials" style={{gridTemplateColumns:`repeat(${mcConfig.officials.filter(o=>o.name).length},1fr)`}}>
        {mcConfig.officials.filter(o=>o.name).map((off,i)=>(
          <div key={i} className="official-card">
            <div className="official-photo">
              {off.photo_url?<img src={off.photo_url} alt={off.name}/>:<span className="official-photo-placeholder">👤</span>}
            </div>
            <div>
              <div className="official-role">{off.role||"Official"}</div>
              <div className="official-name">{off.name}</div>
              {off.designation&&<div className="official-desg">{off.designation}</div>}
            </div>
          </div>
        ))}
      </div>}

      <div className="dm-branding">
        <div className="dm-brand-info">
          <img src="/favicon.svg" alt="DM" className="dm-brand-logo"/>
          <div>
            <div className="dm-brand-text">Datamorphosis Technologies Pvt. Ltd.</div>
            <div className="dm-brand-sub">Intelligent Smart Traffic Signal System • ISTSS v5.0</div>
          </div>
        </div>
        <div className="badge-live">LIVE</div>
      </div>
    </div>
  )}

  <div className="kpi-grid">
    <KPI label="Total Violations" value={summary.total_violations??0} color="#f43f5e" emoji="⚠️"/>
    <KPI label="Online Devices" value={`${summary.online_devices??0}/${summary.total_devices??0}`} color="#10b981" emoji="📡"/>
    <KPI label="Total Chowks" value={summary.total_chowks??0} color="#3b82f6" emoji="🚦"/>
    <KPI label="Active Alerts" value={summary.active_alerts??0} color="#f59e0b" emoji="🔔"/>
  </div>
  <div className="kpi-grid">
    <KPI label="Total Officers" value={summary.total_officers??0} color="#6366f1" emoji="👮"/>
    <KPI label="WhatsApp Sent" value={summary.whatsapp_sent_today??0} color="#06b6d4" emoji="💬"/>
    <KPI label="Time Saved (hrs)" value={summary.total_time_saved_hours??0} color="#8b5cf6" emoji="⏱️"/>
    <KPI label="CO₂ Saved (kg)" value={summary.total_co2_saved_kg??0} color="#10b981" emoji="🌱"/>
  </div>

  {/* Charts */}
  {summary.violation_by_type&&Object.keys(summary.violation_by_type).length>0&&
  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:20}}>
    <div className="chart-card">
      <h3>Violations by Type</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={Object.entries(summary.violation_by_type).map(([k,v])=>({name:k,value:v}))} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3} label={({name,value})=>`${name}: ${value}`}>
            {Object.keys(summary.violation_by_type).map((_,i)=><Cell key={i} fill={chartColors[i%7]}/>)}
          </Pie>
          <Tooltip contentStyle={{background:"var(--bg-surface)",border:"1px solid var(--border-primary)",borderRadius:8,fontSize:12}}/>
        </PieChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-card">
      <h3>Violation Counts</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={Object.entries(summary.violation_by_type).map(([k,v])=>({type:k.substring(0,12),count:v}))}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
          <XAxis dataKey="type" fontSize={10} tick={{fill:"var(--text-tertiary)"}}/>
          <YAxis fontSize={10} tick={{fill:"var(--text-tertiary)"}}/>
          <Tooltip contentStyle={{background:"var(--bg-surface)",border:"1px solid var(--border-primary)",borderRadius:8,fontSize:12}}/>
          <Bar dataKey="count" radius={[6,6,0,0]}>
            {Object.keys(summary.violation_by_type).map((_,i)=><Cell key={i} fill={chartColors[i%7]}/>)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>}

  {/* Quick Actions */}
  <div className="chart-card">
    <h3>Quick Actions</h3>
    <div className="quick-actions">
      {["chowks","devices","violations","notifications"].map(p=>
        <button key={p} onClick={()=>setPage(p)} className="btn btn-primary" style={{textTransform:"capitalize"}}>Manage {p}</button>
      )}
    </div>
  </div>
</div>}

{/* ════════════════ CHOWKS ════════════════ */}
{page==="chowks"&&<div>
  <div className="form-card">
    <h3>{editId?"Edit Chowk":"Add New Chowk"}</h3>
    <div className="form-grid form-grid-4" style={{alignItems:"end"}}>
      <FormField label="Name" field="name"/>
      <FormField label="Location" field="location"/>
      <FormField label="Lanes" field="lanes" type="number"/>
      <FormField label="Cameras" field="cameras" type="number"/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.name)return flash("Name required");editId?crud("PUT",`/api/v1/chowks/${editId}`,form):crud("POST","/api/v1/chowks",form);}} className="btn btn-success">{editId?"Update":"Add Chowk"}</button>
      {editId&&<button onClick={()=>{setEditId(null);setForm({});}} className="btn btn-ghost">Cancel</button>}
    </div>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Name","Location","Lanes","Cameras","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{chowks.length===0?<tr><td colSpan={6} className="data-table-empty">No chowks yet. Add one above.</td></tr>:
        chowks.map(c=><tr key={c.id}>
          <td className="bold">{c.name}</td>
          <td>{c.location||"—"}</td>
          <td>{c.lanes}</td>
          <td>{c.cameras}</td>
          <td><span className={`badge badge-${c.status==="active"?"success":"danger"}`}>{c.status}</span></td>
          <td>
            <button onClick={()=>{setEditId(c.id);setForm({name:c.name,location:c.location,lanes:c.lanes,cameras:c.cameras,status:c.status});}} className="btn btn-primary btn-sm" style={{marginRight:6}}>Edit</button>
            <button onClick={()=>crud("DELETE",`/api/v1/chowks/${c.id}`)} className="btn btn-danger btn-sm">Delete</button>
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ DEVICES ════════════════ */}
{page==="devices"&&<div>
  <div className="form-card">
    <h3>{editId?"Edit Device":"Register New Device"}</h3>
    <div className="form-grid form-grid-4" style={{alignItems:"end"}}>
      <FormField label="Device ID" field="device_id"/>
      <FormField label="Name" field="name"/>
      <FormField label="Type" field="type" opts={["Raspberry Pi","Jetson Nano","Edge Server"]}/>
      <FormField label="Status" field="status" opts={["online","offline","maintenance"]}/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.device_id||!form.name)return flash("ID & Name required");editId?crud("PUT",`/api/v1/devices/${editId}`,form):crud("POST","/api/v1/devices",form);}} className="btn btn-success">{editId?"Update":"Register"}</button>
    </div>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Device ID","Name","Type","Status","Created","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{devices.length===0?<tr><td colSpan={6} className="data-table-empty">No devices registered. Add one above.</td></tr>:
        devices.map(d=><tr key={d.id}>
          <td className="mono bold">{d.device_id}</td>
          <td>{d.name}</td>
          <td>{d.type}</td>
          <td><span className={`badge badge-${d.status==="online"?"success":d.status==="offline"?"danger":"warn"}`}>{d.status}</span></td>
          <td style={{fontSize:11,color:"var(--text-tertiary)"}}>{new Date(d.created_at).toLocaleDateString()}</td>
          <td>
            <button onClick={()=>{setEditId(d.id);setForm({device_id:d.device_id,name:d.name,type:d.type,status:d.status});}} className="btn btn-primary btn-sm" style={{marginRight:6}}>Edit</button>
            <button onClick={()=>crud("DELETE",`/api/v1/devices/${d.id}`)} className="btn btn-danger btn-sm">Delete</button>
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>
  {/* Device Health Monitor */}
  {devices.length>0&&<div className="form-card" style={{marginTop:20}}>
    <h3>Device Health Monitor</h3>
    <div className="health-grid">
      {devices.map(d=><div key={d.id} className="health-card">
        <div className="health-header">
          <span className="health-name">{d.name}</span>
          <span className={`badge badge-${d.status==="online"?"success":"danger"}`}>{d.status}</span>
        </div>
        {[["CPU",d.cpu_percent||0,"linear-gradient(90deg,#3b82f6,#7c3aed)"],
          ["Memory",d.memory_percent||0,"linear-gradient(90deg,#8b5cf6,#ec4899)"],
          ["Temperature",(d.temperature||0),"linear-gradient(90deg,#f59e0b,#f43f5e)"],
          ["Disk",d.disk_percent||0,"linear-gradient(90deg,#10b981,#2dd4bf)"]
        ].map(([label,val,grad])=>
          <div key={label} className="health-bar-wrap">
            <div className="health-bar-label"><span>{label}</span><span>{typeof val==="number"?val.toFixed(0):val}%</span></div>
            <div className="health-bar"><div className="health-bar-fill" style={{width:`${Math.min(val,100)}%`,background:val>80?"#f43f5e":grad}}/></div>
          </div>
        )}
      </div>)}
    </div>
  </div>}
</div>}

{/* ════════════════ VIOLATIONS ════════════════ */}
{page==="violations"&&<div>
  <div className="form-card">
    <h3>Record New Violation</h3>
    <div className="form-grid form-grid-5" style={{alignItems:"end"}}>
      <FormField label="Type" field="violation_type" opts={["Red Light Jump","No Helmet","Triple Seat","Zebra Crossing","Wrong Lane","No Parking","Seat Belt","Mobile Phone","Signal Tampering"]}/>
      <FormField label="Vehicle" field="vehicle_type" opts={["Two-Wheeler","Car/SUV","Auto","Bus","Truck","Emergency"]}/>
      <FormField label="Number Plate" field="number_plate"/>
      <FormField label="Device ID" field="device_id"/>
      <FormField label="Confidence" field="confidence" type="number"/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.violation_type)return flash("Type required");crud("POST","/api/v1/violations",form);}} className="btn btn-success">Record Violation</button>
    </div>
  </div>
  <div className="data-table-wrap">
    <div className="data-table-header">
      <h3>Violations</h3>
      <span className="data-table-count">{violations.length} records</span>
    </div>
    {violations.length>0&&<div className="filter-chips">
      {Object.entries(violations.reduce((a,v)=>{const t=v.vehicle_type||"Unknown";a[t]=(a[t]||0)+1;return a;},{})).map(([type,count])=>
        <span key={type} className="chip">{type}: {count}</span>
      )}
    </div>}
    <table className="data-table">
      <thead><tr>{["Time","Type","Vehicle","Plate","Device","Confidence","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{violations.length===0?<tr><td colSpan={8} className="data-table-empty">No violations recorded yet.</td></tr>:
        violations.map(v=><tr key={v.id}>
          <td className="mono" style={{fontSize:11}}>{new Date(v.created_at).toLocaleString()}</td>
          <td><span className="badge badge-danger">{v.violation_type}</span></td>
          <td>{v.vehicle_type||"—"}</td>
          <td className="mono">{v.number_plate||"—"}</td>
          <td className="mono" style={{fontSize:11}}>{v.device_id||"—"}</td>
          <td style={{fontWeight:600}}>{v.confidence?`${(v.confidence*100).toFixed(0)}%`:"—"}</td>
          <td>
            <select className="status-select" value={v.status} onChange={e=>crud("PUT",`/api/v1/violations/${v.id}`,{status:e.target.value})}>
              <option value="new">New</option><option value="reviewed">Reviewed</option><option value="approved">Approved</option><option value="rejected">Rejected</option>
            </select>
          </td>
          <td><button onClick={()=>crud("DELETE",`/api/v1/violations/${v.id}`)} className="btn btn-danger btn-sm">Delete</button></td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ OFFICERS ════════════════ */}
{page==="officers"&&<div>
  <div className="form-card">
    <h3>{editId?"Edit Officer":"Add New Officer"}</h3>
    <div className="form-grid form-grid-4">
      <FormField label="Officer Name" field="officer_name"/>
      <FormField label="Badge Number" field="badge_number"/>
      <FormField label="Mobile" field="mobile_number"/>
      <FormField label="WhatsApp" field="whatsapp_number"/>
      <FormField label="Designation" field="designation"/>
      <FormField label="Police Station" field="police_station"/>
      <FormField label="City" field="city"/>
      <FormField label="Status" field="status" opts={["active","inactive"]}/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.officer_name||!form.mobile_number)return flash("Name & Mobile required");editId?crud("PUT",`/api/v1/officers/${editId}`,form):crud("POST","/api/v1/officers",form);}} className="btn btn-success">{editId?"Update":"Add Officer"}</button>
      {editId&&<button onClick={()=>{setEditId(null);setForm({});}} className="btn btn-ghost">Cancel</button>}
    </div>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Name","Badge","Mobile","WhatsApp","Designation","Station","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{officers.length===0?<tr><td colSpan={8} className="data-table-empty">No officers yet.</td></tr>:
        officers.map(o=><tr key={o.id}>
          <td className="bold">{o.officer_name}</td>
          <td>{o.badge_number||"—"}</td>
          <td className="mono">{o.mobile_number}</td>
          <td className="mono">{o.whatsapp_number}</td>
          <td>{o.designation||"—"}</td>
          <td>{o.police_station||"—"}</td>
          <td><span className={`badge badge-${o.status==="active"?"success":"danger"}`}>{o.status}</span></td>
          <td>
            <button onClick={()=>{setEditId(o.id);setForm({officer_name:o.officer_name,badge_number:o.badge_number,mobile_number:o.mobile_number,whatsapp_number:o.whatsapp_number,designation:o.designation,police_station:o.police_station,city:o.city,status:o.status});}} className="btn btn-primary btn-sm" style={{marginRight:6}}>Edit</button>
            <button onClick={()=>crud("DELETE",`/api/v1/officers/${o.id}`)} className="btn btn-danger btn-sm">Delete</button>
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ ASSIGNMENTS ════════════════ */}
{page==="assignments"&&<div>
  <div className="form-card">
    <h3>Assign Officer to Chowk Shift</h3>
    <div className="form-grid form-grid-3" style={{alignItems:"end"}}>
      <FormField label="Chowk" field="chowk_id" opts={chowks.map(c=>c.id+":"+c.name)}/>
      <FormField label="Morning Officer" field="morning_officer_id" opts={officers.filter(o=>o.status==="active").map(o=>o.id+":"+o.officer_name)}/>
      <FormField label="Afternoon Officer" field="afternoon_officer_id" opts={officers.filter(o=>o.status==="active").map(o=>o.id+":"+o.officer_name)}/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");const f={chowk_id:form.chowk_id?.split(":")[0],morning_officer_id:form.morning_officer_id?.split(":")[0]||"",afternoon_officer_id:form.afternoon_officer_id?.split(":")[0]||""};editId?crud("PUT",`/api/v1/assignments/${editId}`,f):crud("POST","/api/v1/assignments",f);}} className="btn btn-success">{editId?"Update":"Assign"}</button>
    </div>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Chowk","Morning Officer","Morning WhatsApp","Afternoon Officer","Afternoon WhatsApp","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{assignments.length===0?<tr><td colSpan={6} className="data-table-empty">No assignments yet. Add chowks and officers first.</td></tr>:
        assignments.map(a=><tr key={a.id}>
          <td className="bold">{a.chowk?.name||a.chowk_id}</td>
          <td>{a.morning_officer?.officer_name||"—"}</td>
          <td className="mono">{a.morning_officer?.whatsapp_number||"—"}</td>
          <td>{a.afternoon_officer?.officer_name||"—"}</td>
          <td className="mono">{a.afternoon_officer?.whatsapp_number||"—"}</td>
          <td><button onClick={()=>crud("DELETE",`/api/v1/assignments/${a.id}`)} className="btn btn-danger btn-sm">Delete</button></td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ EVIDENCE ════════════════ */}
{page==="evidence"&&<div>
  <div className="form-card">
    <h3>Upload Evidence</h3>
    <div className="form-grid form-grid-4" style={{alignItems:"end"}}>
      <FormField label="Violation ID" field="violation_id"/>
      <FormField label="File URL" field="file_url"/>
      <FormField label="File Type" field="file_type" opts={["image","video","document"]}/>
      <FormField label="Notes" field="notes"/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.violation_id)return flash("Violation ID required");crud("POST","/api/v1/evidence",form);}} className="btn btn-success">Upload</button>
    </div>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Violation","Type","URL","Notes","Status","Actions"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{evidence.length===0?<tr><td colSpan={6} className="data-table-empty">No evidence uploaded yet.</td></tr>:
        evidence.map(e=><tr key={e.id}>
          <td className="mono">{e.violation_id}</td>
          <td>{e.file_type}</td>
          <td style={{fontSize:11}}>{e.file_url||"—"}</td>
          <td>{e.notes||"—"}</td>
          <td><select className="status-select" value={e.status} onChange={ev=>crud("PUT",`/api/v1/evidence/${e.id}`,{status:ev.target.value})}><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></td>
          <td><button onClick={()=>crud("DELETE",`/api/v1/evidence/${e.id}`)} className="btn btn-danger btn-sm">Delete</button></td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ ANALYTICS ════════════════ */}
{page==="analytics"&&<div>
  <div className="form-card">
    <h3>Record Signal Analytics</h3>
    <div className="form-grid form-grid-6" style={{alignItems:"end"}}>
      <FormField label="Chowk ID" field="chowk_id" opts={chowks.map(c=>c.id)}/>
      <FormField label="Total Vehicles" field="total_vehicles" type="number"/>
      <FormField label="Avg Wait (sec)" field="average_waiting_time" type="number"/>
      <FormField label="Total Wait (sec)" field="total_waiting_time" type="number"/>
      <FormField label="Time Saved (sec)" field="total_time_saved" type="number"/>
      <div className="form-actions"><button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");crud("POST","/api/v1/analytics/signal",form);}} className="btn btn-success">Record</button></div>
    </div>
  </div>
  {/* Area Chart for Analytics */}
  {signalAnalytics.length>0&&<div className="chart-card" style={{marginBottom:20}}>
    <h3>Signal Performance Trend</h3>
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={signalAnalytics.slice(-20)}>
        <defs>
          <linearGradient id="gArea1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3}/><stop offset="100%" stopColor="#7c3aed" stopOpacity={0}/></linearGradient>
          <linearGradient id="gArea2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3}/><stop offset="100%" stopColor="#10b981" stopOpacity={0}/></linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)"/>
        <XAxis dataKey="date" fontSize={10} tick={{fill:"var(--text-tertiary)"}}/>
        <YAxis fontSize={10} tick={{fill:"var(--text-tertiary)"}}/>
        <Tooltip contentStyle={{background:"var(--bg-surface)",border:"1px solid var(--border-primary)",borderRadius:8,fontSize:12}}/>
        <Area type="monotone" dataKey="total_waiting_time" stroke="#7c3aed" fill="url(#gArea1)" name="Wait Time"/>
        <Area type="monotone" dataKey="total_time_saved" stroke="#10b981" fill="url(#gArea2)" name="Time Saved"/>
        <Legend/>
      </AreaChart>
    </ResponsiveContainer>
  </div>}
  <div className="data-table-wrap">
    <div className="data-table-header"><h3>Signal Analytics Log</h3></div>
    <table className="data-table">
      <thead><tr>{["Date","Chowk","Vehicles","Avg Wait","Total Wait","Time Saved","Saved/Vehicle"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{signalAnalytics.length===0?<tr><td colSpan={7} className="data-table-empty">No analytics data yet.</td></tr>:
        signalAnalytics.map((a,i)=><tr key={i}>
          <td>{a.date}</td><td className="bold">{a.chowk_id}</td><td>{a.total_vehicles}</td>
          <td>{a.average_waiting_time}s</td><td>{a.total_waiting_time}s</td>
          <td style={{color:"var(--success)",fontWeight:600}}>{a.total_time_saved}s</td>
          <td>{a.avg_time_saved_per_vehicle}s</td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ CO2 / NET ZERO ════════════════ */}
{page==="co2"&&<div>
  <div className="form-card">
    <h3>Record CO₂ Emission Data</h3>
    <div className="form-grid form-grid-5" style={{alignItems:"end"}}>
      <FormField label="Chowk ID" field="chowk_id" opts={chowks.map(c=>c.id)}/>
      <FormField label="Total Vehicles" field="total_vehicles" type="number"/>
      <FormField label="CO₂ Generated (kg)" field="estimated_co2_generated" type="number"/>
      <FormField label="CO₂ Saved (kg)" field="estimated_co2_saved" type="number"/>
      <FormField label="Fuel Saved (L)" field="fuel_saved" type="number"/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.chowk_id)return flash("Select chowk");crud("POST","/api/v1/analytics/co2",form);}} className="btn btn-success">Record</button>
    </div>
  </div>
  <div className="kpi-grid">
    <KPI label="Total CO₂ Saved" value={`${co2Analytics.reduce((a,c)=>a+(c.estimated_co2_saved||0),0).toFixed(1)} kg`} color="#10b981" emoji="🌍"/>
    <KPI label="Fuel Saved" value={`${co2Analytics.reduce((a,c)=>a+(c.fuel_saved||0),0).toFixed(1)} L`} color="#06b6d4" emoji="⛽"/>
    <KPI label="Trees Equivalent" value={co2Analytics.reduce((a,c)=>a+(c.trees_equivalent||0),0).toFixed(0)} color="#22c55e" emoji="🌳"/>
    <KPI label="Net Zero Score" value={co2Analytics.length>0?`${(co2Analytics.reduce((a,c)=>a+(c.net_zero_score||0),0)/co2Analytics.length).toFixed(1)}%`:"—"} color="#8b5cf6" emoji="🎯"/>
  </div>
  <div className="data-table-wrap">
    <table className="data-table">
      <thead><tr>{["Date","Chowk","Vehicles","CO₂ Gen","CO₂ Saved","Fuel Saved","Trees Equiv","Score"].map(h=><th key={h}>{h}</th>)}</tr></thead>
      <tbody>{co2Analytics.length===0?<tr><td colSpan={8} className="data-table-empty">No CO₂ data yet.</td></tr>:
        co2Analytics.map((c,i)=><tr key={i}>
          <td>{c.date}</td><td className="bold">{c.chowk_id}</td><td>{c.total_vehicles}</td>
          <td style={{color:"var(--danger)"}}>{c.estimated_co2_generated}kg</td>
          <td style={{color:"var(--success)",fontWeight:600}}>{c.estimated_co2_saved}kg</td>
          <td>{c.fuel_saved}L</td><td>{c.trees_equivalent}</td>
          <td><span className="badge badge-success">{c.net_zero_score}%</span></td>
        </tr>)}
      </tbody>
    </table>
  </div>
</div>}

{/* ════════════════ NOTIFICATIONS ════════════════ */}
{page==="notifications"&&<div>
  <div className="form-card">
    <h3>Create Notification</h3>
    <div className="form-grid form-grid-3" style={{alignItems:"end"}}>
      <FormField label="Message" field="message"/>
      <FormField label="Priority" field="priority" opts={["low","medium","high","critical"]}/>
      <FormField label="Type" field="type" opts={["info","warning","alert","device","violation"]}/>
    </div>
    <div className="form-actions">
      <button onClick={()=>{if(!form.message)return flash("Message required");crud("POST","/api/v1/notifications",form);}} className="btn btn-success">Create</button>
    </div>
  </div>
  <div className="data-table-wrap">
    {notifs.length===0?<div className="data-table-empty">No notifications yet.</div>:
      notifs.map(n=><div key={n.id} className="notif-item">
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <span className="notif-dot" style={{background:n.priority==="high"||n.priority==="critical"?"var(--danger)":n.priority==="medium"?"var(--warn)":"var(--success)"}}/>
          <div>
            <p style={{fontSize:13,fontWeight:500,margin:0}}>{n.message}</p>
            <p style={{fontSize:10,color:"var(--text-tertiary)",margin:"2px 0 0"}}>{n.type} • {n.priority} • {new Date(n.created_at).toLocaleString()}</p>
          </div>
        </div>
        <button onClick={()=>crud("DELETE",`/api/v1/notifications/${n.id}`)} className="btn btn-danger btn-sm">Delete</button>
      </div>)
    }
  </div>
</div>}

{/* ════════════════ ADMIN ════════════════ */}
{page==="admin"&&<div>
  <div className="form-card">
    <h3>Pending User Approvals ({pendingUsers.length})</h3>
    {pendingUsers.length===0?<p style={{color:"var(--text-tertiary)",fontSize:13}}>No pending approvals.</p>:
      pendingUsers.map(u=><div key={u.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"12px 0",borderBottom:"1px solid var(--border-subtle)"}}>
        <div><strong>{u.full_name||u.email}</strong><br/><span style={{fontSize:11,color:"var(--text-tertiary)"}}>{u.email} • {u.designation} • {u.role}</span></div>
        <div>
          <button onClick={()=>crud("PUT",`/api/v1/admin/users/${u.id}/approve`,{})} className="btn btn-success btn-sm" style={{marginRight:6}}>Approve</button>
          <button onClick={()=>crud("DELETE",`/api/v1/admin/users/${u.id}`)} className="btn btn-danger btn-sm">Reject</button>
        </div>
      </div>)
    }
  </div>
  <div className="data-table-wrap">
    <div className="data-table-header"><h3>Audit Log ({auditLogs.length})</h3></div>
    {auditLogs.length===0?<div className="data-table-empty">No audit entries yet.</div>:
      auditLogs.map((a,i)=><div key={i} style={{padding:"10px 22px",borderBottom:"1px solid var(--border-subtle)",fontSize:12}}>
        <span style={{fontWeight:600}}>{a.action}</span> on <span style={{color:"var(--accent-primary)"}}>{a.resource}</span> by {a.user_id} <span style={{color:"var(--text-tertiary)",fontSize:10}}>• {new Date(a.timestamp).toLocaleString()}</span>
      </div>)
    }
  </div>
</div>}

{/* ════════════════ REPORTS ════════════════ */}
{page==="reports"&&<div>
  <div className="form-card">
    <h3>Reports & Export</h3>
    <div className="report-grid">
      {[
        ["Daily Violation Report","Violations summary with counts by type, chowk, and time","violations"],
        ["Device Health Report","Status of all devices with uptime and connectivity","devices"],
        ["Officer Assignment Report","Current shift assignments across all chowks","assignments"],
        ["Signal Analytics Report","Waiting time and traffic flow analysis","analytics"],
        ["CO₂ Emission Report","Carbon savings and net zero progress","co2"],
        ["Chowk Performance Report","Per-chowk violation and traffic metrics","chowks"],
        ["WhatsApp Alert Log","All WhatsApp notifications sent with delivery status","whatsapp"],
        ["Audit Trail Report","Complete system audit log","audit"],
        ["Monthly Summary","Consolidated monthly performance report","monthly"],
      ].map(([title,desc],i)=>
        <div key={i} className="report-card">
          <h4>{title}</h4>
          <p>{desc}</p>
          <div className="report-actions">
            {["CSV","Excel","PDF"].map(f=><button key={f} onClick={()=>flash(`${title} exported as ${f}`)} className="report-btn">{f}</button>)}
          </div>
        </div>
      )}
    </div>
  </div>
</div>}

{/* ════════════════ MAP VIEW ════════════════ */}
{page==="map"&&<div>
  <div className="chart-card">
    <h3 style={{marginBottom:4}}>Traffic Chowk Map</h3>
    <p style={{fontSize:12,color:"var(--text-tertiary)",marginBottom:16}}>{chowks.length} chowks registered</p>
    <div className="map-container">
      <svg viewBox="0 0 800 440" style={{width:"100%",height:"100%"}}>
        <rect width="800" height="440" fill={dark?"#0a0e27":"#e8ebf2"}/>
        <text x="400" y="28" textAnchor="middle" fontSize="13" fill="var(--text-tertiary)" fontWeight="600">City Map View</text>
        {chowks.map((c,i)=>{
          const x=150+((i%4)*180),y=80+Math.floor(i/4)*120;
          return <g key={c.id}>
            <circle cx={x} cy={y} r={28} fill={c.status==="active"?"rgba(16,185,129,0.15)":"rgba(244,63,94,0.15)"}/>
            <circle cx={x} cy={y} r={16} fill={c.status==="active"?"#10b981":"#f43f5e"} opacity="0.9"/>
            <circle cx={x} cy={y} r={5} fill="#fff"/>
            <text x={x} y={y+38} textAnchor="middle" fontSize="11" fill="var(--text-primary)" fontWeight="600">{c.name}</text>
            <text x={x} y={y+52} textAnchor="middle" fontSize="9" fill="var(--text-tertiary)">{c.lanes}L / {c.cameras}C</text>
          </g>;
        })}
        {chowks.length===0&&<text x="400" y="220" textAnchor="middle" fontSize="14" fill="var(--text-tertiary)">No chowks added yet.</text>}
      </svg>
    </div>
    <div style={{display:"flex",gap:20,marginTop:14,fontSize:11,color:"var(--text-tertiary)"}}>
      <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:"50%",background:"#10b981",display:"inline-block"}}/>Active</span>
      <span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:10,height:10,borderRadius:"50%",background:"#f43f5e",display:"inline-block"}}/>Inactive</span>
      <span>L = Lanes, C = Cameras</span>
    </div>
  </div>
</div>}

{/* ════════════════ CCTV ════════════════ */}
{page==="cctv"&&<div>
  {chowks.length===0?<div className="chart-card"><div className="data-table-empty">No chowks with cameras configured yet.</div></div>:
  <div className="cctv-grid">
    {chowks.map(c=>
      <div key={c.id} className="cctv-card">
        <div className="cctv-header">
          <div>
            <h4 style={{fontSize:13,fontWeight:700,margin:0,color:"var(--text-primary)"}}>{c.name}</h4>
            <p style={{fontSize:10,color:"var(--text-tertiary)",margin:0}}>{c.cameras} cameras</p>
          </div>
          <span className={`badge badge-${c.status==="active"?"success":"danger"}`}>{c.status==="active"?"LIVE":"OFFLINE"}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:`repeat(${Math.min(c.cameras||1,2)},1fr)`,gap:1}}>
          {Array.from({length:Math.min(c.cameras||1,4)}).map((_,i)=>
            <div key={i} className="cctv-feed">
              <span style={{fontSize:28,marginBottom:6,opacity:0.5}}>📹</span>
              <span style={{fontWeight:600}}>Camera {i+1}</span>
              <span style={{fontSize:8,marginTop:2,opacity:0.5}}>Stream: WebRTC/HLS</span>
              {c.status==="active"&&<span style={{color:"#10b981",fontSize:8,marginTop:4}}>● Connected</span>}
            </div>
          )}
        </div>
      </div>
    )}
  </div>}
</div>}

          </div>{/* page-enter */}

          <footer className="app-footer">
            <span>© Datamorphosis Technologies Pvt. Ltd. • ISTSS v5.0.0</span>
            <span>API: 55 endpoints • DB: 12 tables</span>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
