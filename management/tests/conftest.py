"""Pytest configuration"""

import os
import pytest


# Set test environment variables before importing app
os.environ["APPWRITE_PROJECT_ID"] = "test-project"
os.environ["APPWRITE_API_KEY"] = "test-api-key"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-change-in-production-abcdef123456"
os.environ["ADMIN_PASSWORD"] = "test-password"


@pytest.fixture(scope="session")
def playwright_launch_options():
    """Configure Playwright launch options"""
    return {
        "headless": True,
        "slow_mo": 50,  # Slow down by 50ms to make tests more reliable
    }


@pytest.fixture(scope="session")
def playwright_browser_type():
    """Configure which browser to use"""
    return "chromium"
