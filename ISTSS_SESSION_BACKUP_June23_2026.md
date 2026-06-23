# ISTSS Platform Session Backup — June 22-23, 2026

## CURRENT LIVE STATE

### Frontend
- **URL**: https://ambitious-river-096774200.7.azurestaticapps.net
- **Status**: LIVE and working (restored from fresh Vite build)
- **GitHub**: App.jsx v3.4 (75,530 bytes) at `frontend/istss-dashboard/src/App.jsx`
- **Cloud Shell project**: `~/istss-fe/` (fresh Vite + React + Recharts)

### Backend  
- **URL**: https://istss-api-dev.azurewebsites.net
- **Status**: LIVE with full-day classification SQL + security headers
- **GitHub**: app.py v5.2.1 (54,438 bytes) at `backend/app.py`
- **Cloud Shell deploy dir**: `~/fix/backend/`

### GitHub Repo
- `github.com/pradeepgilbile/istss-platform`
- PAT: `[REDACTED-PAT]`

---

## WORKING FEATURES

### Backend (app.py)
1. **Heartbeat** — RPi POSTs to `/api/v1/devices/heartbeat` every 5 sec; uses `Request` + `request.json()` (not Pydantic) to capture ALL fields
2. **Auto-insert traffic** — Heartbeat with `vehicle_classification` auto-inserts into `istss_live_traffic`
3. **Heartbeat chowk lookup** — Uses device's registered `chowk_id` from DB (not hardcoded CHK001)
4. **Device live-status** — Push-based from `heartbeat_data` JSONB column (no SSH)
5. **Traffic summary** — Full-day SQL aggregation with DISTINCT ON per minute dedup
6. **Vehicle classification** — Full-day aggregate via SQL (Car:1454, Motorcycle:266, Bus:71, Truck:223, Bicycle:20)
7. **Period support** — `?period=day|week|month` query param on traffic summary
8. **Chowk names** — JOIN with `istss_chowks` table for name + code display
9. **Security headers** — X-Content-Type-Options, X-Frame-Options, HSTS, etc.
10. **Login rate limiting** — Max 5 attempts per IP per 60 seconds
11. **Signal group dedup** — Uses RPi's `total` field, not sum of signal groups
12. **CHK001 migration** — Test data migrated to real chowk via init_db SQL

### Frontend (App.jsx)
1. **Login page** — DM butterfly logo from datamorphosis.in, "Intelligent Smart Traffic Signal System"
2. **Dashboard** — MC Authority panel, KPI cards (8 metrics), role-based sidebar
3. **Live Traffic page** — 6 styled KPI cards (emojis + colored borders), Vehicle Classification pie chart, CO₂ bar chart, Hourly Traffic Trend, per-chowk breakdown, Recent Records table, 30s auto-refresh
4. **DM butterfly logo** — In sidebar + login page (favicon.svg = 20,322 bytes from datamorphosis.in)
5. **Single marquee** — Removed duplicate
6. **Tab title** — "ISTSS — Datamorphosis Technologies"
7. **Header badge** — "Nanded Waghala City Muncipal Corporation" + LIVE indicator
8. **Role-based sidebar** — super_admin sees all, others see restricted set
9. **MC Authority panel** — Shows on all pages (compact on non-dashboard)
10. **Compact spacing** — Reduced padding/margins via CSS overrides
11. **Product name** — "Intelligent Smart Traffic Signal System" everywhere

### Database Tables
- `istss_devices` — heartbeat_data JSONB, chowk_id FK
- `istss_live_traffic` — vehicle_classification JSONB, total_vehicles, estimated_co2_kg, time_saved_seconds, trees_equivalent, net_zero_score, chowk_id, device_id
- `istss_chowks` — name, code column added
- `istss_settings` — mc_authority config (officials, photos, branding)

### RPi Heartbeat Data Fields
```
ip, co2_data, hostname, load_avg, boot_time, device_id, processes,
cpu_percent, net_recv_mb, net_sent_mb, temperature, used_ram_mb,
disk_percent, total_ram_mb, traffic_data, used_disk_gb, signal_health,
total_disk_gb, memory_percent, uptime_seconds, pa_announcements,
network_connected, running_processes, vehicle_classification
```

### RPi Vehicle Classification Format
```json
{"Bus": 2, "Car": 9, "Truck": 0, "total": 21, "Bicycle": 0, "Motorcycle": 10}
```

### RPi CO2 Data Format
```json
{"co2_saved_g": 700.5, "co2_saved_kg": 0.701, "fuel_saved_l": 0.252,
 "net_zero_score": 25, "time_saved_sec": 315, "co2_generated_g": 2802,
 "trees_equivalent": 11.75}
```

---

## PENDING / NEXT SESSION

### 1. Vehicle Count Fix (HIGH PRIORITY)
**Problem**: Vehicle count dedup uses 1-minute window. A signal cycle is ~2-3 minutes with 4 signals (2 groups × 2 signals). Same cycle count gets captured in multiple minutes → double counting.

**Paddy's requirement**: Count vehicles only during green signal time. Each of 4 signals' green-time count should be ADDED (not duplicated). Need to understand signal cycle timing.

**Proposed fix**: Change dedup from `date_trunc('minute')` to signal cycle boundary detection. Need RPi to send `signal_id` or `cycle_number` field, OR use a larger dedup window matching cycle duration.

**Question for Paddy**: How long is one full signal cycle (all 4 signals)? Does the RPi send signal_id or cycle info in heartbeat?

### 2. Mobile/Responsive UI (HIGH PRIORITY)
**Problem**: Not compatible with iPhone/Android browsers.
**Fix**: Add responsive CSS media queries (was attempted in v4.0 but got rolled back with CSP crash). Need to re-apply ONLY the CSS changes, no CSP.

### 3. Official Photo Upload
**Problem**: Abhilash Kumar IPS photo shows in edit but not after save/reload.
**Root cause**: Base64 photo string too large for API JSONB storage. Photo resize reduced to 64×64 JPEG q0.5 in v3.4 but needs re-upload.

### 4. Chowk Code "NDD-EDG-001"
**Status**: Backend has `code` column. Need to set via Chowks → Edit or direct SQL.

### 5. Security Compliance
**Done**: Security headers, rate limiting, parameterized SQL, JWT auth
**Pending**: CORS restriction (attempted but broke frontend — needs testing), CSP (attempted via meta tag but crashed React)
**Note**: CSP meta tag CRASHED React rendering → blank page → CDN cached broken JS → major outage. DO NOT use CSP meta tag approach again. Use server-side headers instead.

### 6. Browser Tab Favicon
**Status**: DM butterfly SVG deployed as favicon.svg. Browser may cache old Vite bolt. Hard refresh (Ctrl+Shift+R) shows correct favicon.

---

## KEY DEPLOYMENT COMMANDS

### Backend Deploy
```bash
cd ~/fix/backend
curl -sL 'https://raw.githubusercontent.com/pradeepgilbile/istss-platform/main/backend/app.py' -o app.py
az webapp up --name istss-api-dev --resource-group rg-istss-dev --runtime PYTHON:3.11
```

### Frontend Deploy
```bash
cd ~/istss-fe
curl -sL 'https://raw.githubusercontent.com/pradeepgilbile/istss-platform/main/frontend/istss-dashboard/src/App.jsx' -o src/App.jsx
npm run build
TOKEN=$(az staticwebapp secrets list --name istss-dashboard-dev --resource-group rg-istss-dev --query 'properties.apiKey' -o tsv)
npx @azure/static-web-apps-cli deploy ./dist --deployment-token $TOKEN --env production
```

### Fresh Vite Setup (if project dir deleted)
```bash
cd ~ && npx create-vite@latest istss-fe --template react <<< ''
cd istss-fe && npm install && npm install recharts
# Then download App.jsx, index.css, favicon.svg from GitHub
```

---

## CRITICAL LESSONS LEARNED

1. **CSP meta tag CRASHES React** — Never inject CSP via JavaScript `document.createElement("meta")`. It blocks React's module scripts. Use server-side CSP headers instead.

2. **CORS restriction breaks frontend** — Changing from `allow_origins=["*"]` to specific origins broke API calls. Need to test thoroughly before restricting.

3. **SWA CDN caches aggressively** — Same JS filename hash = CDN serves cached version. To bust cache: create fresh Vite project (different node_modules = different hash).

4. **SecurityHeadersMiddleware via BaseHTTPMiddleware** — Added but may cause issues with streaming responses. Currently deployed.

5. **Cloud Shell is ephemeral** — Project dirs deleted on timeout. Always push to GitHub before ending session.

6. **Preserve existing functionality** — Always backup before changes. Test API directly before deploying frontend changes.

---

## BACKUP FILES IN SANDBOX
- `app_backup_v515.py` — Backend before security/classification changes (53,797 bytes)
- `App_backup_v34.jsx` — Frontend last working version (75,530 bytes)

## AZURE RESOURCES
- App Service: `istss-api-dev` (Python 3.11, BASIC SKU)
- Static Web App: `istss-dashboard-dev`
- Resource Group: `rg-istss-dev` (Central India)
- Container Registry: `istssacr` (for future Docker deployment)
- Tailscale auth key: `[REDACTED-TAILSCALE-KEY]` (expires Sep 18 2026)

## RPi DEVICE
- Device ID: NandedMEdge001
- Hostname: dmrpiserver
- Tailscale IP: 100.114.74.106
- SSH: pi / [REDACTED]
- Registered chowk: 0987ad52 (Mutha Chowk)
