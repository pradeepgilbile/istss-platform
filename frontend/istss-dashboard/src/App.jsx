import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const CITIES = [
  { id: "nanded", name: "Nanded", corporation: "Nanded Waghala City Municipal Corporation", police: "Nanded City Police", state: "Maharashtra", commissioner: "Shri. Rajesh Kumar", cp: "Shri. Anil Deshmukh" },
  { id: "pcmc", name: "Pimpri-Chinchwad", corporation: "Pimpri-Chinchwad Municipal Corporation", police: "PCMC Traffic Police", state: "Maharashtra", commissioner: "Shri. Vikram Patil", cp: "Shri. Suresh Jadhav" },
];

const CHOWKS = {
  nanded: [
    { id: "mutha", name: "Mutha Chowk", lat: 19.1502, lng: 77.3159, status: "active", cameras: 4, rpiId: "RPI-NND-001", lastSync: "2 min ago", violations: 47, vehicles: 3420, signalPhase: "green", lanes: 4, paStatus: "active" },
    { id: "vazirabad", name: "Vazirabad Chowk", lat: 19.1485, lng: 77.3211, status: "active", cameras: 3, rpiId: "RPI-NND-002", lastSync: "1 min ago", violations: 32, vehicles: 2890, signalPhase: "red", lanes: 4, paStatus: "active" },
    { id: "jaikpura", name: "Jaikpura Gate", lat: 19.1520, lng: 77.3180, status: "active", cameras: 3, rpiId: "RPI-NND-003", lastSync: "5 min ago", violations: 28, vehicles: 2150, signalPhase: "green", lanes: 3, paStatus: "inactive" },
    { id: "bengali", name: "Bengali Camp Signal", lat: 19.1445, lng: 77.3095, status: "warning", cameras: 2, rpiId: "RPI-NND-004", lastSync: "12 min ago", violations: 15, vehicles: 1780, signalPhase: "yellow", lanes: 2, paStatus: "offline" },
  ],
  pcmc: [
    { id: "dapodi", name: "Dapodi Junction", lat: 18.5985, lng: 73.8325, status: "active", cameras: 4, rpiId: "RPI-PCMC-001", lastSync: "1 min ago", violations: 62, vehicles: 5210, signalPhase: "green", lanes: 6, paStatus: "active" },
    { id: "kasarwadi", name: "Kasarwadi Chowk", lat: 18.6095, lng: 73.8280, status: "active", cameras: 3, rpiId: "RPI-PCMC-002", lastSync: "3 min ago", violations: 41, vehicles: 4120, signalPhase: "red", lanes: 4, paStatus: "active" },
    { id: "nigdi", name: "Nigdi Chowk", lat: 18.6520, lng: 73.7690, status: "offline", cameras: 3, rpiId: "RPI-PCMC-003", lastSync: "45 min ago", violations: 8, vehicles: 890, signalPhase: "unknown", lanes: 4, paStatus: "offline" },
  ],
};

const VIOLATION_TYPES = [
  { type: "Red Light Jump", count: 87, color: "#ef4444", icon: "🚦" },
  { type: "No Helmet", count: 134, color: "#f97316", icon: "⛑️" },
  { type: "Triple Seat", count: 56, color: "#eab308", icon: "🏍️" },
  { type: "Zebra Crossing", count: 42, color: "#8b5cf6", icon: "🚶" },
  { type: "Wrong Lane", count: 31, color: "#06b6d4", icon: "🔄" },
  { type: "No Parking", count: 24, color: "#a855f7", icon: "🅿️" },
  { type: "Seat Belt", count: 19, color: "#14b8a6", icon: "🪢" },
  { type: "Mobile Phone", count: 15, color: "#f43f5e", icon: "📱" },
  { type: "Heavy Vehicle", count: 11, color: "#78716c", icon: "🚛" },
  { type: "Overcrowding", count: 8, color: "#d946ef", icon: "👥" },
  { type: "Emergency Block", count: 2, color: "#dc2626", icon: "🚑" },
  { type: "Signal Tampering", count: 3, color: "#b91c1c", icon: "⚠️" },
  { type: "Camera Offline", count: 5, color: "#6b7280", icon: "📵" },
  { type: "Incident Detected", count: 4, color: "#f59e0b", icon: "💥" },
  { type: "Unknown", count: 7, color: "#9ca3af", icon: "❓" },
];

const VEHICLE_CLASSES = [
  { type: "Two-Wheeler", count: 4820, pct: 38.2 },
  { type: "Car/SUV", count: 3950, pct: 31.3 },
  { type: "Auto-Rickshaw", count: 1680, pct: 13.3 },
  { type: "Bus", count: 890, pct: 7.1 },
  { type: "Truck/HCV", count: 720, pct: 5.7 },
  { type: "Emergency", count: 42, pct: 0.3 },
  { type: "Other", count: 518, pct: 4.1 },
];

const LANE_DATA = [
  { lane: "Lane 1", vehicles: 3420, violations: 42 },
  { lane: "Lane 2", vehicles: 2810, violations: 38 },
  { lane: "Lane 3", vehicles: 2650, violations: 31 },
  { lane: "Lane 4", vehicles: 1890, violations: 22 },
  { lane: "Lane 5", vehicles: 980, violations: 14 },
  { lane: "Lane 6", vehicles: 640, violations: 8 },
];

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, "0")}:00`,
  vehicles: Math.round(200 + Math.sin((i - 6) * 0.4) * 400 + Math.random() * 100 + (i >= 8 && i <= 10 ? 600 : 0) + (i >= 17 && i <= 19 ? 500 : 0)),
  violations: Math.round(5 + Math.sin((i - 6) * 0.4) * 15 + Math.random() * 8 + (i >= 8 && i <= 10 ? 20 : 0) + (i >= 17 && i <= 19 ? 18 : 0)),
}));

const WEEKLY_DATA = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d, i) => ({
  day: d,
  violations: Math.round(200 + Math.random() * 120 + (i < 5 ? 80 : 0)),
  vehicles: Math.round(8000 + Math.random() * 3000 + (i < 5 ? 2000 : 0)),
}));

const RECENT_VIOLATIONS = [
  { id: "V-20260619-001", time: "14:32:18", chowk: "Mutha Chowk", type: "Red Light Jump", vehicle: "Two-Wheeler", plate: "MH-26-AB-4521", confidence: 94, status: "new", camera: "CAM-02", lane: 2, direction: "North", speed: "48 km/h" },
  { id: "V-20260619-002", time: "14:28:45", chowk: "Vazirabad Chowk", type: "No Helmet", vehicle: "Two-Wheeler", plate: "MH-26-CD-7823", confidence: 91, status: "reviewed", camera: "CAM-01", lane: 1, direction: "East", speed: "32 km/h" },
  { id: "V-20260619-003", time: "14:25:11", chowk: "Dapodi Junction", type: "Triple Seat", vehicle: "Two-Wheeler", plate: "MH-14-EF-1290", confidence: 88, status: "new", camera: "CAM-03", lane: 3, direction: "South", speed: "28 km/h" },
  { id: "V-20260619-004", time: "14:22:03", chowk: "Jaikpura Gate", type: "Zebra Crossing", vehicle: "Car/SUV", plate: "MH-26-GH-5567", confidence: 86, status: "approved", camera: "CAM-01", lane: 1, direction: "West", speed: "22 km/h" },
  { id: "V-20260619-005", time: "14:18:55", chowk: "Kasarwadi Chowk", type: "Wrong Lane", vehicle: "Auto-Rickshaw", plate: "MH-14-IJ-3344", confidence: 79, status: "new", camera: "CAM-02", lane: 4, direction: "North", speed: "35 km/h" },
  { id: "V-20260619-006", time: "14:15:30", chowk: "Bengali Camp Signal", type: "No Helmet", vehicle: "Two-Wheeler", plate: "MH-26-KL-8890", confidence: 92, status: "reviewed", camera: "CAM-01", lane: 2, direction: "East", speed: "40 km/h" },
  { id: "V-20260619-007", time: "14:12:22", chowk: "Mutha Chowk", type: "Red Light Jump", vehicle: "Car/SUV", plate: "MH-26-MN-2211", confidence: 97, status: "challan-ready", camera: "CAM-04", lane: 1, direction: "South", speed: "52 km/h" },
  { id: "V-20260619-008", time: "14:08:40", chowk: "Vazirabad Chowk", type: "Signal Tampering", vehicle: "—", plate: "—", confidence: 82, status: "new", camera: "CAM-02", lane: 0, direction: "—", speed: "—" },
  { id: "V-20260619-009", time: "14:05:12", chowk: "Dapodi Junction", type: "Mobile Phone", vehicle: "Car/SUV", plate: "MH-14-PQ-6677", confidence: 85, status: "new", camera: "CAM-01", lane: 2, direction: "West", speed: "45 km/h" },
  { id: "V-20260619-010", time: "14:01:33", chowk: "Mutha Chowk", type: "Seat Belt", vehicle: "Car/SUV", plate: "MH-26-RS-9988", confidence: 90, status: "new", camera: "CAM-03", lane: 3, direction: "North", speed: "38 km/h" },
  { id: "V-20260619-011", time: "13:58:08", chowk: "Kasarwadi Chowk", type: "No Parking", vehicle: "Car/SUV", plate: "MH-14-TU-1122", confidence: 93, status: "approved", camera: "CAM-02", lane: 0, direction: "—", speed: "0 km/h" },
  { id: "V-20260619-012", time: "13:55:44", chowk: "Jaikpura Gate", type: "Heavy Vehicle", vehicle: "Truck/HCV", plate: "MH-26-VW-3344", confidence: 96, status: "reviewed", camera: "CAM-03", lane: 1, direction: "South", speed: "25 km/h" },
];

const ALERTS = [
  { id: 1, msg: "Camera 2 offline at Bengali Camp Signal — last heartbeat 12 min ago", priority: "critical", time: "14:30", read: false, category: "device" },
  { id: 2, msg: "High red-light violations at Mutha Chowk — 47 today (threshold: 30)", priority: "warning", time: "14:25", read: false, category: "violation" },
  { id: 3, msg: "Emergency vehicle priority triggered at Vazirabad Chowk", priority: "info", time: "14:20", read: true, category: "signal" },
  { id: 4, msg: "RPI-NND-004 Bengali Camp heartbeat delayed > 10 minutes", priority: "warning", time: "14:18", read: false, category: "device" },
  { id: 5, msg: "Nigdi Chowk RPI back online after scheduled maintenance", priority: "info", time: "13:45", read: true, category: "device" },
  { id: 6, msg: "Signal tampering detected at Vazirabad Chowk — immediate inspection required", priority: "critical", time: "13:30", read: false, category: "signal" },
  { id: 7, msg: "PA system offline at Jaikpura Gate", priority: "warning", time: "13:15", read: true, category: "device" },
  { id: 8, msg: "Daily violation threshold crossed — 350+ violations across city", priority: "warning", time: "12:45", read: true, category: "violation" },
  { id: 9, msg: "New user registration: Rajesh Patil (Nanded Traffic Police) awaiting approval", priority: "info", time: "12:00", read: true, category: "admin" },
  { id: 10, msg: "Dapodi Junction peak hour — 62 violations in last 4 hours", priority: "warning", time: "11:30", read: true, category: "violation" },
];

const PA_ANNOUNCEMENTS = [
  { id: 1, time: "14:30:12", chowk: "Mutha Chowk", message: "Red light violation detected. Please obey traffic signals.", lang: "Hindi", triggered: "auto" },
  { id: 2, time: "14:25:05", chowk: "Vazirabad Chowk", message: "Helmet mandatory for two-wheeler riders. Your safety matters.", lang: "Marathi", triggered: "auto" },
  { id: 3, time: "14:18:33", chowk: "Dapodi Junction", message: "Zebra crossing violation. Give way to pedestrians.", lang: "Hindi", triggered: "auto" },
  { id: 4, time: "14:10:00", chowk: "Mutha Chowk", message: "Emergency vehicle approaching. Please clear the way immediately.", lang: "Hindi", triggered: "auto" },
  { id: 5, time: "13:45:22", chowk: "Kasarwadi Chowk", message: "Triple riding detected. Follow traffic rules for your safety.", lang: "Marathi", triggered: "auto" },
  { id: 6, time: "13:30:00", chowk: "All Chowks", message: "Reminder: Follow lane discipline. Heavy penalty for violations.", lang: "Hindi", triggered: "manual" },
];

const MARQUEE_MSGS = [
  "🚨 High red-light violation count at Mutha Chowk — 47 today",
  "📡 Camera 2 offline at Bengali Camp Signal",
  "🚑 Emergency vehicle priority active at Vazirabad Chowk",
  "📊 Today's total violations: 353 across 7 chowks",
  "✅ All PCMC corridor RPIs reporting healthy",
  "⚠️ Signal tampering alert — Vazirabad Chowk",
];

const PENDING_USERS = [
  { id: 1, name: "Rajesh Patil", email: "rajesh.patil@nandedpolice.gov.in", mobile: "+91 98765 43210", city: "Nanded", dept: "Traffic Police", designation: "Sub Inspector", role: "Traffic Police User", date: "2026-06-18" },
  { id: 2, name: "Amit Jadhav", email: "amit.jadhav@pcmc.gov.in", mobile: "+91 87654 32109", city: "Pimpri-Chinchwad", dept: "PCMC Traffic", designation: "Inspector", role: "City Admin", date: "2026-06-17" },
  { id: 3, name: "Sneha Kulkarni", email: "sneha.k@nwcmc.gov.in", mobile: "+91 76543 21098", city: "Nanded", dept: "Municipal Corporation", designation: "Executive Engineer", role: "Viewer", date: "2026-06-16" },
];

const DEVICE_HEALTH = [
  { id: "RPI-NND-001", chowk: "Mutha Chowk", city: "nanded", cpu: 42, mem: 61, temp: 52, disk: 34, uptime: "14d 6h", status: "healthy", cameras: [{ id: "CAM-01", status: "online" }, { id: "CAM-02", status: "online" }, { id: "CAM-03", status: "online" }, { id: "CAM-04", status: "online" }] },
  { id: "RPI-NND-002", chowk: "Vazirabad Chowk", city: "nanded", cpu: 38, mem: 55, temp: 49, disk: 28, uptime: "14d 6h", status: "healthy", cameras: [{ id: "CAM-01", status: "online" }, { id: "CAM-02", status: "online" }, { id: "CAM-03", status: "online" }] },
  { id: "RPI-NND-003", chowk: "Jaikpura Gate", city: "nanded", cpu: 67, mem: 78, temp: 61, disk: 45, uptime: "7d 2h", status: "warning", cameras: [{ id: "CAM-01", status: "online" }, { id: "CAM-02", status: "degraded" }, { id: "CAM-03", status: "online" }] },
  { id: "RPI-NND-004", chowk: "Bengali Camp Signal", city: "nanded", cpu: 0, mem: 0, temp: 0, disk: 0, uptime: "—", status: "offline", cameras: [{ id: "CAM-01", status: "offline" }, { id: "CAM-02", status: "offline" }] },
  { id: "RPI-PCMC-001", chowk: "Dapodi Junction", city: "pcmc", cpu: 35, mem: 48, temp: 47, disk: 22, uptime: "21d 0h", status: "healthy", cameras: [{ id: "CAM-01", status: "online" }, { id: "CAM-02", status: "online" }, { id: "CAM-03", status: "online" }, { id: "CAM-04", status: "online" }] },
  { id: "RPI-PCMC-002", chowk: "Kasarwadi Chowk", city: "pcmc", cpu: 44, mem: 52, temp: 50, disk: 31, uptime: "21d 0h", status: "healthy", cameras: [{ id: "CAM-01", status: "online" }, { id: "CAM-02", status: "online" }, { id: "CAM-03", status: "online" }] },
  { id: "RPI-PCMC-003", chowk: "Nigdi Chowk", city: "pcmc", cpu: 0, mem: 0, temp: 0, disk: 0, uptime: "—", status: "offline", cameras: [{ id: "CAM-01", status: "offline" }, { id: "CAM-02", status: "offline" }, { id: "CAM-03", status: "offline" }] },
];

const AUDIT_LOG = [
  { id: 1, timestamp: "2026-06-19 14:30:22", user: "admin@datamorphosis.in", action: "User approved", target: "rajesh.patil@nandedpolice.gov.in", ip: "103.21.XX.XX" },
  { id: 2, timestamp: "2026-06-19 13:15:10", user: "admin@datamorphosis.in", action: "City branding updated", target: "Nanded", ip: "103.21.XX.XX" },
  { id: 3, timestamp: "2026-06-19 12:45:03", user: "system", action: "Threshold alert triggered", target: "Daily violation count > 350", ip: "—" },
  { id: 4, timestamp: "2026-06-19 11:00:00", user: "admin@datamorphosis.in", action: "Device registered", target: "RPI-PCMC-003", ip: "103.21.XX.XX" },
  { id: 5, timestamp: "2026-06-18 16:30:00", user: "admin@datamorphosis.in", action: "User rejected", target: "unknown@test.com", ip: "103.21.XX.XX" },
  { id: 6, timestamp: "2026-06-18 10:00:00", user: "system", action: "Login", target: "admin@datamorphosis.in", ip: "103.21.XX.XX" },
];

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#6b7280"];

// ─── SMALL COMPONENTS ────────────────────────────────────────────────────────

function StatusDot({ status }) {
  const color = status === "active" || status === "healthy" || status === "online" ? "#10b981" : status === "warning" || status === "degraded" ? "#f59e0b" : "#ef4444";
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", backgroundColor: color, marginRight: 6, boxShadow: `0 0 6px ${color}` }} />;
}

function SignalIndicator({ phase }) {
  const colors = { red: ["#ef4444", "#333", "#333"], yellow: ["#333", "#eab308", "#333"], green: ["#333", "#333", "#10b981"], unknown: ["#333", "#333", "#333"] };
  const c = colors[phase] || colors.unknown;
  return (
    <div style={{ display: "flex", gap: 3 }}>
      {c.map((cl, i) => <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: cl, border: "1px solid #555", boxShadow: cl !== "#333" ? `0 0 6px ${cl}` : "none" }} />)}
    </div>
  );
}

function KPICard({ label, value, sub, icon, trend, color = "#3b82f6" }) {
  return (
    <div style={{ background: "var(--card)", borderRadius: 10, padding: "16px 18px", border: "1px solid var(--border)", borderTop: `2px solid ${color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          <div style={{ fontSize: 26, fontWeight: 800, color: "var(--text)", lineHeight: 1.1 }}>{value}</div>
          {sub && <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{sub}</div>}
        </div>
        <span style={{ fontSize: 24, opacity: 0.7 }}>{icon}</span>
      </div>
      {trend !== undefined && (
        <div style={{ marginTop: 8, fontSize: 11, color: trend > 0 ? "#ef4444" : "#10b981", fontWeight: 600 }}>
          {trend > 0 ? "▲" : "▼"} {Math.abs(trend)}% vs yesterday
        </div>
      )}
    </div>
  );
}

function ViolationBadge({ type }) {
  const colors = {
    "Red Light Jump": "#ef4444", "No Helmet": "#f97316", "Triple Seat": "#eab308", "Zebra Crossing": "#8b5cf6",
    "Wrong Lane": "#06b6d4", "Signal Tampering": "#dc2626", "No Parking": "#a855f7", "Seat Belt": "#14b8a6",
    "Mobile Phone": "#f43f5e", "Heavy Vehicle": "#78716c", "Overcrowding": "#d946ef", "Emergency Block": "#dc2626",
    "Camera Offline": "#6b7280", "Incident Detected": "#f59e0b", "Unknown": "#9ca3af",
    "new": "#3b82f6", "reviewed": "#f59e0b", "approved": "#10b981", "rejected": "#ef4444", "challan-ready": "#8b5cf6",
  };
  const c = colors[type] || "#6b7280";
  return <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, backgroundColor: c + "18", color: c, border: `1px solid ${c}33`, whiteSpace: "nowrap" }}>{type}</span>;
}

function ProgressBar({ value, max = 100, color = "#3b82f6", height = 5 }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div style={{ height, background: "var(--border)", borderRadius: height / 2, overflow: "hidden", width: "100%" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: height / 2, transition: "width 0.5s" }} />
    </div>
  );
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────

function LoginScreen({ onLogin, onRegister, onForgot }) {
  const [email, setEmail] = useState("admin@datamorphosis.in");
  const [pass, setPass] = useState("••••••••");
  const [showPass, setShowPass] = useState(false);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 400, padding: 40, borderRadius: 16, background: "#fff", border: "2px solid #1E293B", boxShadow: "0 25px 50px rgba(0,0,0,0.4)" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <img src="/logo.svg" alt="Datamorphosis" style={{ width: 100, height: 80, marginBottom: 12, filter: "drop-shadow(0 4px 16px rgba(37,99,235,0.35))" }} />
          <h1 style={{ color: "#0F172A", fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Smart Traffic Intelligence</h1>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Datamorphosis Technologies Pvt. Ltd.</p>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 12, color: "#334155", marginBottom: 6 }}>Email Address</label>
          <input value={email} onChange={e => setEmail(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#F8FAFC", color: "#0F172A", border: "2px solid #1E293B", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: "block", fontSize: 12, color: "#334155", marginBottom: 6 }}>Password</label>
          <div style={{ position: "relative" }}>
            <input type={showPass ? "text" : "password"} value={pass} onChange={e => setPass(e.target.value)} style={{ width: "100%", padding: "10px 40px 10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#F8FAFC", color: "#0F172A", border: "2px solid #1E293B", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            <button onClick={() => setShowPass(!showPass)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 14 }}>{showPass ? "🙈" : "👁️"}</button>
          </div>
        </div>
        <div style={{ textAlign: "right", marginBottom: 20 }}>
          <button onClick={onForgot} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12, cursor: "pointer", padding: 0 }}>Forgot password?</button>
        </div>
        <button onClick={onLogin} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>Sign In</button>
        <div style={{ textAlign: "center" }}>
          <span style={{ color: "#64748b", fontSize: 13 }}>New user? </span>
          <button onClick={onRegister} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>Register for access</button>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTRATION SCREEN ─────────────────────────────────────────────────────

function RegistrationScreen({ onBack }) {
  const fields = [
    { label: "Full Name", placeholder: "Enter your full name" },
    { label: "Email ID", placeholder: "official.email@gov.in", type: "email" },
    { label: "Mobile Number", placeholder: "+91 98765 43210", type: "tel" },
    { label: "City Name", placeholder: "e.g. Nanded" },
    { label: "Municipal Corporation", placeholder: "e.g. Nanded Waghala City Municipal Corporation" },
    { label: "Police Department", placeholder: "e.g. Nanded City Police" },
    { label: "Department", placeholder: "e.g. Traffic Control" },
    { label: "Designation", placeholder: "e.g. Sub Inspector" },
    { label: "Requested Role", placeholder: "Select role", type: "select", options: ["Traffic Police User", "City Admin", "Viewer", "Auditor"] },
  ];
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)", fontFamily: "'Inter', system-ui, sans-serif", padding: 20 }}>
      <div style={{ width: 480, padding: 36, borderRadius: 16, background: "rgba(17,24,39,0.85)", border: "1px solid rgba(255,255,255,0.08)", maxHeight: "90vh", overflowY: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo.svg" alt="Datamorphosis" style={{ width: 80, height: 64, marginBottom: 8 }} />
          <h1 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>Register for Access</h1>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>Your registration will be reviewed by the Super Admin</p>
        </div>
        <div style={{ display: "grid", gap: 14 }}>
          {fields.map(f => (
            <div key={f.label}>
              <label style={{ display: "block", fontSize: 12, color: "#94a3b8", marginBottom: 5 }}>{f.label}</label>
              {f.type === "select" ? (
                <select style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#F8FAFC", color: "#0F172A", border: "2px solid #1E293B", fontSize: 13, outline: "none", boxSizing: "border-box" }}>
                  <option value="">Select...</option>
                  {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input placeholder={f.placeholder} type={f.type || "text"} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#F8FAFC", color: "#0F172A", border: "2px solid #1E293B", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
              )}
            </div>
          ))}
        </div>
        <button style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", marginTop: 20 }}>Submit Registration</button>
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer" }}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
}

// ─── PASSWORD RESET SCREEN ───────────────────────────────────────────────────

function ForgotPasswordScreen({ onBack }) {
  const [sent, setSent] = useState(false);
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)", fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 400, padding: 40, borderRadius: 16, background: "rgba(17,24,39,0.85)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src="/logo.svg" alt="Datamorphosis" style={{ width: 80, height: 64, marginBottom: 8 }} />
          <h1 style={{ color: "#f8fafc", fontSize: 18, fontWeight: 700, margin: "0 0 6px" }}>{sent ? "Check Your Email" : "Reset Password"}</h1>
          <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>{sent ? "A password reset link has been sent to your registered email." : "Enter your registered email to receive a reset link."}</p>
        </div>
        {!sent && (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, color: "#334155", marginBottom: 6 }}>Email Address</label>
              <input placeholder="your.email@gov.in" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "#F8FAFC", color: "#0F172A", border: "2px solid #1E293B", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
            <button onClick={() => setSent(true)} style={{ width: "100%", padding: "12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer", marginBottom: 12 }}>Send Reset Link</button>
          </>
        )}
        <div style={{ textAlign: "center", marginTop: sent ? 16 : 0 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, cursor: "pointer" }}>← Back to Login</button>
        </div>
      </div>
    </div>
  );
}

// ─── EVIDENCE DETAIL MODAL ───────────────────────────────────────────────────

function EvidenceModal({ violation, onClose, dark }) {
  const [note, setNote] = useState("");
  if (!violation) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }} onClick={onClose}>
      <div style={{ width: 680, maxHeight: "90vh", overflowY: "auto", background: "var(--card)", borderRadius: 14, border: "1px solid var(--border)", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }} onClick={e => e.stopPropagation()}>
        {/* Evidence Image Area */}
        <div style={{ height: 260, background: `linear-gradient(135deg, ${dark ? "#0f1a2e" : "#dbeafe"}, ${dark ? "#0a0e1a" : "#f0f4ff"})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", borderRadius: "14px 14px 0 0" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: 64, opacity: 0.25 }}>📷</span>
            <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>Evidence image placeholder</div>
          </div>
          <button onClick={onClose} style={{ position: "absolute", top: 12, right: 12, width: 32, height: 32, borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
          <div style={{ position: "absolute", top: 12, left: 12 }}><ViolationBadge type={violation.status} /></div>
          <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 8 }}>
            <span style={{ background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#fff" }}>{violation.camera}</span>
            <span style={{ background: "rgba(0,0,0,0.6)", borderRadius: 6, padding: "4px 10px", fontSize: 11, color: "#fff" }}>Lane {violation.lane}</span>
          </div>
        </div>
        {/* Detail Section */}
        <div style={{ padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <h3 style={{ color: "var(--text)", fontSize: 18, fontWeight: 700, margin: "0 0 4px" }}>{violation.type}</h3>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{violation.chowk} • {violation.time} • {new Date().toLocaleDateString("en-IN")}</div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: violation.confidence > 90 ? "#10b981" : "#f59e0b" }}>{violation.confidence}%</div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[
              { l: "Vehicle", v: violation.vehicle },
              { l: "Number Plate", v: violation.plate },
              { l: "Direction", v: violation.direction },
              { l: "Speed", v: violation.speed },
              { l: "Violation ID", v: violation.id },
              { l: "Camera", v: violation.camera },
            ].map(d => (
              <div key={d.l} style={{ background: "var(--bg)", borderRadius: 8, padding: "10px 12px" }}>
                <div style={{ fontSize: 10, color: "var(--muted)", textTransform: "uppercase", marginBottom: 3 }}>{d.l}</div>
                <div style={{ fontSize: 13, color: "var(--text)", fontWeight: 600, fontFamily: "monospace" }}>{d.v}</div>
              </div>
            ))}
          </div>
          {/* Notes */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Officer Notes</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add notes for this violation evidence..." rows={3} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, resize: "vertical", outline: "none", boxSizing: "border-box", fontFamily: "inherit" }} />
          </div>
          {/* Action Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✓ Approve</button>
            <button style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>✕ Reject</button>
            <button style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "#8b5cf6", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>📝 Challan Ready</button>
            <button style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 13, cursor: "pointer" }}>⬇ Download</button>
          </div>
          {/* Audit Trail */}
          <div style={{ marginTop: 16, padding: "12px", background: "var(--bg)", borderRadius: 8, border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Audit Trail</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              <div style={{ marginBottom: 4 }}>• {violation.time} — Violation captured by {violation.camera}</div>
              <div style={{ marginBottom: 4 }}>• {violation.time} — Evidence hash: SHA-256 verified</div>
              {violation.status !== "new" && <div>• {violation.time} — Status changed to "{violation.status}"</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CHOWK MAP VIEW ─────────────────────────────────────────────────────────

function ChowkMapView({ chowks, onSelect, dark }) {
  const allChowks = chowks;
  const centerLat = allChowks.reduce((s, c) => s + c.lat, 0) / allChowks.length;
  const centerLng = allChowks.reduce((s, c) => s + c.lng, 0) / allChowks.length;
  const latRange = Math.max(...allChowks.map(c => c.lat)) - Math.min(...allChowks.map(c => c.lat));
  const lngRange = Math.max(...allChowks.map(c => c.lng)) - Math.min(...allChowks.map(c => c.lng));
  const scale = Math.min(500 / (latRange || 0.01), 700 / (lngRange || 0.01)) * 0.6;

  return (
    <div style={{ background: "var(--card)", borderRadius: 12, border: "1px solid var(--border)", padding: 20, position: "relative" }}>
      <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Chowk Map View</h3>
      <div style={{ height: 340, position: "relative", background: dark ? "rgba(15,23,42,0.5)" : "rgba(241,245,249,0.5)", borderRadius: 10, overflow: "hidden" }}>
        {/* Grid lines */}
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.1 }}>
          {Array.from({ length: 20 }, (_, i) => (
            <g key={i}>
              <line x1={`${i * 5}%`} y1="0" x2={`${i * 5}%`} y2="100%" stroke="var(--muted)" strokeWidth="0.5" />
              <line x1="0" y1={`${i * 5}%`} x2="100%" y2={`${i * 5}%`} stroke="var(--muted)" strokeWidth="0.5" />
            </g>
          ))}
        </svg>
        {/* Chowk markers */}
        {allChowks.map(c => {
          const x = 50 + (c.lng - centerLng) * scale;
          const y = 50 - (c.lat - centerLat) * scale;
          const dotColor = c.status === "active" ? "#10b981" : c.status === "warning" ? "#f59e0b" : "#ef4444";
          return (
            <div key={c.id} onClick={() => onSelect(c)} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)", cursor: "pointer", textAlign: "center", zIndex: 2 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: dotColor + "25", border: `2px solid ${dotColor}`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 0 16px ${dotColor}40`, transition: "transform 0.2s" }}
                onMouseOver={e => e.currentTarget.style.transform = "scale(1.2)"}
                onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
                <span style={{ fontSize: 16 }}>🚦</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: "var(--text)", fontWeight: 600, whiteSpace: "nowrap", background: "var(--card)", padding: "2px 6px", borderRadius: 4, border: "1px solid var(--border)" }}>
                {c.name}
              </div>
              <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 1 }}>{c.violations} violations</div>
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 16, marginTop: 12, justifyContent: "center" }}>
        {[
          { color: "#10b981", label: "Active" },
          { color: "#f59e0b", label: "Warning" },
          { color: "#ef4444", label: "Offline" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "var(--muted)" }}>
            <span style={{ width: 10, height: 10, borderRadius: "50%", background: l.color, display: "inline-block" }} />
            {l.label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── CHOWK DETAIL VIEW ──────────────────────────────────────────────────────

function ChowkDetailView({ chowk, onBack, dark }) {
  const [tab, setTab] = useState("overview");
  const chowkViolations = RECENT_VIOLATIONS.filter(v => v.chowk === chowk.name);
  const allViolations = chowkViolations.length > 0 ? chowkViolations : RECENT_VIOLATIONS.slice(0, 4).map(v => ({ ...v, chowk: chowk.name }));
  const deviceInfo = DEVICE_HEALTH.find(d => d.id === chowk.rpiId) || DEVICE_HEALTH[0];
  const chowkPA = PA_ANNOUNCEMENTS.filter(p => p.chowk === chowk.name || p.chowk === "All Chowks");

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 13, cursor: "pointer", marginBottom: 12, padding: 0 }}>← Back to {tab === "overview" ? "Dashboard" : "Overview"}</button>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <StatusDot status={chowk.status} />
          <div>
            <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: 0 }}>{chowk.name}</h2>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>{chowk.rpiId} • {chowk.lat.toFixed(4)}°N, {chowk.lng.toFixed(4)}°E • Last sync: {chowk.lastSync}</div>
          </div>
        </div>
        <SignalIndicator phase={chowk.signalPhase} />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", paddingBottom: 2 }}>
        {["overview", "violations", "pa_log", "cctv"].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 16px", borderRadius: "6px 6px 0 0", border: "none", background: tab === t ? "var(--card)" : "transparent", color: tab === t ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer", borderBottom: tab === t ? "2px solid var(--accent)" : "2px solid transparent" }}>
            {t === "overview" ? "Overview" : t === "violations" ? "Violations" : t === "pa_log" ? "PA Log" : "Live CCTV"}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          {/* KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12, marginBottom: 16 }}>
            <KPICard label="Vehicles" value={chowk.vehicles.toLocaleString()} icon="🚗" />
            <KPICard label="Violations" value={chowk.violations} icon="⚠️" color="#ef4444" />
            <KPICard label="Cameras" value={chowk.cameras} icon="📷" />
            <KPICard label="Lanes" value={chowk.lanes} icon="🛣️" />
            <KPICard label="PA System" value={chowk.paStatus} icon="📢" color={chowk.paStatus === "active" ? "#10b981" : "#ef4444"} />
          </div>

          {/* Device Health + Hourly Chart */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)" }}>
              <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Device Health — {deviceInfo.id}</h3>
              {deviceInfo.status !== "offline" ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {[
                    { l: "CPU", v: deviceInfo.cpu, c: deviceInfo.cpu > 80 ? "#ef4444" : "#3b82f6" },
                    { l: "Memory", v: deviceInfo.mem, c: deviceInfo.mem > 80 ? "#ef4444" : "#10b981" },
                    { l: "Temperature", v: deviceInfo.temp, max: 85, c: deviceInfo.temp > 65 ? "#ef4444" : "#f59e0b" },
                    { l: "Disk", v: deviceInfo.disk, c: deviceInfo.disk > 80 ? "#ef4444" : "#8b5cf6" },
                  ].map(m => (
                    <div key={m.l}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                        <span style={{ color: "var(--muted)" }}>{m.l}</span>
                        <span style={{ color: "var(--text)", fontWeight: 600 }}>{m.v}{m.l === "Temperature" ? "°C" : "%"}</span>
                      </div>
                      <ProgressBar value={m.v} max={m.max || 100} color={m.c} height={6} />
                    </div>
                  ))}
                  <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>Uptime: {deviceInfo.uptime}</div>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>Camera Status</div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {deviceInfo.cameras.map(cam => (
                        <div key={cam.id} style={{ display: "flex", alignItems: "center", gap: 4, padding: "4px 10px", borderRadius: 6, background: "var(--bg)", border: "1px solid var(--border)", fontSize: 11 }}>
                          <StatusDot status={cam.status} />
                          <span style={{ color: "var(--text)" }}>{cam.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ color: "#ef4444", fontSize: 14, padding: "20px 0", textAlign: "center" }}>Device offline — no telemetry available</div>
              )}
            </div>
            <div style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)" }}>
              <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Hourly Traffic</h3>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={HOURLY_DATA}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted)" }} interval={3} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="vehicles" stroke="#3b82f6" fill="#3b82f620" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {tab === "violations" && (
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Violation Log</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>⬇ CSV</button>
              <button style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>⬇ PDF</button>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["Time", "Type", "Vehicle", "Plate", "Lane", "Camera", "Confidence", "Status"].map(h => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {allViolations.map(v => (
                  <tr key={v.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--text)", fontFamily: "monospace" }}>{v.time}</td>
                    <td style={{ padding: "10px 14px" }}><ViolationBadge type={v.type} /></td>
                    <td style={{ padding: "10px 14px", color: "var(--text)" }}>{v.vehicle}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)", fontFamily: "monospace" }}>{v.plate}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)" }}>{v.lane}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{v.camera}</td>
                    <td style={{ padding: "10px 14px", color: v.confidence > 90 ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{v.confidence}%</td>
                    <td style={{ padding: "10px 14px" }}><ViolationBadge type={v.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "pa_log" && (
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>📢 PA Announcement History</span>
          </div>
          <div style={{ padding: 18, display: "grid", gap: 10 }}>
            {chowkPA.length > 0 ? chowkPA.map(p => (
              <div key={p.id} style={{ display: "flex", gap: 14, padding: "12px 14px", borderRadius: 8, background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: p.triggered === "auto" ? "#3b82f620" : "#f59e0b20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>{p.triggered === "auto" ? "🤖" : "👤"}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>{p.message}</div>
                  <div style={{ fontSize: 11, color: "var(--muted)" }}>{p.time} • {p.lang} • {p.triggered === "auto" ? "Auto-triggered" : "Manual"}</div>
                </div>
              </div>
            )) : (
              <div style={{ color: "var(--muted)", fontSize: 13, textAlign: "center", padding: 20 }}>No PA announcements recorded for this chowk.</div>
            )}
          </div>
        </div>
      )}

      {tab === "cctv" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {Array.from({ length: chowk.cameras }, (_, i) => (
            <div key={i} style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
              <div style={{ height: 200, background: dark ? "#0a0e1a" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontSize: 40, opacity: 0.2 }}>📹</span>
                  <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>CCTV Feed — CAM-0{i + 1}</div>
                  <div style={{ color: "var(--muted)", fontSize: 10, marginTop: 2 }}>WebRTC / HLS stream placeholder</div>
                </div>
                <div style={{ position: "absolute", top: 8, right: 8, display: "flex", alignItems: "center", gap: 4, background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "3px 8px" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: chowk.status !== "offline" ? "#ef4444" : "#6b7280", animation: chowk.status !== "offline" ? "pulse 1.5s infinite" : "none" }} />
                  <span style={{ fontSize: 10, color: "#fff", fontWeight: 600 }}>{chowk.status !== "offline" ? "LIVE" : "OFFLINE"}</span>
                </div>
              </div>
              <div style={{ padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>CAM-0{i + 1}</span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>{chowk.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── NOTIFICATIONS PAGE ──────────────────────────────────────────────────────

function NotificationsPage({ alerts }) {
  const [filter, setFilter] = useState("all");
  const filtered = filter === "all" ? alerts : filter === "unread" ? alerts.filter(a => !a.read) : alerts.filter(a => a.category === filter);
  const priorityIcon = { critical: "🔴", warning: "🟡", info: "🔵" };
  const priorityBorder = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: 0 }}>Notifications & Alerts</h2>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>{alerts.filter(a => !a.read).length} unread</span>
      </div>
      {/* Filters */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {["all", "unread", "critical", "device", "violation", "signal", "admin"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ padding: "6px 14px", borderRadius: 20, border: "1px solid var(--border)", background: filter === f ? "var(--accent)" : "var(--card)", color: filter === f ? "#fff" : "var(--muted)", fontSize: 12, fontWeight: filter === f ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
        ))}
      </div>
      {/* Alert List */}
      <div style={{ display: "grid", gap: 8 }}>
        {filtered.map(a => (
          <div key={a.id} style={{ display: "flex", gap: 14, padding: "14px 16px", borderRadius: 10, background: "var(--card)", border: "1px solid var(--border)", borderLeft: `3px solid ${priorityBorder[a.priority]}`, opacity: a.read ? 0.7 : 1 }}>
            <div style={{ fontSize: 18, flexShrink: 0 }}>{priorityIcon[a.priority]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, color: "var(--text)", fontWeight: a.read ? 400 : 600, marginBottom: 3 }}>{a.msg}</div>
              <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--muted)" }}>
                <span>{a.time}</span>
                <span style={{ textTransform: "capitalize" }}>{a.category}</span>
                <span style={{ textTransform: "capitalize" }}>{a.priority}</span>
              </div>
            </div>
            {!a.read && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3b82f6", flexShrink: 0, marginTop: 4 }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── ADMIN PANEL ─────────────────────────────────────────────────────────────

function AdminPanel({ dark }) {
  const [tab, setTab] = useState("approvals");
  const tabs = [
    { id: "approvals", label: "User Approvals", icon: "👥" },
    { id: "cities", label: "Cities", icon: "🏙️" },
    { id: "devices", label: "Device Fleet", icon: "🖥️" },
    { id: "branding", label: "Branding", icon: "🎨" },
    { id: "audit", label: "Audit Log", icon: "📋" },
  ];

  return (
    <div>
      <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Super Admin Panel</h2>
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid var(--border)", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: "10px 18px", borderRadius: "8px 8px 0 0", border: "none", background: tab === t.id ? "var(--card)" : "transparent", color: tab === t.id ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: tab === t.id ? 600 : 400, cursor: "pointer", whiteSpace: "nowrap", borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent" }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* User Approvals */}
      {tab === "approvals" && (
        <div style={{ display: "grid", gap: 12 }}>
          {PENDING_USERS.map(u => (
            <div key={u.id} style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", marginBottom: 4 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{u.email} • {u.mobile}</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>{u.city} • {u.dept} • {u.designation}</div>
                <div style={{ marginTop: 6 }}><ViolationBadge type={u.role} /></div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: "#10b981", color: "#fff", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✓ Approve</button>
                <button style={{ padding: "8px 18px", borderRadius: 8, border: "1px solid #ef4444", background: "transparent", color: "#ef4444", fontWeight: 600, fontSize: 12, cursor: "pointer" }}>✕ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cities Management */}
      {tab === "cities" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            {CITIES.map(c => (
              <div key={c.id} style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 2 }}>{c.corporation}</div>
                <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 8 }}>{c.police}</div>
                <div style={{ display: "flex", gap: 8, fontSize: 12 }}>
                  <span style={{ color: "var(--text)" }}>{(CHOWKS[c.id] || []).length} chowks</span>
                  <span style={{ color: "var(--muted)" }}>•</span>
                  <span style={{ color: "var(--text)" }}>{DEVICE_HEALTH.filter(d => d.city === c.id).length} devices</span>
                </div>
              </div>
            ))}
          </div>
          <button style={{ padding: "10px 20px", borderRadius: 8, border: "2px dashed var(--border)", background: "transparent", color: "var(--accent)", fontSize: 13, fontWeight: 500, cursor: "pointer", width: "100%" }}>+ Add New City</button>
        </div>
      )}

      {/* Device Fleet */}
      {tab === "devices" && (
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["Device ID", "Chowk", "Status", "CPU", "Mem", "Temp", "Disk", "Uptime", "Cameras"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {DEVICE_HEALTH.map(d => (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--text)", fontFamily: "monospace", fontWeight: 600 }}>{d.id}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)" }}>{d.chowk}</td>
                    <td style={{ padding: "10px 14px" }}><StatusDot status={d.status} /><span style={{ color: "var(--text)", textTransform: "capitalize" }}>{d.status}</span></td>
                    <td style={{ padding: "10px 14px", color: d.cpu > 80 ? "#ef4444" : "var(--text)" }}>{d.cpu}%</td>
                    <td style={{ padding: "10px 14px", color: d.mem > 80 ? "#ef4444" : "var(--text)" }}>{d.mem}%</td>
                    <td style={{ padding: "10px 14px", color: d.temp > 65 ? "#ef4444" : "var(--text)" }}>{d.temp}°C</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)" }}>{d.disk}%</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{d.uptime}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {d.cameras.map(cam => <StatusDot key={cam.id} status={cam.status} />)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Branding */}
      {tab === "branding" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {CITIES.map(c => (
            <div key={c.id} style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
              <h3 style={{ color: "var(--text)", fontSize: 15, fontWeight: 700, margin: "0 0 14px" }}>{c.name} Branding</h3>
              <div style={{ display: "grid", gap: 12 }}>
                {["Municipal Corporation Logo", "Police Department Logo", "Dashboard Title", "Commissioner Photo", "Project Initiative Text"].map(field => (
                  <div key={field}>
                    <label style={{ display: "block", fontSize: 11, color: "var(--muted)", marginBottom: 4, textTransform: "uppercase" }}>{field}</label>
                    {field.includes("Logo") || field.includes("Photo") ? (
                      <div style={{ height: 60, borderRadius: 8, border: "2px dashed var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                        <span style={{ fontSize: 12, color: "var(--muted)" }}>Click to upload</span>
                      </div>
                    ) : (
                      <input defaultValue={field === "Dashboard Title" ? "Smart Traffic Enforcement Dashboard" : ""} placeholder={`Enter ${field.toLowerCase()}`} style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                    )}
                  </div>
                ))}
                <button style={{ padding: "8px 16px", borderRadius: 6, border: "none", background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Save Branding</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Audit Log */}
      {tab === "audit" && (
        <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr>{["Timestamp", "User", "Action", "Target", "IP"].map(h => (
                  <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {AUDIT_LOG.map(l => (
                  <tr key={l.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", fontFamily: "monospace", fontSize: 11 }}>{l.timestamp}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)" }}>{l.user}</td>
                    <td style={{ padding: "10px 14px", color: "var(--text)", fontWeight: 500 }}>{l.action}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)" }}>{l.target}</td>
                    <td style={{ padding: "10px 14px", color: "var(--muted)", fontFamily: "monospace" }}>{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── AUTHORITY BRANDING BANNER ───────────────────────────────────────────────

function AuthorityBanner({ city, dark }) {
  return (
    <div style={{ background: "var(--card)", borderRadius: 10, padding: "14px 20px", border: "1px solid var(--border)", marginBottom: 16, display: "flex", alignItems: "center", gap: 20 }}>
      {/* City Emblem Placeholder */}
      <div style={{ width: 48, height: 48, borderRadius: "50%", background: dark ? "#1e293b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--border)" }}>
        <span style={{ fontSize: 22 }}>🏛️</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 }}>{city?.corporation}</div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>{city?.police} • {city?.state}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Municipal Commissioner</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{city?.commissioner}</div>
      </div>
      <div style={{ width: 1, height: 36, background: "var(--border)", flexShrink: 0 }} />
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>Commissioner of Police</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{city?.cp}</div>
      </div>
      <div style={{ width: 36, height: 36, borderRadius: "50%", background: dark ? "#1e293b" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "2px solid var(--border)" }}>
        <span style={{ fontSize: 18 }}>👮</span>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState("login");
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(false);
  const [selectedCity, setSelectedCity] = useState("nanded");
  const [selectedChowk, setSelectedChowk] = useState(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [marqueePos, setMarqueePos] = useState(0);
  const [liveCounter, setLiveCounter] = useState(0);
  const [evidenceModal, setEvidenceModal] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => setMarqueePos(p => (p + 1) % MARQUEE_MSGS.length), 5000);
    return () => clearInterval(iv);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => setLiveCounter(c => c + 1), 3000);
    return () => clearInterval(iv);
  }, []);

  const city = CITIES.find(c => c.id === selectedCity);
  const chowks = CHOWKS[selectedCity] || [];
  const totalVehicles = chowks.reduce((s, c) => s + c.vehicles, 0) + liveCounter * 3;
  const totalViolations = chowks.reduce((s, c) => s + c.violations, 0);
  const onlineDevices = chowks.filter(c => c.status === "active").length;

  const themeVars = dark
    ? { "--bg": "#0a0e1a", "--card": "#111827", "--border": "#1e293b", "--text": "#f8fafc", "--muted": "#64748b", "--accent": "#3b82f6" }
    : { "--bg": "#f8fafc", "--card": "#ffffff", "--border": "#1E293B", "--text": "#0f172a", "--muted": "#64748b", "--accent": "#2563eb" };

  if (screen === "login") return <LoginScreen onLogin={() => setScreen("dashboard")} onRegister={() => setScreen("register")} onForgot={() => setScreen("forgot")} />;
  if (screen === "register") return <RegistrationScreen onBack={() => setScreen("login")} />;
  if (screen === "forgot") return <ForgotPasswordScreen onBack={() => setScreen("login")} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "violations", label: "Violations", icon: "⚠️" },
    { id: "chowks", label: "Chowks", icon: "🚦" },
    { id: "map", label: "Map View", icon: "🗺️" },
    { id: "devices", label: "Devices", icon: "🖥️" },
    { id: "evidence", label: "Evidence", icon: "📷" },
    { id: "notifications", label: "Alerts", icon: "🔔" },
    { id: "reports", label: "Reports", icon: "📈" },
    { id: "admin", label: "Admin", icon: "⚙️" },
  ];

  const unreadAlerts = ALERTS.filter(a => !a.read).length;

  return (
    <div style={{ ...themeVars, minHeight: "100vh", background: "var(--bg)", fontFamily: "'Inter', system-ui, sans-serif", display: "flex", color: "var(--text)" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "var(--card)", borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", flexShrink: 0, position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <img src="/logo.svg" alt="Datamorphosis" style={{ width: 48, height: 38, display: "block", margin: "0 auto 4px", filter: "drop-shadow(0 2px 8px rgba(37,99,235,0.3))" }} />
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)", textAlign: "center", lineHeight: 1.2 }}>Smart Traffic</div>
          <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "center", letterSpacing: 0.3 }}>Intelligence Dashboard</div>
          <div style={{ fontSize: 9, color: "var(--accent)", textAlign: "center", marginTop: 4, letterSpacing: 0.5, textTransform: "uppercase" }}>Datamorphosis Technologies</div>
        </div>
        <div style={{ padding: "0 12px 10px" }}>
          <select value={selectedCity} onChange={e => { setSelectedCity(e.target.value); setSelectedChowk(null); setPage("dashboard"); }}
            style={{ width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 12, outline: "none" }}>
            {CITIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <nav style={{ flex: 1, padding: "0 8px", overflowY: "auto" }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => { setPage(n.id); setSelectedChowk(null); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "9px 12px", marginBottom: 2, borderRadius: 6,
                border: "none", background: page === n.id ? "rgba(88,166,255,0.12)" : "transparent",
                color: page === n.id ? "var(--accent)" : "var(--muted)", fontSize: 13, fontWeight: page === n.id ? 600 : 400,
                cursor: "pointer", textAlign: "left", position: "relative" }}>
              <span style={{ fontSize: 15 }}>{n.icon}</span> {n.label}
              {n.id === "notifications" && unreadAlerts > 0 && (
                <span style={{ position: "absolute", right: 10, width: 18, height: 18, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadAlerts}</span>
              )}
            </button>
          ))}
        </nav>
        <div style={{ padding: "12px", borderTop: "1px solid var(--border)" }}>
          <button onClick={() => setDark(!dark)} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>
            {dark ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button onClick={() => setScreen("login")} style={{ width: "100%", padding: "8px", borderRadius: 6, border: "none", background: "transparent", color: "#ef4444", fontSize: 12, cursor: "pointer", marginTop: 4 }}>
            ← Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 24px", borderBottom: "1px solid var(--border)", background: "var(--card)", position: "sticky", top: 0, zIndex: 100 }}>
          <div style={{ flex: 1, overflow: "hidden", marginRight: 16 }}>
            <div style={{ fontSize: 12, color: "#f59e0b", fontWeight: 500, whiteSpace: "nowrap", animation: "none" }}>
              {MARQUEE_MSGS[marqueePos]}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>LIVE</span>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setShowAlerts(!showAlerts)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", padding: 4, position: "relative", color: "var(--muted)" }}>
                🔔
                {unreadAlerts > 0 && <span style={{ position: "absolute", top: 0, right: 0, width: 16, height: 16, borderRadius: "50%", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{unreadAlerts}</span>}
              </button>
              {showAlerts && (
                <div style={{ position: "absolute", right: 0, top: 36, width: 340, maxHeight: 400, overflowY: "auto", background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", boxShadow: "0 8px 30px rgba(0,0,0,0.2)", zIndex: 999 }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>Alerts</span>
                    <button onClick={() => { setPage("notifications"); setShowAlerts(false); }} style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>View All</button>
                  </div>
                  {ALERTS.slice(0, 5).map(a => (
                    <div key={a.id} style={{ padding: "10px 16px", borderBottom: "1px solid var(--border)", opacity: a.read ? 0.6 : 1 }}>
                      <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 2 }}>{a.priority === "critical" ? "🔴" : a.priority === "warning" ? "🟡" : "🔵"} {a.msg}</div>
                      <div style={{ fontSize: 10, color: "var(--muted)" }}>{a.time}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>admin@datamorphosis.in</div>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: 24, overflowY: "auto" }} onClick={() => showAlerts && setShowAlerts(false)}>
          {selectedChowk ? (
            <ChowkDetailView chowk={selectedChowk} onBack={() => setSelectedChowk(null)} dark={dark} />
          ) : page === "admin" ? (
            <AdminPanel dark={dark} />
          ) : page === "notifications" ? (
            <NotificationsPage alerts={ALERTS} />
          ) : page === "map" ? (
            /* ─── MAP VIEW ──────────────────────────────────────── */
            <div>
              <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Map View — {city?.name}</h2>
              <ChowkMapView chowks={chowks} onSelect={setSelectedChowk} dark={dark} />
              <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
                {chowks.map(c => (
                  <div key={c.id} onClick={() => setSelectedChowk(c)} style={{ background: "var(--card)", borderRadius: 8, padding: "12px 14px", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <StatusDot status={c.status} />
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.vehicles.toLocaleString()} vehicles • {c.violations} violations</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : page === "violations" ? (
            /* ─── VIOLATIONS PAGE ───────────────────────────────── */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: 0 }}>Violations — {city?.name}</h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <input placeholder="Search plate, chowk..." style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--text)", fontSize: 12, outline: "none", width: 200 }} />
                  <button style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 12, cursor: "pointer" }}>⬇ Export CSV</button>
                </div>
              </div>
              {/* Filter badges */}
              <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                {["All", "new", "reviewed", "approved", "rejected", "challan-ready"].map(s => (
                  <button key={s} style={{ padding: "5px 14px", borderRadius: 20, border: "1px solid var(--border)", background: s === "All" ? "var(--accent)" : "var(--card)", color: s === "All" ? "#fff" : "var(--muted)", fontSize: 11, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>
                ))}
              </div>
              <div style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr>{["ID", "Time", "Chowk", "Type", "Vehicle", "Plate", "Lane", "Dir", "Speed", "Camera", "Confidence", "Status", "Action"].map(h => (
                        <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--muted)", fontWeight: 600, borderBottom: "1px solid var(--border)", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                      ))}</tr>
                    </thead>
                    <tbody>
                      {RECENT_VIOLATIONS.map(v => (
                        <tr key={v.id} style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }} onClick={() => setEvidenceModal(v)}>
                          <td style={{ padding: "9px 12px", color: "var(--muted)", fontFamily: "monospace", fontSize: 10 }}>{v.id}</td>
                          <td style={{ padding: "9px 12px", color: "var(--text)", fontFamily: "monospace" }}>{v.time}</td>
                          <td style={{ padding: "9px 12px", color: "var(--text)", whiteSpace: "nowrap" }}>{v.chowk}</td>
                          <td style={{ padding: "9px 12px" }}><ViolationBadge type={v.type} /></td>
                          <td style={{ padding: "9px 12px", color: "var(--text)" }}>{v.vehicle}</td>
                          <td style={{ padding: "9px 12px", color: "var(--text)", fontFamily: "monospace" }}>{v.plate}</td>
                          <td style={{ padding: "9px 12px", color: "var(--text)" }}>{v.lane}</td>
                          <td style={{ padding: "9px 12px", color: "var(--muted)" }}>{v.direction}</td>
                          <td style={{ padding: "9px 12px", color: "var(--muted)" }}>{v.speed}</td>
                          <td style={{ padding: "9px 12px", color: "var(--muted)" }}>{v.camera}</td>
                          <td style={{ padding: "9px 12px", color: v.confidence > 90 ? "#10b981" : "#f59e0b", fontWeight: 600 }}>{v.confidence}%</td>
                          <td style={{ padding: "9px 12px" }}><ViolationBadge type={v.status} /></td>
                          <td style={{ padding: "9px 12px" }}><button style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--accent)", fontSize: 10, cursor: "pointer" }}>View</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : page === "chowks" ? (
            /* ─── CHOWKS GRID ───────────────────────────────────── */
            <div>
              <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Traffic Chowks — {city?.name}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {chowks.map(c => (
                  <div key={c.id} onClick={() => setSelectedChowk(c)} style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)", cursor: "pointer", transition: "border-color 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <StatusDot status={c.status} />
                        <span style={{ fontWeight: 600, color: "var(--text)", fontSize: 14 }}>{c.name}</span>
                      </div>
                      <SignalIndicator phase={c.signalPhase} />
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                      <div><span style={{ color: "var(--muted)" }}>Vehicles:</span> <span style={{ color: "var(--text)", fontWeight: 600 }}>{c.vehicles.toLocaleString()}</span></div>
                      <div><span style={{ color: "var(--muted)" }}>Violations:</span> <span style={{ color: "#ef4444", fontWeight: 600 }}>{c.violations}</span></div>
                      <div><span style={{ color: "var(--muted)" }}>Cameras:</span> <span style={{ color: "var(--text)" }}>{c.cameras}</span></div>
                      <div><span style={{ color: "var(--muted)" }}>Lanes:</span> <span style={{ color: "var(--text)" }}>{c.lanes}</span></div>
                      <div><span style={{ color: "var(--muted)" }}>PA:</span> <span style={{ color: c.paStatus === "active" ? "#10b981" : "#ef4444" }}>{c.paStatus}</span></div>
                      <div><span style={{ color: "var(--muted)" }}>Sync:</span> <span style={{ color: "var(--text)" }}>{c.lastSync}</span></div>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
                      {c.rpiId} • {c.lat.toFixed(4)}°N, {c.lng.toFixed(4)}°E
                    </div>
                  </div>
                ))}
                <div style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "2px dashed var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 140 }}>
                  <span style={{ color: "var(--accent)", fontSize: 14, fontWeight: 500 }}>+ Add New Chowk</span>
                </div>
              </div>
            </div>
          ) : page === "devices" ? (
            /* ─── DEVICES ───────────────────────────────────────── */
            <div>
              <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Edge Device Fleet</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
                {DEVICE_HEALTH.map(d => (
                  <div key={d.id} style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)", borderLeft: `3px solid ${d.status === "healthy" ? "#10b981" : d.status === "warning" ? "#f59e0b" : "#ef4444"}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <div>
                        <div style={{ fontFamily: "monospace", fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{d.id}</div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>{d.chowk}</div>
                      </div>
                      <StatusDot status={d.status} />
                    </div>
                    {d.status !== "offline" ? (
                      <div>
                        <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                          {[
                            { l: "CPU", v: d.cpu, c: d.cpu > 80 ? "#ef4444" : "#3b82f6" },
                            { l: "Memory", v: d.mem, c: d.mem > 80 ? "#ef4444" : "#10b981" },
                            { l: "Temp", v: d.temp, max: 85, c: d.temp > 65 ? "#ef4444" : "#f59e0b" },
                            { l: "Disk", v: d.disk, c: "#8b5cf6" },
                          ].map(m => (
                            <div key={m.l}>
                              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 3 }}>
                                <span style={{ color: "var(--muted)" }}>{m.l}</span>
                                <span style={{ color: "var(--text)", fontWeight: 600 }}>{m.v}{m.l === "Temp" ? "°C" : "%"}</span>
                              </div>
                              <ProgressBar value={m.v} max={m.max || 100} color={m.c} />
                            </div>
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                          <span>Uptime: {d.uptime}</span>
                          <div style={{ display: "flex", gap: 3 }}>{d.cameras.map(cam => <StatusDot key={cam.id} status={cam.status} />)}</div>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: "#ef4444", fontSize: 13, padding: "10px 0" }}>Device offline — no telemetry</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : page === "evidence" ? (
            /* ─── EVIDENCE ──────────────────────────────────────── */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: 0 }}>Evidence Management</h2>
                <div style={{ display: "flex", gap: 6 }}>
                  {["all", "new", "reviewed", "approved"].map(f => (
                    <button key={f} style={{ padding: "5px 12px", borderRadius: 20, border: "1px solid var(--border)", background: f === "all" ? "var(--accent)" : "var(--card)", color: f === "all" ? "#fff" : "var(--muted)", fontSize: 11, cursor: "pointer", textTransform: "capitalize" }}>{f}</button>
                  ))}
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
                {RECENT_VIOLATIONS.slice(0, 8).map(v => (
                  <div key={v.id} onClick={() => setEvidenceModal(v)} style={{ background: "var(--card)", borderRadius: 10, border: "1px solid var(--border)", overflow: "hidden", cursor: "pointer", transition: "transform 0.2s" }}
                    onMouseOver={e => e.currentTarget.style.transform = "translateY(-2px)"}
                    onMouseOut={e => e.currentTarget.style.transform = "translateY(0)"}>
                    <div style={{ height: 150, background: `linear-gradient(135deg, ${dark ? '#0f1a2e' : '#dbeafe'}, ${dark ? '#0a0e1a' : '#f0f4ff'})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
                      <span style={{ fontSize: 36, opacity: 0.2 }}>📷</span>
                      <div style={{ position: "absolute", top: 8, right: 8 }}><ViolationBadge type={v.status} /></div>
                      <div style={{ position: "absolute", bottom: 8, left: 8, display: "flex", gap: 6 }}>
                        <span style={{ background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#fff" }}>{v.camera}</span>
                        <span style={{ background: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "3px 8px", fontSize: 10, color: "#fff" }}>Lane {v.lane}</span>
                      </div>
                    </div>
                    <div style={{ padding: 14 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <ViolationBadge type={v.type} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: v.confidence > 90 ? "#10b981" : "#f59e0b" }}>{v.confidence}%</span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text)", marginBottom: 3 }}>{v.chowk}</div>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>{v.vehicle} • {v.plate} • {v.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : page === "reports" ? (
            /* ─── REPORTS ───────────────────────────────────────── */
            <div>
              <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Reports & Analytics</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: 16 }}>
                {[
                  { title: "Daily Violation Report", desc: "Today's violations across all chowks", icon: "📋" },
                  { title: "Weekly Summary", desc: "7-day trend analysis", icon: "📊" },
                  { title: "Monthly City Report", desc: "Full month analytics and insights", icon: "📈" },
                  { title: "Vehicle Classification", desc: "Vehicle type distribution report", icon: "🚗" },
                  { title: "Chowk-wise Report", desc: "Per-chowk breakdown and comparison", icon: "🚦" },
                  { title: "Device Health Report", desc: "RPI fleet uptime and diagnostics", icon: "🖥️" },
                  { title: "Camera Uptime Report", desc: "Camera availability across chowks", icon: "📷" },
                  { title: "Incident Report", desc: "Critical incidents and responses", icon: "🚨" },
                  { title: "PA Announcement Log", desc: "Public announcement history", icon: "📢" },
                  { title: "Evidence Report", desc: "Evidence review summary", icon: "🗂️" },
                ].map(r => (
                  <div key={r.title} style={{ background: "var(--card)", borderRadius: 10, padding: 18, border: "1px solid var(--border)", cursor: "pointer" }}
                    onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
                    onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                    <div style={{ fontSize: 28, marginBottom: 8 }}>{r.icon}</div>
                    <div style={{ fontWeight: 600, color: "var(--text)", fontSize: 14, marginBottom: 4 }}>{r.title}</div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>{r.desc}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>PDF</button>
                      <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>Excel</button>
                      <button style={{ padding: "5px 10px", borderRadius: 5, border: "1px solid var(--border)", background: "var(--bg)", color: "var(--muted)", fontSize: 11, cursor: "pointer" }}>CSV</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ─── MAIN DASHBOARD ────────────────────────────────── */
            <div>
              {/* Authority Branding Banner */}
              <AuthorityBanner city={city} dark={dark} />

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2 style={{ color: "var(--text)", fontSize: 20, fontWeight: 700, margin: "0 0 2px" }}>Traffic Intelligence — {city?.name}</h2>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>Live overview • {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                  <span style={{ fontSize: 12, color: "#10b981", fontWeight: 600 }}>LIVE</span>
                </div>
              </div>

              {/* KPI Row */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12, marginBottom: 20 }}>
                <KPICard label="Vehicles Today" value={totalVehicles.toLocaleString()} icon="🚗" sub={`${chowks.length} chowks monitored`} trend={8} />
                <KPICard label="Violations Today" value={totalViolations} icon="⚠️" sub="Across all categories" trend={12} color="#ef4444" />
                <KPICard label="Devices Online" value={`${onlineDevices}/${chowks.length}`} icon="📡" sub={`${chowks.length - onlineDevices} offline`} />
                <KPICard label="Avg Confidence" value="89.6%" icon="🎯" sub="Detection accuracy" color="#10b981" />
                <KPICard label="Challans Ready" value="23" icon="📝" sub="Pending issuance" trend={-5} color="#8b5cf6" />
              </div>

              {/* Charts Row */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Hourly Traffic & Violations</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <AreaChart data={HOURLY_DATA}>
                      <defs>
                        <linearGradient id="vehGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="violGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={0.2} />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "var(--muted)" }} interval={2} />
                      <YAxis yAxisId="left" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      <Area yAxisId="left" type="monotone" dataKey="vehicles" stroke="#3b82f6" fill="url(#vehGrad)" strokeWidth={2} name="Vehicles" />
                      <Area yAxisId="right" type="monotone" dataKey="violations" stroke="#ef4444" fill="url(#violGrad)" strokeWidth={2} name="Violations" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Violations by Type</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={VIOLATION_TYPES.slice(0, 7)} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}>
                        {VIOLATION_TYPES.slice(0, 7).map((v, i) => <Cell key={i} fill={v.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                    {VIOLATION_TYPES.slice(0, 5).map(v => (
                      <span key={v.type} style={{ fontSize: 10, color: "var(--muted)", display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ width: 8, height: 8, borderRadius: 2, background: v.color, display: "inline-block" }} />
                        {v.type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Lane-wise + Chowk Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Lane-wise Traffic & Violations</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={LANE_DATA} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted)" }} />
                      <YAxis dataKey="lane" type="category" tick={{ fontSize: 11, fill: "var(--muted)" }} width={50} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="vehicles" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Vehicles" barSize={10} />
                      <Bar dataKey="violations" fill="#ef4444" radius={[0, 4, 4, 0]} name="Violations" barSize={10} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Chowk Status</h3>
                  <div style={{ display: "grid", gap: 8 }}>
                    {chowks.map(c => (
                      <div key={c.id} onClick={() => setSelectedChowk(c)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: 8, border: "1px solid var(--border)", cursor: "pointer", background: "var(--bg)" }}
                        onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
                        onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <StatusDot status={c.status} />
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{c.name}</div>
                            <div style={{ fontSize: 11, color: "var(--muted)" }}>{c.vehicles.toLocaleString()} vehicles • {c.violations} violations</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <SignalIndicator phase={c.signalPhase} />
                          <span style={{ fontSize: 18, color: "var(--muted)" }}>›</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Weekly Trend + Map */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Weekly Trend</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={WEEKLY_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "var(--muted)" }} />
                      <YAxis tick={{ fontSize: 10, fill: "var(--muted)" }} />
                      <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="violations" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Violations" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <ChowkMapView chowks={chowks} onSelect={setSelectedChowk} dark={dark} />
              </div>

              {/* Vehicle Classification + Recent Violations */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Vehicle Classification</h3>
                  {VEHICLE_CLASSES.map(v => (
                    <div key={v.type} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                        <span style={{ color: "var(--text)" }}>{v.type}</span>
                        <span style={{ color: "var(--muted)" }}>{v.count.toLocaleString()} ({v.pct}%)</span>
                      </div>
                      <ProgressBar value={v.pct} color={PIE_COLORS[VEHICLE_CLASSES.indexOf(v) % PIE_COLORS.length]} />
                    </div>
                  ))}
                </div>

                <div style={{ background: "var(--card)", borderRadius: 10, padding: 20, border: "1px solid var(--border)" }}>
                  <h3 style={{ color: "var(--text)", fontSize: 14, fontWeight: 600, margin: "0 0 14px" }}>Latest Violations Feed</h3>
                  <div style={{ display: "grid", gap: 6 }}>
                    {RECENT_VIOLATIONS.slice(0, 5).map(v => (
                      <div key={v.id} onClick={() => setEvidenceModal(v)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg)", cursor: "pointer" }}
                        onMouseOver={e => e.currentTarget.style.borderColor = "var(--accent)"}
                        onMouseOut={e => e.currentTarget.style.borderColor = "var(--border)"}>
                        <div style={{ width: 40, height: 40, borderRadius: 8, background: dark ? "#1a2332" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>📷</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                            <ViolationBadge type={v.type} />
                            <span style={{ fontSize: 12, color: "var(--text)" }}>{v.chowk}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{v.vehicle} • {v.plate} • {v.time}</div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: v.confidence > 90 ? "#10b981" : "#f59e0b" }}>{v.confidence}%</div>
                          <ViolationBadge type={v.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Evidence Modal */}
      {evidenceModal && <EvidenceModal violation={evidenceModal} onClose={() => setEvidenceModal(null)} dark={dark} />}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        * { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        select option { background: var(--card); color: var(--text); }
      `}</style>
    </div>
  );
}
