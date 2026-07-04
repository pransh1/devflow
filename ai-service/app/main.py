from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .core.database import init_db
from .routers import health, embeddings, chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 DevFlow AI service starting...")
    init_db()
    print("✅ Database ready")
    yield
    # Shutdown
    print("👋 DevFlow AI service shutting down...")

app = FastAPI(
    title="DevFlow AI Service",
    description="AI microservice for DevFlow — embeddings, RAG, and LLM features",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5454", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(embeddings.router, prefix="/api/v1")
app.include_router(chat.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"service": "devflow-ai", "status": "running"}