from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import get_settings
from app.routers import generate

settings = get_settings()

app = FastAPI(
    title="AI Music Composer API",
    description="Generate MIDI music from natural language prompts",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(generate.router, prefix="/api", tags=["generation"])


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}
