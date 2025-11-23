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
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Milwaukee Domes Management Interface - Empowering staff and volunteers to create exceptional visitor experiences">
        <title>{settings.app_name}</title>
        <style>
            :root {{
                --primary-green: #2c5f2d;
                --accent-green: #4a7c4e;
                --light-green: #e8f5e9;
                --text-dark: #1a1a1a;
                --text-light: #666;
                --border-radius: 8px;
                --shadow: 0 2px 8px rgba(0,0,0,0.1);
            }}
            
            * {{
                box-sizing: border-box;
                margin: 0;
                padding: 0;
            }}
            
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: var(--text-dark);
                background: linear-gradient(135deg, #e8f5e9 0%, #f1f8e9 100%);
                min-height: 100vh;
                padding: 20px;
            }}
            
            .container {{
                max-width: 1000px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: var(--border-radius);
                box-shadow: var(--shadow);
            }}
            
            header {{
                text-align: center;
                margin-bottom: 40px;
                padding-bottom: 30px;
                border-bottom: 3px solid var(--light-green);
            }}
            
            h1 {{
                color: var(--primary-green);
                font-size: 2.5em;
                margin-bottom: 10px;
                font-weight: 700;
            }}
            
            .tagline {{
                color: var(--text-light);
                font-size: 1.2em;
                margin-bottom: 20px;
            }}
            
            .hero-text {{
                background: var(--light-green);
                padding: 20px;
                border-radius: var(--border-radius);
                margin: 20px 0;
                border-left: 4px solid var(--primary-green);
            }}
            
            .main-links {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }}
            
            .link-card {{
                display: block;
                padding: 25px;
                background: var(--accent-green);
                color: white;
                text-decoration: none;
                border-radius: var(--border-radius);
                transition: all 0.3s ease;
                box-shadow: var(--shadow);
                border: 2px solid transparent;
            }}
            
            .link-card:hover {{
                background: var(--primary-green);
                transform: translateY(-3px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                border-color: var(--primary-green);
            }}
            
            .link-card:focus {{
                outline: 3px solid #4CAF50;
                outline-offset: 2px;
            }}
            
            .link-card-icon {{
                font-size: 2em;
                display: block;
                margin-bottom: 10px;
            }}
            
            .link-card-title {{
                font-size: 1.3em;
                font-weight: 600;
                margin-bottom: 8px;
            }}
            
            .link-card-desc {{
                font-size: 0.95em;
                opacity: 0.9;
                line-height: 1.4;
            }}
            
            .features {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }}
            
            .feature {{
                padding: 20px;
                background: #f9f9f9;
                border-radius: var(--border-radius);
                border-left: 4px solid var(--accent-green);
            }}
            
            .feature h3 {{
                color: var(--primary-green);
                margin-bottom: 10px;
                font-size: 1.1em;
            }}
            
            .quick-links {{
                background: var(--light-green);
                padding: 25px;
                border-radius: var(--border-radius);
                margin: 30px 0;
            }}
            
            .quick-links h2 {{
                color: var(--primary-green);
                margin-bottom: 15px;
            }}
            
            .quick-links ul {{
                list-style: none;
                padding: 0;
            }}
            
            .quick-links li {{
                padding: 10px 0;
                border-bottom: 1px solid #ddd;
            }}
            
            .quick-links li:last-child {{
                border-bottom: none;
            }}
            
            .quick-links a {{
                color: var(--accent-green);
                text-decoration: none;
                font-weight: 500;
                display: flex;
                align-items: center;
                transition: color 0.3s;
            }}
            
            .quick-links a:hover {{
                color: var(--primary-green);
                text-decoration: underline;
            }}
            
            .quick-links a::before {{
                content: "→";
                margin-right: 10px;
                font-weight: bold;
            }}
            
            footer {{
                text-align: center;
                margin-top: 50px;
                padding-top: 30px;
                border-top: 2px solid var(--light-green);
                color: var(--text-light);
                font-size: 0.9em;
            }}
            
            .badge {{
                display: inline-block;
                background: var(--primary-green);
                color: white;
                padding: 5px 12px;
                border-radius: 20px;
                font-size: 0.85em;
                margin: 5px;
            }}
            
            @media (max-width: 768px) {{
                .container {{
                    padding: 20px;
                }}
                
                h1 {{
                    font-size: 2em;
                }}
                
                .main-links {{
                    grid-template-columns: 1fr;
                }}
            }}
            
            /* Accessibility improvements */
            .sr-only {{
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0,0,0,0);
                border: 0;
            }}
            
            /* Focus visible for keyboard navigation */
            *:focus-visible {{
                outline: 3px solid #4CAF50;
                outline-offset: 2px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <header role="banner">
                <h1>🌿 {settings.app_name}</h1>
                <p class="tagline">Empowering Milwaukee Domes Alliance staff and volunteers to create exceptional visitor experiences</p>
                <div class="hero-text">
                    <strong>Mission:</strong> Combining botanical excellence with innovative technology to deliver personalized, accessible, and engaging educational experiences for all visitors.
                </div>
                <div>
                    <span class="badge">🌱 Zero Maintenance Cost</span>
                    <span class="badge">♿ Fully Accessible</span>
                    <span class="badge">🌍 Multilingual Ready</span>
                    <span class="badge">🤖 AI-Powered</span>
                </div>
            </header>
            
            <main role="main">
                <section aria-labelledby="main-links-heading">
                    <h2 id="main-links-heading" class="sr-only">Main Navigation</h2>
                    <div class="main-links">
                        <a href="/admin" class="link-card" role="button" aria-label="Access Admin Dashboard">
                            <span class="link-card-icon" aria-hidden="true">📊</span>
                            <div class="link-card-title">Admin Dashboard</div>
                            <div class="link-card-desc">Manage context files, plant inventory, and view system analytics</div>
                        </a>
                        <a href="/docs" class="link-card" role="button" aria-label="View API Documentation">
                            <span class="link-card-icon" aria-hidden="true">📖</span>
                            <div class="link-card-title">API Documentation</div>
                            <div class="link-card-desc">Interactive Swagger UI for developers and technical integration</div>
                        </a>
                        <a href="/redoc" class="link-card" role="button" aria-label="View ReDoc Documentation">
                            <span class="link-card-icon" aria-hidden="true">📘</span>
                            <div class="link-card-title">ReDoc Reference</div>
                            <div class="link-card-desc">Comprehensive API reference documentation</div>
                        </a>
                        <a href="/health" class="link-card" role="button" aria-label="Check System Health">
                            <span class="link-card-icon" aria-hidden="true">❤️</span>
                            <div class="link-card-title">System Health</div>
                            <div class="link-card-desc">Monitor system status and connectivity</div>
                        </a>
                    </div>
                </section>
                
                <section aria-labelledby="features-heading">
                    <h2 id="features-heading" style="color: var(--primary-green); margin-bottom: 20px;">✨ Key Features</h2>
                    <div class="features">
                        <div class="feature">
                            <h3>🧠 AI-Powered Content</h3>
                            <p>Context files enable intelligent, personalized tours that adapt to visitor interests, language preferences, and accessibility needs.</p>
                        </div>
                        <div class="feature">
                            <h3>🌿 Living Collection Database</h3>
                            <p>Comprehensive plant inventory tracking across all three domes with care requirements, conservation status, and educational metadata.</p>
                        </div>
                        <div class="feature">
                            <h3>♿ Universal Design</h3>
                            <p>Built with accessibility as a priority - keyboard navigation, screen reader support, and WCAG 2.1 AA compliance throughout.</p>
                        </div>
                        <div class="feature">
                            <h3>📱 Mobile-First</h3>
                            <p>Responsive interface works seamlessly on tablets and phones, enabling on-site management by staff and volunteers.</p>
                        </div>
                        <div class="feature">
                            <h3>🔒 Secure & Scalable</h3>
                            <p>Cloud-based infrastructure with JWT authentication, automatic backups, and zero server maintenance costs.</p>
                        </div>
                        <div class="feature">
                            <h3>📈 Data-Driven Insights</h3>
                            <p>Real-time analytics help understand visitor engagement and optimize educational programming.</p>
                        </div>
                    </div>
                </section>
                
                <section class="quick-links" aria-labelledby="quick-links-heading">
                    <h2 id="quick-links-heading">🚀 Quick Start Guide</h2>
                    <ul>
                        <li><a href="/admin/context-files">Upload Educational Content Files</a></li>
                        <li><a href="/admin/plants">Add Plants to Inventory</a></li>
                        <li><a href="/admin">View Dashboard Analytics</a></li>
                        <li><a href="/docs#/plants/get_plants_api_v1_plants_get">Explore Plant API Endpoints</a></li>
                        <li><a href="/docs#/progress/validate_ticket_api_v1_progress_validate_ticket_post">Test Ticket Validation</a></li>
                    </ul>
                </section>
                
                <section style="background: #fff3cd; padding: 20px; border-radius: var(--border-radius); border-left: 4px solid #ffc107; margin: 30px 0;">
                    <h3 style="color: #856404; margin-bottom: 10px;">💡 For Non-Technical Staff</h3>
                    <p style="color: #856404;">This system is designed to be easy to use - no coding required! Start with the <strong>Admin Dashboard</strong> to manage content and plants. Detailed help text and guidance is provided throughout. Contact IT support if you need assistance.</p>
                </section>
                
                <section style="background: #d1ecf1; padding: 20px; border-radius: var(--border-radius); border-left: 4px solid #17a2b8; margin: 30px 0;">
                    <h3 style="color: #0c5460; margin-bottom: 10px;">🏆 HacksGiving 2025 Innovation</h3>
                    <p style="color: #0c5460;">This solution addresses <strong>internal operations</strong> and <strong>visitor engagement</strong> challenges simultaneously. By empowering staff with intuitive tools, we enable personalized, accessible experiences that deepen visitor connections to nature.</p>
                    <ul style="margin-top: 10px; padding-left: 20px; color: #0c5460;">
                        <li><strong>Cost-Effective:</strong> Free cloud hosting with Appwrite</li>
                        <li><strong>Low Integration:</strong> No dedicated data science team needed</li>
                        <li><strong>Accessible:</strong> Supports all staff regardless of tech familiarity</li>
                        <li><strong>Scalable:</strong> Grows with changing audiences and content</li>
                        <li><strong>Educational:</strong> Powers multilingual, personalized learning</li>
                    </ul>
                </section>
            </main>
            
            <footer role="contentinfo">
                <p><strong>Version {settings.app_version}</strong></p>
                <p>Powered by FastAPI, FastUI & Appwrite</p>
                <p>Built with ❤️ for Milwaukee Domes Alliance</p>
                <p style="margin-top: 15px;">
                    <em>Creating inclusive, educational experiences through human-centered design and AI innovation</em>
                </p>
            </footer>
        </div>
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
