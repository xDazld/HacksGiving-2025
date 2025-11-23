"""Milwaukee Domes Management Interface and API"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse

from app.config import get_settings
from app.routers import auth, cafe_tours, plants, progress
from app.startup import initialize_database

# Import admin UI router
from app.admin import router as admin_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    print(f"Starting {settings.app_name} v{settings.app_version}")

    # Initialize database and collections automatically
    success = initialize_database(settings)
    if not success:
        print("⚠️  Database initialization encountered issues, but continuing...")
        print("    The application will still start with graceful error handling.")

    yield
    # Shutdown
    print("Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="Management interface and API for Milwaukee Domes mobile application",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(cafe_tours.router, prefix=settings.api_prefix)
app.include_router(plants.router, prefix=settings.api_prefix)
app.include_router(progress.router, prefix=settings.api_prefix)

# Include admin UI router at root (it defines its own /admin and /api paths)
app.include_router(admin_router)


@app.get("/", response_class=HTMLResponse)
async def root():
    """Root endpoint with links to docs and admin"""
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>{settings.app_name}</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                max-width: 800px;
                margin: 50px auto;
                padding: 20px;
                line-height: 1.6;
            }}
            h1 {{ color: #2c5f2d; }}
            .links {{ margin: 30px 0; }}
            .link-box {{
                display: inline-block;
                padding: 15px 25px;
                margin: 10px;
                background: #4a7c4e;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                transition: background 0.3s;
            }}
            .link-box:hover {{ background: #2c5f2d; }}
        </style>
    </head>
    <body>
        <h1>🌿 {settings.app_name}</h1>
        <p>Welcome to the Milwaukee Domes Management Interface and API.</p>
        
        <div class="links">
            <a href="/admin" class="link-box">📊 Admin Dashboard</a>
            <a href="/docs" class="link-box">📖 API Documentation</a>
            <a href="/redoc" class="link-box">📘 ReDoc</a>
        </div>
        
        <h2>Quick Links</h2>
        <ul>
            <li><a href="/admin/context-files">Manage Context Files</a></li>
            <li><a href="/admin/plants">Manage Plants</a></li>
            <li><a href="/api/v1/cafe-tours">View Cafe Tours API</a></li>
        </ul>
        
        <p style="color: #666; margin-top: 50px; font-size: 0.9em;">
            Version {settings.app_version} | Powered by FastAPI & FastUI
        </p>
    </body>
    </html>
    """


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
    }
