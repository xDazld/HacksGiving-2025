"""Tests for input validation"""

# pytest: asyncio_mode=auto

import pytest
from httpx import AsyncClient, ASGITransport
from main import app


pytest_plugins = ("pytest_asyncio",)


class TestBeaconValidation:
    """Test beacon data validation"""

    @pytest.mark.asyncio
    async def test_empty_beacon_ids(self):
        """Test that empty beacon IDs are rejected"""
        beacon_data = {"ids": [], "rssi": [-65, -70]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "must not be empty" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_empty_rssi_values(self):
        """Test that empty RSSI values are rejected"""
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": []}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "must not be empty" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_mismatched_array_lengths(self):
        """Test that mismatched array lengths are rejected"""
        beacon_data = {"ids": ["beacon1", "beacon2", "beacon3"], "rssi": [-65, -70]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "same length" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_rssi_value_too_high(self):
        """Test that RSSI values above 0 are rejected"""
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [-65, 10]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "between -100 and 0" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_rssi_value_too_low(self):
        """Test that RSSI values below -100 are rejected"""
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [-65, -150]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "between -100 and 0" in response.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_valid_beacon_data(self):
        """Test that valid beacon data is accepted"""
        beacon_data = {"ids": ["beacon1", "beacon2", "beacon3"], "rssi": [-65, -70, -55]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert "progress" in data
        assert 0 <= data["progress"] <= 100
        assert "nearest_location" in data
        assert data["nearest_location"] == "beacon3"  # Highest RSSI (-55)

    @pytest.mark.asyncio
    async def test_boundary_rssi_values(self):
        """Test that boundary RSSI values (0 and -100) are accepted"""
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [0, -100]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nearest_location"] == "beacon1"  # Highest RSSI (0)

    @pytest.mark.asyncio
    async def test_single_beacon(self):
        """Test progress calculation with a single beacon"""
        beacon_data = {"ids": ["beacon1"], "rssi": [-65]}
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            response = await client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nearest_location"] == "beacon1"
        # With 1 beacon out of 10 default, progress should be 10%
        assert data["progress"] == 10.0
