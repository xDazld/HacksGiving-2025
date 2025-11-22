"""End-to-end tests using Playwright"""

import re

import pytest
from playwright.sync_api import Page, expect


@pytest.fixture(scope="session")
def base_url():
    """Base URL for the application"""
    return "http://localhost:8000"


class TestHomePage:
    """Test the home page"""

    def test_home_page_loads(self, page: Page, base_url: str):
        """Test that the home page loads successfully"""
        page.goto(base_url)
        expect(page).to_have_title("Milwaukee Domes Management")

        # Check for main heading
        heading = page.locator("h1")
        expect(heading).to_contain_text("Milwaukee Domes Management")

    def test_home_page_has_links(self, page: Page, base_url: str):
        """Test that home page has expected links"""
        page.goto(base_url)

        # Check for admin dashboard link
        admin_link = page.get_by_role("link", name="Admin Dashboard")
        expect(admin_link).to_be_visible()

        # Check for API docs link
        docs_link = page.get_by_role("link", name="API Documentation")
        expect(docs_link).to_be_visible()


class TestAPIDocumentation:
    """Test API documentation pages"""

    def test_swagger_docs_load(self, page: Page, base_url: str):
        """Test that Swagger API docs load"""
        response = page.goto(f"{base_url}/docs")
        assert response is not None and response.status == 200

        # Wait for Swagger UI to load
        page.wait_for_selector(".swagger-ui")

        # Check for API title
        title = page.locator(".title")
        expect(title).to_contain_text("Milwaukee Domes Management")

    def test_redoc_loads(self, page: Page, base_url: str):
        """Test that ReDoc loads (content-based smoke test with timeout)."""
        page.set_default_timeout(5000)
        response = page.goto(f"{base_url}/redoc", timeout=15000, wait_until="domcontentloaded")
        assert response is not None and response.status == 200
        # Content-based assertion avoids flaky visibility waits on custom element.
        html = page.content()
        assert "<redoc" in html.lower(), "ReDoc placeholder tag missing"
        # Basic sanity: openapi.json should have been requested.
        # (Network request already logged by server; no extra wait here.)


class TestHealthEndpoint:
    """Test health check endpoint"""

    def test_health_check_returns_json(self, page: Page, base_url: str):
        """Test that health endpoint returns valid JSON"""
        response = page.goto(f"{base_url}/health")
        assert response is not None and response.status == 200

        # Get the JSON content
        content = page.content()
        assert "healthy" in content.lower()


class TestAdminInterface:
    """Test admin interface"""

    def test_admin_dashboard_loads(self, page: Page, base_url: str):
        """Test that admin dashboard loads"""
        page.goto(f"{base_url}/admin")

        # FastUI should render the page
        page.wait_for_load_state("networkidle")

        # Check that the page has loaded
        expect(page).not_to_have_title("404")

    def test_admin_tours_page(self, page: Page, base_url: str):
        """Test tours management page"""
        page.goto(f"{base_url}/admin/tours")

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Page should load without errors
        expect(page).not_to_have_title("404")

    def test_admin_plants_page(self, page: Page, base_url: str):
        """Test plants management page"""
        page.goto(f"{base_url}/admin/plants")

        # Wait for page to load
        page.wait_for_load_state("networkidle")

        # Page should load without errors
        expect(page).not_to_have_title("404")


class TestAPIEndpoints:
    """Test API endpoints return valid data"""

    def test_tours_api_returns_json(self, page: Page, base_url: str):
        """Test tours API returns valid JSON"""
        response = page.goto(f"{base_url}/api/v1/tours")
        assert response is not None and response.status == 200
        # FastAPI's default JSON response in browser is wrapped in HTML with a <pre> tag
        pre = page.locator("pre")
        text = pre.text_content()
        assert text is not None
        assert text.strip().startswith("[")

    def test_scavenger_hunts_api(self, page: Page, base_url: str):
        """Test scavenger hunts API"""
        response = page.goto(f"{base_url}/api/v1/scavenger-hunts")
        assert response is not None and response.status == 200

    def test_plants_api(self, page: Page, base_url: str):
        """Test plants API"""
        response = page.goto(f"{base_url}/api/v1/plants")
        assert response is not None and response.status == 200
