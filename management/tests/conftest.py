"""Test configuration and fixtures.

Adds an autouse session-scoped fixture that starts the FastAPI app
with Uvicorn on port 8000 so Playwright can connect during e2e tests.
"""

from __future__ import annotations

import multiprocessing
import socket
import time
from typing import Generator

import pytest
import uvicorn

from main import app  # FastAPI application instance


def _run_server() -> None:
    """Run the Uvicorn server.

    Uses host 127.0.0.1 and port 8000 to match the existing base_url fixture.
    Log level kept minimal to reduce test noise.
    """
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="warning")


def _wait_for_port(host: str, port: int, timeout: float = 10.0) -> None:
    """Block until the TCP port is accepting connections or timeout.

    Args:
        host: Host interface.
        port: Port number.
        timeout: Maximum seconds to wait.
    """
    deadline = time.time() + timeout
    while time.time() < deadline:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(0.25)
            try:
                if sock.connect_ex((host, port)) == 0:
                    return
            except OSError:
                pass
        time.sleep(0.1)
    raise RuntimeError(f"Server on {host}:{port} did not start within {timeout}s")


@pytest.fixture(scope="session", autouse=True)
def start_server() -> Generator[None, None, None]:
    """Start the FastAPI server in a separate process for e2e tests.

    Autouse so that Playwright tests can assume the server is available.
    """
    process = multiprocessing.Process(target=_run_server, daemon=True)
    process.start()
    try:
        _wait_for_port("127.0.0.1", 8000, timeout=15.0)
    except Exception:
        process.terminate()
        process.join(timeout=5)
        raise
    yield
    process.terminate()
    process.join(timeout=5)


"""Pytest configuration"""

import os
import pytest

# Set test environment variables BEFORE any imports
# This must happen before main.py is imported
os.environ["APPWRITE_PROJECT_ID"] = "test-project"
os.environ["APPWRITE_API_KEY"] = "test-api-key"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-change-in-production-abcdef123456"
os.environ["ADMIN_PASSWORD"] = "test-password"


@pytest.fixture(scope="session")
def event_loop_policy():
    """Use the default event loop policy for all tests"""
    import asyncio

    return asyncio.DefaultEventLoopPolicy()


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
