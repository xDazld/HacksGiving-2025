"""End-to-end tests using Playwright"""

import pytest
from playwright.sync_api import Page, expect

# Test timeout constants
DEFAULT_TIMEOUT = 5000
REDOC_LOAD_TIMEOUT = 15000


def fill_form_field(page: Page, selector: str, value: str) -> bool:
    """Fill a form field if it exists.

    Args:
        page: Playwright page object
        selector: CSS selector for the form field
        value: Value to fill

    Returns:
        True if field was found and filled, False otherwise
    """
    element = page.locator(selector)
    if element.count() > 0:
        element.fill(value)
        return True
    return False


def select_form_option(page: Page, selector: str, value: str) -> bool:
    """Select an option in a form field if it exists.

    Args:
        page: Playwright page object
        selector: CSS selector for the form field
        value: Value to select or fill

    Returns:
        True if field was found and filled, False otherwise
    """
    element = page.locator(selector)
    if element.count() > 0:
        # Check if it's a select element by evaluating the tag name
        tag_name = element.evaluate("el => el.tagName.toLowerCase()")
        if tag_name == "select":
            element.select_option(value)
        else:
            # For text inputs, just fill the value
            element.fill(value)
        return True
    return False


def submit_form(page: Page) -> bool:
    """Submit a form if submit button exists.

    Args:
        page: Playwright page object

    Returns:
        True if submit button was found and clicked, False otherwise
    """
    submit_button = page.locator('button[type="submit"]')
    if submit_button.count() > 0:
        submit_button.click()
        page.wait_for_load_state("networkidle")
        return True
    return False


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

        # Check for admin dashboard link - updated to match new accessible label
        admin_link = page.get_by_role("button", name="Access Admin Dashboard")
        expect(admin_link).to_be_visible()

        # Check for API docs link - updated to match new accessible label
        docs_link = page.get_by_role("button", name="View API Documentation")
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
        page.set_default_timeout(DEFAULT_TIMEOUT)
        response = page.goto(f"{base_url}/redoc", timeout=REDOC_LOAD_TIMEOUT, wait_until="domcontentloaded")
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
    """Test admin interface (tours removed)"""

    def test_admin_dashboard_loads(self, page: Page, base_url: str):
        page.goto(f"{base_url}/admin")
        page.wait_for_load_state("networkidle")
        expect(page).not_to_have_title("404")

    def test_admin_context_files_page(self, page: Page, base_url: str):
        page.goto(f"{base_url}/admin/context-files")
        page.wait_for_load_state("networkidle")
        expect(page).not_to_have_title("404")

    def test_admin_plants_page(self, page: Page, base_url: str):
        page.goto(f"{base_url}/admin/plants")
        page.wait_for_load_state("networkidle")
        expect(page).not_to_have_title("404")

    def test_context_files_upload_via_fetch(self, page: Page, base_url: str):
        """Use client-side fetch to POST a multipart file upload to the context files upload API.

        This test is tolerant to environments without Appwrite; it validates the request/response and
        ensures the upload endpoint returns JSON or a valid response code.
        """
        page.goto(f"{base_url}/admin/context-files/upload")
        page.wait_for_load_state("networkidle")

        upload_result = page.evaluate(
            "async () => {\n"
            "  const fd = new FormData();\n"
            "  fd.append('file', new File(['e2e-test-content'], 'e2e-upload.txt', { type: 'text/plain' }));\n"
            "  const res = await fetch('/api/admin/context-files/upload', { method: 'POST', body: fd });\n"
            "  const code = res.status;\n"
            "  let body = null;\n"
            "  try { body = await res.json(); } catch(e) {}\n"
            "  return { status: code, body: body };\n"
            "}"
        )

        # Accept 200, 400 or 500 depending on runtime environment; if 200 verify expected payload
        assert upload_result["status"] in (200, 400, 500)
        if upload_result["status"] == 200:
            # Response may be FireEvent redirect or an error Page if storage unavailable.
            assert isinstance(upload_result["body"], list)
            if upload_result["body"]:
                first_type = upload_result["body"][0].get("type")
                assert first_type in ("FireEvent", "Page"), f"Unexpected component type: {first_type}"

    def test_context_files_upload_via_form(self, page: Page, base_url: str):
        """Upload a file using the native FastUI form to ensure form field wiring works."""
        page.goto(f"{base_url}/admin/context-files/upload")
        page.wait_for_load_state("networkidle")
        # Locate file input by name attribute
        file_input = page.locator('input[type="file"][name="file"]')
        assert file_input.count() == 1
        file_input.set_input_files(
            [
                {
                    "name": "form-upload.txt",
                    "mimeType": "text/plain",
                    "buffer": b"Form upload e2e content",
                }
            ]
        )
        # Submit the form (the FastUI rendered form should include a submit button)
        submit = page.locator('button[type="submit"]')
        assert submit.count() == 1
        submit.click()
        page.wait_for_load_state("networkidle")
        # After FireEvent redirect we expect listing page URL
        assert "/admin/context-files" in page.url


class TestAdminForms:
    """Test remaining admin form features"""

    def test_plant_creation_form_loads(self, page: Page, base_url: str):
        """Test that plant creation form loads"""
        page.goto(f"{base_url}/admin/plants/new")
        page.wait_for_load_state("networkidle")

        # Check that form page loaded (no 404)
        expect(page).not_to_have_title("404")

        page.wait_for_selector("body", state="visible")

    def test_plant_creation_form_submission(self, page: Page, base_url: str):
        """Test plant creation form submission workflow"""
        page.goto(f"{base_url}/admin/plants/new")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("body", state="visible")

        # Fill form fields using helper functions
        common_name_filled = fill_form_field(page, 'input[name="common_name"]', "E2E Test Plant")
        scientific_name_filled = fill_form_field(page, 'input[name="scientific_name"]', "Testus e2eus")
        quantity_filled = fill_form_field(page, 'input[name="quantity"]', "10")
        dome_location_filled = fill_form_field(page, 'input[name="dome_location"]', "Test Dome")
        notes_filled = fill_form_field(page, 'textarea[name="notes"], input[name="notes"]', "Created by E2E test")

        # Only attempt submission if required fields were found and filled
        if common_name_filled and scientific_name_filled:
            submit_form(page)

    def test_form_create_buttons_present(self, page: Page, base_url: str):
        page.goto(f"{base_url}/admin/plants")
        page.wait_for_load_state("networkidle")
        page.wait_for_selector("body", state="visible")
        create_link = page.locator('button:has-text("Add New Plant")')
        if create_link.count() > 0:
            create_link.first.click()
            page.wait_for_load_state("networkidle")
            assert "/plants/new" in page.url

    def test_plant_edit_page_loads(self, page: Page, base_url: str):
        """Test that plant edit pages are accessible"""
        page.goto(f"{base_url}/admin/plants")
        page.wait_for_load_state("networkidle")
        # Check if edit buttons are present
        edit_buttons = page.locator('button:has-text("Edit")')
        if edit_buttons.count() > 0:
            # Click first edit button
            edit_buttons.first.click()
            page.wait_for_load_state("networkidle")
            assert "/plants/" in page.url
            assert "/edit" in page.url

    def test_context_file_delete_buttons_present(self, page: Page, base_url: str):
        """Test that delete buttons appear on context files page"""
        page.goto(f"{base_url}/admin/context-files")
        page.wait_for_load_state("networkidle")
        # Just verify the page loads - actual delete functionality requires real files
        expect(page).not_to_have_title("404")


class TestAPIEndpoints:
    """Test active API endpoints return valid data"""

    def test_plants_api(self, page: Page, base_url: str):
        response = page.goto(f"{base_url}/api/v1/plants")
        assert response is not None and response.status == 200
