"""Test that plant edit form is prefilled with existing data."""

from fastapi.testclient import TestClient
from main import app
from app.services import AppwriteService
from app.models import Plant


def test_plant_edit_form_prefilled(monkeypatch):
    plant = Plant(
        id="plant-123",
        common_name="Prefill Test",
        scientific_name="Testus prefillus",
        quantity=3,
        buy_new_wont_survive=False,
        buy_new_readily_available=True,
        move_by_staff=True,
        move_requires_consult=False,
        notes="Existing notes",
        dome_location="Show Dome",
        image_url=None,
        created_at=None,
        updated_at=None,
    )

    async def fake_get(self, plant_id: str):  # type: ignore[override]
        assert plant_id == plant.id
        return plant

    monkeypatch.setattr(AppwriteService, "get_plant", fake_get)

    client = TestClient(app)
    response = client.get(f"/api/admin/plants/{plant.id}/edit")
    assert response.status_code == 200
    data = response.json()
    # Expect a Page with ModelForm; verify defaults present in rendered schema
    assert data[0]["type"] == "Page"
    # Serialize components list and look for plant values
    serialized = str(data)
    assert "Prefill Test" in serialized
    assert "Testus prefillus" in serialized
    assert "Existing notes" in serialized
    assert "Show Dome" in serialized
