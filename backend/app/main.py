import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from app.config import get_settings
from app.routers import generate, render

# Configure logging
logging.basicConfig(
    level=logging.DEBUG,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%H:%M:%S",
)

# Set log levels for different modules
logging.getLogger("app.services.generator").setLevel(logging.DEBUG)
logging.getLogger("app.services.validator").setLevel(logging.DEBUG)
logging.getLogger("app.services.llm").setLevel(logging.INFO)
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)

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
app.include_router(render.router, prefix="/api", tags=["render"])

# Serve soundfonts statically so frontend can load them
soundfonts_dir = Path(__file__).parent.parent / "soundfonts"
if soundfonts_dir.exists():
    app.mount("/soundfonts", StaticFiles(directory=str(soundfonts_dir)), name="soundfonts")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle all unhandled exceptions with a consistent error response."""
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "detail": str(exc) if settings.debug else "An unexpected error occurred",
        },
    )


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": "0.1.0"}
