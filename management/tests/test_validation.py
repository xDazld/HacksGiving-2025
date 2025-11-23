"""Tests for input validation"""

# pytest: asyncio_mode=auto

from fastapi.testclient import TestClient
from main import app


class TestBeaconValidation:
    def test_empty_beacon_ids(self):
        client = TestClient(app)
        beacon_data = {"ids": [], "rssi": [-65, -70]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "must not be empty" in response.json()["detail"].lower()

    def test_empty_rssi_values(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": []}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "must not be empty" in response.json()["detail"].lower()

    def test_mismatched_array_lengths(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2", "beacon3"], "rssi": [-65, -70]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "same length" in response.json()["detail"].lower()

    def test_rssi_value_too_high(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [-65, 10]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "between -100 and 0" in response.json()["detail"].lower()

    def test_rssi_value_too_low(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [-65, -150]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 400
        assert "between -100 and 0" in response.json()["detail"].lower()

    def test_valid_beacon_data(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2", "beacon3"], "rssi": [-65, -70, -55]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert "progress" in data
        assert 0 <= data["progress"] <= 100
        assert "nearest_location" in data
        assert data["nearest_location"] == "beacon3"

    def test_boundary_rssi_values(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1", "beacon2"], "rssi": [0, -100]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nearest_location"] == "beacon1"

    def test_single_beacon(self):
        client = TestClient(app)
        beacon_data = {"ids": ["beacon1"], "rssi": [-65]}
        response = client.post("/api/v1/progress/calculate", json=beacon_data)
        assert response.status_code == 200
        data = response.json()
        assert data["nearest_location"] == "beacon1"
        assert data["progress"] == 10.0
