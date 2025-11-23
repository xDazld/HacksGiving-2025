"""Pytest configuration"""

import pytest


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
