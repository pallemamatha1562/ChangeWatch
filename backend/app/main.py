from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import settings
from app.routes.websites import router as website_router
from app.monitoring.scheduler import start_scheduler, scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Start automatic monitoring
    start_scheduler()

    yield

    # Stop scheduler when the server shuts down
    if scheduler.running:
        scheduler.shutdown()


app = FastAPI(
    title=settings.app_name,
    description="AI-powered website change monitoring platform",
    version="1.0.0",
    lifespan=lifespan
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "project": "ChangeWatch",
        "message": "Website Change Monitoring API",
        "status": "Running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


app.include_router(website_router)