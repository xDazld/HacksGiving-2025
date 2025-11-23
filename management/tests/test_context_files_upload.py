"""Tests for context file upload and deletion in admin interface"""

from fastapi.testclient import TestClient
from main import app
from app.services import AppwriteService
from app.models import ContextFile


def test_upload_context_file(monkeypatch):
    """Upload a context file via multipart form and verify FastUI redirect event."""

    async def fake_upload(self, filename: str, file_bytes: bytes, mime_type: str):  # type: ignore[override]
        return ContextFile(id="mock-file-1", name=filename, mime_type=mime_type, size_original=len(file_bytes))

    monkeypatch.setattr(AppwriteService, "upload_context_file", fake_upload)

    client = TestClient(app)
    files = {"file": ("sample.txt", b"Hello Domes", "text/plain")}
    response = client.post("/api/admin/context-files/upload", files=files)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert data[0].get("type") == "FireEvent"
    # Event should navigate back to listing page
    event = data[0].get("event", {})
    assert event.get("url") == "/admin/context-files"


def test_delete_context_file(monkeypatch):
    """Delete a context file and verify FastUI redirect event."""

    async def fake_delete(self, file_id: str):  # type: ignore[override]
        assert file_id == "mock-file-1"
        return True

    monkeypatch.setattr(AppwriteService, "delete_context_file", fake_delete)

    client = TestClient(app)
    response = client.get("/api/admin/context-files/mock-file-1/delete")
    assert response.status_code == 200
    data = response.json()
    assert data[0].get("type") == "FireEvent"
    event = data[0].get("event", {})
    assert event.get("url") == "/admin/context-files"
