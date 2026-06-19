from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os, datetime
app = FastAPI(title="ISTSS API", version="1.0.0", description="Intelligent Smart Traffic Signal System - Datamorphosis Technologies")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
@app.get("/")
def root():
    return {"service": "ISTSS Backend API", "version": "1.0.0", "company": "Datamorphosis Technologies Pvt. Ltd.", "status": "running", "timestamp": str(datetime.datetime.now()), "database": "istss-db-dev.postgres.database.azure.com", "tables": 20}
@app.get("/health")
def health():
    return {"status": "healthy", "environment": os.getenv("ENVIRONMENT", "development")}
