import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import init_db, SessionLocal
from app.template_engine.starter_templates import seed_starter_templates
from app.api import templates, assets, importers, generator, verification

STORAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "storage")
UPLOADS_DIR = os.path.join(STORAGE_DIR, "uploads")
BATCHES_DIR = os.path.join(STORAGE_DIR, "batches")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(BATCHES_DIR, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables
    init_db()
    # Seed starter templates
    db = SessionLocal()
    try:
        seed_starter_templates(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title="Certificate Studio API",
    version="1.0.0",
    description="Production-grade Certificate Design, Personalization, Batch Generation, and Verification Engine",
    lifespan=lifespan
)

# Enable CORS for frontend Next.js dev & prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static asset folders
app.mount("/storage/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/storage/batches", StaticFiles(directory=BATCHES_DIR), name="batches")

# Include API routers
app.include_router(templates.router)
app.include_router(assets.router)
app.include_router(importers.router)
app.include_router(generator.router)
app.include_router(verification.router)

@app.get("/")
def root():
    return {
        "app": "Certificate Studio API",
        "status": "online",
        "version": "1.0.0",
        "docs_url": "/docs"
    }

@app.get("/api/health")
def health():
    return {"status": "healthy"}
