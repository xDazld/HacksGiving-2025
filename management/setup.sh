#!/bin/bash

# Milwaukee Domes Management API - Development Setup Script

echo "🌿 Milwaukee Domes Management API Setup"
echo "========================================"

# Check if uv is installed
if ! command -v uv &> /dev/null; then
    echo "📦 Installing uv..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.local/bin:$PATH"
fi

# Install dependencies
echo "📚 Installing dependencies..."
uv sync

# Check for .env file
if [ ! -f .env ]; then
    echo "⚙️  Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Appwrite credentials before continuing"
    echo "   You can get these from: https://cloud.appwrite.io/console"
    exit 1
fi

# Install Playwright browsers
echo "🎭 Installing Playwright browsers for testing..."
uv run playwright install chromium

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env with your Appwrite credentials"
echo "2. Run: uv run python scripts/init_db.py (to load sample data)"
echo "3. Run: uv run uvicorn main:app --reload (to start the server)"
echo "4. Visit: http://localhost:8000"
echo ""
echo "Happy coding! 🚀"
