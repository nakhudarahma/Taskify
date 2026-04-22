from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.v1 import auth, tasks, voice, analytics, settings as user_settings
from database.postgres import Base, engine
from models import user, task # Import models to register them with Base

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Robust CORS Configuration
origins = [
    "http://localhost:5173",
    "http://localhost:8080",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8080",
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

# Add production frontend URL and common variants
if settings.FRONTEND_URL:
    clean_url = settings.FRONTEND_URL.strip().rstrip('/')
    origins.append(clean_url)
    origins.append(f"{clean_url}/")

print(f"🚀 Starting {settings.PROJECT_NAME}")
print(f"🔒 Allowed CORS Origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://(taskify|rn-taskify).*?\.vercel\.app", # Matches taskify.vercel.app, rn-taskify.vercel.app, and their preview links
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Router Registration
# Router Registration
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix="/api/v1/tasks", tags=["Tasks"])
app.include_router(voice.router, prefix="/api/v1/voice", tags=["Voice System"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["Analytics"])
app.include_router(user_settings.router, prefix="/api/v1/settings", tags=["Settings"])

@app.get("/health")
def health_check():
    return {"status": "ok"}