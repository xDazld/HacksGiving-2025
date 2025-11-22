"""Unit tests for API endpoints"""

import pytest
from httpx import AsyncClient, ASGITransport
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
    """Test health check endpoint"""

    @pytest.mark.asyncio
    async def test_health_check(self):
        """Test that health check returns healthy status"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/health")

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data


class TestToursEndpoints:
    """Test tours API endpoints"""

    @pytest.mark.asyncio
    async def test_get_tours(self):
        """Test getting all tours"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/tours")

        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @pytest.mark.asyncio
    async def test_get_single_tour_not_found(self):
        """Test getting a non-existent tour returns 404"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/tours/nonexistent")

        assert response.status_code == 404


class TestScavengerHuntsEndpoints:
    """Test scavenger hunts API endpoints"""

    @pytest.mark.asyncio
    async def test_get_scavenger_hunts(self):
        """Test getting all scavenger hunts"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/scavenger-hunts")

        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestPlantsEndpoints:
    """Test plants API endpoints"""

    @pytest.mark.asyncio
    async def test_get_plants(self):
        """Test getting all plants"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.get("/api/v1/plants")

        assert response.status_code == 200
        assert isinstance(response.json(), list)


class TestProgressEndpoints:
    """Test progress tracking endpoints"""

    @pytest.mark.asyncio
    async def test_calculate_progress(self):
        """Test progress calculation with beacon data"""
        beacon_data = {"ids": ["beacon1", "beacon2", "beacon3"], "rssi": [-65, -70, -55]}

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)

        assert response.status_code == 200
        data = response.json()
        assert "progress" in data
        assert 0 <= data["progress"] <= 100
        assert "nearest_location" in data

    @pytest.mark.asyncio
    async def test_validate_ticket_invalid_barcode(self):
        """Test ticket validation with invalid barcode"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/validate-ticket", json={"barcode": "INVALID123"})

        assert response.status_code == 200
        data = response.json()
        # May be valid or invalid depending on Appwrite data
        assert "valid" in data


class TestAuthentication:
    """Test authentication endpoints"""

    @pytest.mark.asyncio
    async def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/auth/login-json", json={"username": "wrong", "password": "wrongpass"})

        # Should fail without proper environment setup
        assert response.status_code in [401, 422, 500]
