# Milwaukee Domes API - Quick Start Guide

This is a 5-minute quick start to get your API running locally.

## Prerequisites

- Python 3.11+ installed
- Internet connection

## Steps

### 1. Install uv (Package Manager)

```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 2. Install Dependencies

```bash
cd management
uv sync
```

### 3. Set Up Appwrite (Free - 2 minutes)

1. Go to [cloud.appwrite.io](https://cloud.appwrite.io)
2. Sign up (free)
3. Create a new project
4. Get your Project ID and API Key from Settings
5. Create a database named "milwaukee-domes"

### 4. Configure Environment

```bash
cp .env.example .env
# Edit .env and add your Appwrite credentials
```

### 5. Run the Server

```bash
uv run uvicorn main:app --reload
```

### 6. Access Your API

- **Admin Dashboard**: http://localhost:8000/admin
- **API Docs**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

## Next Steps

1. **Load Sample Data** (optional):
   ```bash
   uv run python scripts/init_db.py
   ```

2. **Run Tests**:
   ```bash
   uv run pytest
   ```

3. **Deploy** - See main README for deployment options

## Need Help?

- Check the full [README.md](README.md)
- Visit [http://localhost:8000/docs](http://localhost:8000/docs) for API documentation
- Review the Appwrite docs at [appwrite.io/docs](https://appwrite.io/docs)

## Common Issues

**"Field required" error when starting:**
- Make sure your `.env` file is configured with all required fields

**"Connection refused" to Appwrite:**
- Check your internet connection
- Verify your Appwrite endpoint and credentials

**Tests failing:**
- Tests use mock data and don't require Appwrite to be configured
- If tests fail, check that dependencies are installed: `uv sync`

---

That's it! You now have a fully functional API for the Milwaukee Domes app. 🌿
