import { useState, useEffect, useCallback } from "react";

const API = "https://istss-api-dev.azurewebsites.net";

// Enterprise color system
const theme = {
  light: {
    bg: "#F1F5F9", card: "#FFFFFF", sidebar: "#0F172A", sidebarText: "#CBD5E1",
    sidebarActive: "#1E40AF", border: "#1E293B", text: "#0F172A", muted: "#64748B",
    accent: "#1E40AF", accentLight: "#DBEAFE", success: "#059669", danger: "#DC2626",
    warning: "#D97706", headerBg: "#FFFFFF", headerBorder: "#1E293B",
  }
};

export default function App() {
  const [screen, setScreen] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);
  const [violations, setViolations] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [lastRefresh, setLastRefresh] = useState("");
  const [selectedCity, setSelectedCity] = useState("nanded");

  const t = theme.light;

  const api = useCallback(async (path, opts = {}) => {
    const h = { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
    const r = await fetch(`${API}${path}`, { ...opts, headers: h });
    if (!r.ok) throw new Error((await r.json()).detail || r.statusText);
    return r.json();
  }, [token]);

  const handleLogin = async () => {
    setLoading(true); setErr("");
    try {
      const d = await api("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ email, password: pass }) });
      setToken(d.access_token); setUser(d.user); setScreen("dashboard");
    } catch (e) { setErr(e.message || "Login failed"); } finally { setLoading(false); }
  };

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const [s, v, n] = await Promise.all([
        api("/api/v1/dashboard/summary"),
        api("/api/v1/violations"),
        api("/api/v1/notifications"),
      ]);
      setSummary(s); setViolations(v.violations || []); setNotifs(n.notifications || []);
      setLastRefresh(new Date().toLocaleTimeString("en-IN"));
    } catch (e) { console.error(e); }
  }, [token, api]);

  useEffect(() => {
    if (screen === "dashboard" && token) {
      fetchData();
      const i = setInterval(fetchData, 15000);
      return () => clearInterval(i);
    }
  }, [screen, token, fetchData]);

  const cities = [
    { id: "nanded", name: "Nanded", corp: "Nanded Waghala City Municipal Corporation", police: "Nanded City Police" },
    { id: "pcmc", name: "Pimpri-Chinchwad", corp: "PCMC", police: "PCMC Traffic Police" },
  ];
  const city = cities.find(c => c.id === selectedCity) || cities[0];

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "grid" },
    { id: "violations", label: "Violations", icon: "alert" },
    { id: "chowks", label: "Chowks", icon: "map-pin" },
    { id: "devices", label: "Devices", icon: "cpu" },
    { id: "evidence", label: "Evidence", icon: "camera" },
    { id: "alerts", label: "Alerts", icon: "bell" },
    { id: "reports", label: "Reports", icon: "file" },
    { id: "admin", label: "Admin", icon: "settings" },
  ];

  const NavIcon = ({ type, size = 18 }) => {
    const icons = {
      grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
      alert: <><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>,
      "map-pin": <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></>,
      cpu: <><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
      camera: <><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></>,
      bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></>,
      file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
      settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></>,
      refresh: <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>,
      logout: <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    };
    return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{icons[type]}</svg>;
  };

  // LOGIN
  if (screen === "login") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <div style={{ width: 440, background: "#fff", borderRadius: 12, overflow: "hidden", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
        <div style={{ background: "#0F172A", padding: "32px 40px", textAlign: "center" }}>
          <img src="/logo.svg" alt="Datamorphosis" style={{ width: 80, height: 64, marginBottom: 12, filter: "drop-shadow(0 2px 8px rgba(255,255,255,0.15))" }} />
          <h1 style={{ color: "#F8FAFC", fontSize: 18, fontWeight: 700, margin: "0 0 4px", letterSpacing: "-0.02em" }}>ISTSS Platform</h1>
          <p style={{ color: "#64748B", fontSize: 12, margin: 0, letterSpacing: "0.05em", textTransform: "uppercase" }}>Intelligent Smart Traffic Signal System</p>
        </div>
        <div style={{ padding: "32px 40px" }}>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Email Address</label>
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@datamorphosis.in" style={{ width: "100%", padding: "12px 16px", border: "2px solid #1E293B", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#1E40AF"} onBlur={e => e.target.style.borderColor = "#1E293B"} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Password</label>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Enter password" onKeyDown={e => e.key === "Enter" && handleLogin()} style={{ width: "100%", padding: "12px 16px", border: "2px solid #1E293B", borderRadius: 6, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" }} onFocus={e => e.target.style.borderColor = "#1E40AF"} onBlur={e => e.target.style.borderColor = "#1E293B"} />
          </div>
          {err && <div style={{ color: "#DC2626", fontSize: 13, padding: "10px 14px", background: "#FEF2F2", borderRadius: 6, marginBottom: 16, border: "1px solid #FECACA" }}>{err}</div>}
          <button onClick={handleLogin} disabled={loading} style={{ width: "100%", padding: "14px", background: loading ? "#64748B" : "#0F172A", color: "#fff", border: "none", borderRadius: 6, fontSize: 14, fontWeight: 700, cursor: loading ? "wait" : "pointer", letterSpacing: "0.02em", textTransform: "uppercase", transition: "background 0.2s" }}>{loading ? "Authenticating..." : "Sign In"}</button>
          <p style={{ textAlign: "center", color: "#94A3B8", fontSize: 11, marginTop: 16, letterSpacing: "0.03em" }}>Datamorphosis Technologies Pvt. Ltd.</p>
        </div>
      </div>
    </div>
  );

  // DASHBOARD
  const kpis = [
    { label: "Total Violations", value: summary?.total_violations_today ?? 0, sub: "Today", color: "#DC2626", bg: "#FEF2F2" },
    { label: "Online Devices", value: `${summary?.online_devices ?? 0}/${summary?.total_devices ?? 0}`, sub: "Active / Total", color: "#059669", bg: "#ECFDF5" },
    { label: "Pending Review", value: summary?.new_violations ?? 0, sub: "Awaiting action", color: "#D97706", bg: "#FFFBEB" },
    { label: "Active Alerts", value: summary?.active_alerts ?? 0, sub: "High priority", color: "#7C3AED", bg: "#F5F3FF" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: t.bg, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", display: "flex", color: t.text }}>
      {/* SIDEBAR */}
      <aside style={{ width: 240, background: t.sidebar, display: "flex", flexDirection: "column", flexShrink: 0, position: "fixed", top: 0, left: 0, height: "100vh", zIndex: 50 }}>
        <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid #334155" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/logo.svg" alt="DM" style={{ width: 36, height: 28, filter: "drop-shadow(0 1px 4px rgba(255,255,255,0.1))" }} />
            <div>
              <div style={{ color: "#F8FAFC", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em" }}>ISTSS</div>
              <div style={{ color: "#64748B", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>Datamorphosis</div>
            </div>
          </div>
        </div>
        <div style={{ padding: "12px 12px 8px" }}>
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid #334155", background: "#1E293B", color: "#CBD5E1", fontSize: 12, outline: "none", fontFamily: "inherit" }}>
            {cities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <nav style={{ flex: 1, padding: "4px 12px", overflowY: "auto" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => setPage(n.id)} style={{ display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "10px 12px", marginBottom: 2, borderRadius: 6, border: "none", background: page === n.id ? "#1E40AF" : "transparent", color: page === n.id ? "#fff" : "#94A3B8", fontSize: 13, fontWeight: page === n.id ? 600 : 400, cursor: "pointer", textAlign: "left", transition: "all 0.15s", fontFamily: "inherit" }}>
              <NavIcon type={n.icon} size={16} /> {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px", borderTop: "1px solid #334155" }}>
          <div style={{ padding: "10px 12px", borderRadius: 6, background: "#1E293B", marginBottom: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#F8FAFC", marginBottom: 2 }}>{user?.name || "Admin"}</div>
            <div style={{ fontSize: 10, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>{user?.role || "super_admin"}</div>
          </div>
          <button onClick={() => { setScreen("login"); setToken(null); setUser(null); }} style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "8px 12px", borderRadius: 6, border: "none", background: "transparent", color: "#EF4444", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
            <NavIcon type="logout" size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div style={{ flex: 1, marginLeft: 240, display: "flex", flexDirection: "column" }}>
        {/* HEADER */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px", height: 56, background: t.headerBg, borderBottom: `2px solid ${t.headerBorder}`, position: "sticky", top: 0, zIndex: 40 }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>{city.corp}</h2>
            <p style={{ fontSize: 11, color: t.muted, margin: 0, letterSpacing: "0.02em" }}>{city.police} &bull; Maharashtra</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {lastRefresh && <span style={{ fontSize: 11, color: t.muted }}>Updated {lastRefresh}</span>}
            <button onClick={fetchData} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 6, border: `1px solid ${t.border}`, background: "transparent", color: t.text, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              <NavIcon type="refresh" size={14} /> Refresh
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 12px", borderRadius: 20, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", display: "inline-block" }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#059669", letterSpacing: "0.05em" }}>LIVE</span>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main style={{ flex: 1, padding: 32 }}>
          {page === "dashboard" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 24 }}>
                <div>
                  <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", letterSpacing: "-0.03em", color: t.text }}>Traffic Intelligence</h1>
                  <p style={{ fontSize: 13, color: t.muted, margin: 0 }}>{new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
                </div>
                <a href={`${API}/api/docs`} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: t.accent, textDecoration: "none", fontWeight: 600 }}>API Docs &rarr;</a>
              </div>

              {/* KPI CARDS */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 32 }}>
                {kpis.map((k, i) => (
                  <div key={i} style={{ background: t.card, borderRadius: 8, padding: "20px 24px", border: `2px solid ${t.border}`, position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: k.color }} />
                    <p style={{ fontSize: 11, fontWeight: 700, color: t.muted, margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.08em" }}>{k.label}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, margin: "0 0 4px", color: t.text, letterSpacing: "-0.03em", lineHeight: 1 }}>{k.value}</p>
                    <p style={{ fontSize: 12, color: t.muted, margin: 0 }}>{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* VIOLATIONS TABLE */}
              <div style={{ background: t.card, borderRadius: 8, border: `2px solid ${t.border}`, overflow: "hidden", marginBottom: 32 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: "-0.01em" }}>Recent Violations</h3>
                  <span style={{ fontSize: 12, color: t.muted, fontWeight: 600 }}>{violations.length} records</span>
                </div>
                {violations.length === 0 ? (
                  <div style={{ padding: "48px 24px", textAlign: "center" }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", border: `2px solid ${t.border}` }}>
                      <NavIcon type="alert" size={20} />
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: t.text, margin: "0 0 6px" }}>No violations recorded</p>
                    <p style={{ fontSize: 12, color: t.muted, margin: "0 0 16px", maxWidth: 400, marginLeft: "auto", marginRight: "auto" }}>Violations will appear here when your RPi devices send data via the ingestion API. Use Swagger Docs to test.</p>
                    <a href={`${API}/api/docs`} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "8px 20px", background: t.sidebar, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 600, textDecoration: "none", letterSpacing: "0.02em" }}>Open API Docs</a>
                  </div>
                ) : (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr>{["Time", "Device", "Type", "Vehicle", "Plate", "Confidence", "Status"].map(h => (
                          <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700, color: t.muted, textTransform: "uppercase", letterSpacing: "0.08em", borderBottom: `1px solid ${t.border}`, background: "#F8FAFC" }}>{h}</th>
                        ))}</tr>
                      </thead>
                      <tbody>
                        {violations.map((v, i) => (
                          <tr key={i} style={{ borderBottom: `1px solid #E2E8F0` }}>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontFamily: "monospace", color: t.text }}>{new Date(v.timestamp || v.created_at).toLocaleTimeString()}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>{v.device_id}</td>
                            <td style={{ padding: "12px 16px" }}><span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "#FEF2F2", color: "#DC2626", border: "1px solid #FECACA" }}>{v.violation_type || "—"}</span></td>
                            <td style={{ padding: "12px 16px", fontSize: 13, color: t.text }}>{v.vehicle_type || "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 12, fontFamily: "monospace" }}>{v.number_plate || "—"}</td>
                            <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 600, color: v.confidence > 0.9 ? "#059669" : "#D97706" }}>{v.confidence ? `${(v.confidence * 100).toFixed(0)}%` : "—"}</td>
                            <td style={{ padding: "12px 16px" }}><span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 4, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", background: v.status === "new" ? "#DBEAFE" : "#ECFDF5", color: v.status === "new" ? "#1E40AF" : "#059669" }}>{v.status}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* NOTIFICATIONS + SYSTEM INFO */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: t.card, borderRadius: 8, border: `2px solid ${t.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Notifications</h3>
                  </div>
                  {notifs.length === 0 ? (
                    <div style={{ padding: "32px 24px", textAlign: "center" }}>
                      <p style={{ fontSize: 13, color: t.muted, margin: 0 }}>No notifications yet</p>
                    </div>
                  ) : (
                    <div style={{ maxHeight: 240, overflowY: "auto" }}>
                      {notifs.map((n, i) => (
                        <div key={i} style={{ padding: "12px 24px", borderBottom: "1px solid #F1F5F9", display: "flex", gap: 12, alignItems: "flex-start" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: n.priority === "high" ? "#DC2626" : "#3B82F6", flexShrink: 0, marginTop: 5 }} />
                          <div>
                            <p style={{ fontSize: 13, color: t.text, margin: "0 0 2px", fontWeight: 500 }}>{n.message}</p>
                            <p style={{ fontSize: 11, color: t.muted, margin: 0 }}>{new Date(n.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ background: t.card, borderRadius: 8, border: `2px solid ${t.border}`, overflow: "hidden" }}>
                  <div style={{ padding: "16px 24px", borderBottom: `1px solid ${t.border}` }}>
                    <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>System Status</h3>
                  </div>
                  <div style={{ padding: "16px 24px" }}>
                    {[
                      { label: "API", value: "istss-api-dev.azurewebsites.net", status: "Operational" },
                      { label: "Database", value: "istss-db-dev.postgres.database.azure.com", status: "26 tables" },
                      { label: "Storage", value: "istssevidence.blob.core.windows.net", status: "Ready" },
                      { label: "Endpoints", value: "25 REST API routes", status: "Active" },
                      { label: "Devices", value: "RPI-NND-001 through 004", status: "Registered" },
                    ].map((s, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < 4 ? "1px solid #F1F5F9" : "none" }}>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 700, color: t.text, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.label}</p>
                          <p style={{ fontSize: 11, color: t.muted, margin: "2px 0 0", fontFamily: "monospace" }}>{s.value}</p>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#059669", background: "#ECFDF5", padding: "3px 10px", borderRadius: 4, border: "1px solid #A7F3D0", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {page !== "dashboard" && (
            <div style={{ background: t.card, borderRadius: 8, border: `2px solid ${t.border}`, padding: "48px", textAlign: "center" }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#F1F5F9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", border: `2px solid ${t.border}` }}>
                <NavIcon type={navItems.find(n => n.id === page)?.icon || "grid"} size={24} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px", letterSpacing: "-0.02em" }}>{navItems.find(n => n.id === page)?.label}</h2>
              <p style={{ fontSize: 13, color: t.muted, margin: "0 0 24px", maxWidth: 360, marginLeft: "auto", marginRight: "auto" }}>This module will display live data from the API when your devices are connected. Data flows through the ingestion endpoints.</p>
              <a href={`${API}/api/docs`} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "10px 24px", background: t.sidebar, color: "#fff", borderRadius: 6, fontSize: 12, fontWeight: 700, textDecoration: "none", letterSpacing: "0.02em", textTransform: "uppercase" }}>View API Documentation</a>
            </div>
          )}

          <footer style={{ marginTop: 32, paddingTop: 16, borderTop: `1px solid ${t.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ fontSize: 11, color: t.muted, margin: 0, letterSpacing: "0.02em" }}>&copy; Datamorphosis Technologies Pvt. Ltd. &bull; ISTSS v1.0.0</p>
            <p style={{ fontSize: 11, color: t.muted, margin: 0 }}>Auto-refresh: 15s &bull; API: 25 endpoints &bull; DB: 26 tables</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
