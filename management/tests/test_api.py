"""Unit tests for API endpoints"""

import pytest
from fastapi.testclient import TestClient
from main import app


@pytest.fixture
def test_tour_data():
    """Sample tour data for testing"""
    return {
        "title": "Test Tropical Tour",
        "description": "A test tour of the tropical dome",
        "parts": [
            {"id": "part1", "title": "Introduction", "content": "Welcome!", "unlock_progress": 0},
            {"id": "part2", "title": "Palm Trees", "content": "See the palms", "unlock_progress": 50},
        ],
    }


@pytest.fixture
def test_scavenger_hunt_data():
    """Sample scavenger hunt data for testing"""
    return {
        "title": "Test Plant Hunt",
        "description": "Find these test plants",
        "difficulty": "easy",
        "items": [
            {"id": "1", "name": "Monstera", "description": "Find the monstera"},
            {"id": "2", "name": "Fern", "description": "Find the fern"},
        ],
    }


@pytest.fixture
def test_plant_data():
    """Sample plant data for testing"""
    return {
        "common_name": "Test Fern",
        "scientific_name": "Testus fernius",
        "quantity": 5,
        "buy_new_readily_available": True,
        "move_by_staff": True,
        "notes": "This is a test plant",
    }


class TestHealthEndpoint:
    def test_health_check(self):
        client = TestClient(app)
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestDeprecatedEndpoints:
    def test_tours_removed(self):
        client = TestClient(app)
        r = client.get("/api/v1/tours")
        assert r.status_code in (404, 410)

    def test_hunts_removed(self):
        client = TestClient(app)
        r = client.get("/api/v1/scavenger-hunts")
        assert r.status_code in (404, 410)


class TestContextFilesAdmin:
    def test_get_context_files_fastui(self):
        client = TestClient(app)
        response = client.get("/api/admin/context-files")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        if data:
            assert data[0].get("type") == "Page"

    def test_validate_ticket_invalid_barcode(self):
        client = TestClient(app)
        response = client.post("/api/v1/progress/validate-ticket", json={"barcode": "INVALID123"})
        assert response.status_code in (200, 400, 500)
        data = response.json()
        assert "valid" in data or "message" in data


class TestAuthentication:
    def test_login_invalid_credentials(self):
        client = TestClient(app)
        response = client.post("/api/v1/auth/login-json", json={"username": "wrong", "password": "wrongpass"})
        assert response.status_code in [401, 422, 500]
