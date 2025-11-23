# Milwaukee Domes Management Interface & API

A comprehensive backend and management interface for the Milwaukee Domes mobile application, built with FastAPI, Appwrite, and FastUI.

## 🌟 Features

- **RESTful API** for mobile app integration
   - Context file uploads for LLM-generated tours and content
  - Cafe tours with recipes
  - Plant database management
  - Real-time progress tracking via BLE beacons
  - Ticket barcode validation

- **Admin Dashboard** (FastUI-based)
   - Manage uploaded context files and plants
  - View analytics and visitor statistics
  - Easy-to-use web interface (no frontend coding needed!)

- **Appwrite Integration**
  - Cloud-based database (no server management)
  - Built-in authentication
  - File storage for images and audio
  - Real-time updates

## 🚀 Quick Start

### Prerequisites

- Python 3.11 or higher
- [uv](https://github.com/astral-sh/uv) (Python package manager)
- An [Appwrite](https://cloud.appwrite.io) account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   cd management
   ```

2. **Install uv (if not already installed)**
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

3. **Install dependencies**
   ```bash
   uv sync
   ```

4. **Set up Appwrite**
   
   a. Create a free account at [cloud.appwrite.io](https://cloud.appwrite.io)
   
   b. Create a new project
   
   c. Create a database named "milwaukee-domes"
   
   d. Create the following collections with these attributes:


   **context-files** bucket (Storage):
   - Used to store text or multimedia files that will be used as input for LLM generation
   - Files uploaded via the admin dashboard or API are listed under `/admin/context-files`

   **cafe-tours** collection:
   - `title` (string, required)
   - `description` (string, required)
   - `parts` (string array, required) - Store as JSON
   - `created_at` (datetime)
   - `updated_at` (datetime)

   **plants** collection:
   - `common_name` (string, required)
   - `scientific_name` (string, required)
   - `quantity` (integer, required)
   - `buy_new_wont_survive` (boolean)
   - `buy_new_readily_available` (boolean)
   - `move_by_staff` (boolean)
   - `move_requires_consult` (boolean)
   - `notes` (string)
   - `dome_location` (string)
   - `image_url` (string)
   - `created_at` (datetime)
   - `updated_at` (datetime)

   **tickets** collection:
   - `barcode` (string, required, unique)
   - `ticket_type` (string)
   - `visitor_name` (string)
   - `expiry_date` (datetime)
   - `created_at` (datetime)

   e. Get your API credentials from Settings → API Keys

5. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your Appwrite credentials
   ```

   **Required settings:**
   - `APPWRITE_PROJECT_ID` - From Appwrite console
   - `APPWRITE_API_KEY` - From Appwrite console
   - `SECRET_KEY` - Generate with: `openssl rand -hex 32`
   - `ADMIN_PASSWORD` - Set a secure password

### Running the Application

1. **Start the development server**
   ```bash
   uv run uvicorn main:app --reload
   ```

2. **Access the application**
   - Admin Dashboard: http://localhost:8000/admin
   - API Documentation: http://localhost:8000/docs
   - API Base URL: http://localhost:8000/api/v1

## 🧪 Testing

### Run Unit Tests
```bash
uv run pytest tests/test_api.py -v
```

### Run E2E Tests with Playwright
```bash
# Install Playwright browsers (first time only)
uv run playwright install

# Run E2E tests
uv run pytest tests/test_e2e.py --headed
```

### Run All Tests with Coverage
```bash
uv run pytest --cov=app --cov-report=html
```

## 📦 Deployment

### Option 1: Deploy to Railway (Recommended - Easiest)

1. **Fork this repository**

2. **Create a Railway account** at [railway.app](https://railway.app)

3. **Create a new project from GitHub**
   - Connect your forked repository
   - Railway will auto-detect the Python app

4. **Add environment variables**
   - Go to Variables tab
   - Add all variables from `.env.example`
   - Railway provides a public URL automatically

5. **Deploy**
   - Railway auto-deploys on every push
   - Your API will be live at `https://your-app.railway.app`

### Option 2: Deploy to Fly.io

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml`**
   ```toml
   app = "milwaukee-domes-api"
   
   [build]
   builder = "paketobuildpacks/builder:base"
   
   [env]
   PORT = "8000"
   
   [[services]]
   http_checks = []
   internal_port = 8000
   processes = ["app"]
   protocol = "tcp"
   
   [services.concurrency]
   hard_limit = 25
   soft_limit = 20
   type = "connections"
   
   [[services.ports]]
   force_https = true
   handlers = ["http"]
   port = 80
   
   [[services.ports]]
   handlers = ["tls", "http"]
   port = 443
   ```

3. **Deploy**
   ```bash
   fly launch
   fly secrets set APPWRITE_PROJECT_ID=xxx APPWRITE_API_KEY=xxx SECRET_KEY=xxx ADMIN_PASSWORD=xxx
   fly deploy
   ```

### Option 3: Deploy to Render

1. **Create account** at [render.com](https://render.com)

2. **Create new Web Service**
   - Connect your GitHub repository
   - Build Command: `uv sync`
   - Start Command: `uv run uvicorn main:app --host 0.0.0.0 --port $PORT`

3. **Add environment variables** from `.env.example`

4. **Deploy** - Render handles the rest!

### Option 4: Deploy with Docker

```dockerfile
# Dockerfile (create this file)
FROM python:3.11-slim

WORKDIR /app

# Install uv
RUN pip install uv

# Copy project files
COPY pyproject.toml uv.lock ./
COPY app ./app
COPY main.py ./

# Install dependencies
RUN uv sync --no-dev

# Expose port
EXPOSE 8000

# Run the app
CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
# Build and run
docker build -t milwaukee-domes-api .
docker run -p 8000:8000 --env-file .env milwaukee-domes-api
```

## 📖 API Documentation

Once running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key Endpoints

#### Context Files
- `GET /api/admin/context-files` - Admin page listing context files
- `POST /api/admin/context-files/upload` - Upload a context file (multipart/form-data with field `file`)
- `GET /api/admin/context-files/{file_id}/delete` - Delete a context file

#### Plants
- `GET /api/v1/plants` - List all plants
- `POST /api/v1/plants` - Add plant (requires auth)

#### Progress Tracking
- `POST /api/v1/progress/calculate` - Calculate progress from beacon data
- `POST /api/v1/progress/validate-ticket` - Validate ticket barcode

#### Authentication
- `POST /api/v1/auth/login` - Get access token

## 🔐 Authentication

Protected endpoints require JWT authentication:

```bash
# Get token
curl -X POST http://localhost:8000/api/v1/auth/login-json \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# Use token (example: create a cafe tour)
curl -X POST http://localhost:8000/api/v1/cafe-tours \
   -H "Authorization: Bearer YOUR_TOKEN" \
   -H "Content-Type: application/json" \
   -d '{"title":"Morning Cafe Menu Tour","description":"A guided tour of cafe menu items","parts":[]}'
```

## 🏗️ Project Structure

```
management/
├── app/
│   ├── __init__.py
│   ├── admin.py              # FastUI admin interface
│   ├── auth.py               # Authentication utilities
│   ├── config.py             # Configuration management
│   ├── models.py             # Pydantic models
│   ├── routers/              # API route handlers
│   │   ├── auth.py
│   │   ├── cafe_tours.py
│   │   ├── cafe_tours.py
│   │   ├── plants.py
│   │   └── progress.py
│   └── services/             # Business logic
│       └── appwrite_service.py
├── tests/
│   ├── test_api.py           # Unit tests
│   ├── test_e2e.py           # Playwright E2E tests
│   └── conftest.py           # Test configuration
├── main.py                   # FastAPI application
├── pyproject.toml            # Dependencies (managed by uv)
├── .env.example              # Environment template
└── README.md                 # This file
```

##  Integration with Mobile App

Update the mobile app's API base URL:

```typescript
// Thunderdomes/services/api.ts
const API_BASE_URL = 'https://your-deployed-api.com/api/v1';
```

## 💡 Tips for Sponsors

1. **Cost**: Free to deploy!
   - Appwrite: Free tier (75k requests/month)
   - Railway/Render: Free tier available
   - No database hosting costs

2. **Maintenance**: Minimal
   - No server management (serverless)
   - Appwrite handles scaling
   - Auto-deploys from GitHub

3. **Security**: 
   - JWT authentication included
   - HTTPS enforced on production
   - Environment variables for secrets

4. **Scalability**:
   - Appwrite scales automatically
   - FastAPI is async and fast
   - Easy to add rate limiting if needed

## 🛠️ Development

```bash
# Install dev dependencies
uv sync

# Format code
uv run black .

# Lint code
uv run ruff check .

# Run tests
uv run pytest

# Start with auto-reload
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 📝 License

This project is part of the HacksGiving 2025 hackathon for the Milwaukee Domes.

## 🆘 Support

For questions or issues:
- Check the [API Documentation](http://localhost:8000/docs)
- Review the [Appwrite Documentation](https://appwrite.io/docs)
- Contact the development team

---

Built with ❤️ for Milwaukee Domes | Powered by FastAPI, Appwrite & FastUI