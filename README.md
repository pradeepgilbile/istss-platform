# ISTSS - Intelligent Smart Traffic Signal System
**Datamorphosis Technologies Pvt. Ltd.**

## Architecture
- **Backend**: FastAPI (Python 3.11) on Azure App Service
- **Frontend**: React + Vite + Recharts on Azure Static Web App
- **Database**: PostgreSQL 15 (Azure Flexible Server) - 26 tables
- **Storage**: Azure Blob Storage for violation evidence
- **Edge**: Raspberry Pi agents at traffic chowks

## Azure URLs
- API: https://istss-api-dev.azurewebsites.net
- Dashboard: https://ambitious-river-096774200.7.azurestaticapps.net
- Swagger: https://istss-api-dev.azurewebsites.net/docs

## Structure
```
backend/         # FastAPI backend API
frontend/        # React dashboard (Vite)
database/        # PostgreSQL schema
agent/           # RPI edge agent
docker/          # Docker Compose setup
```
