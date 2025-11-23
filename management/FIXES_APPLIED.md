# Code Quality Fixes Applied

## Summary
All identified issues have been resolved to improve code quality, security, and maintainability.

## Changes Made

### 1. ✅ Deprecated datetime.utcnow() Fixed
**File:** `app/auth.py`

- **Issue:** Using deprecated `datetime.utcnow()` in Python 3.12+
- **Fix:** Replaced with `datetime.now(timezone.utc)`
- **Impact:** Future-proofs the code for Python 3.12+ compatibility

```python
# Before
expire = datetime.utcnow() + expires_delta

# After
expire = datetime.now(timezone.utc) + expires_delta
```

---

### 2. ✅ Exception Handling with Logging
**Files:** `app/routers/tours.py`, `app/services/appwrite_service.py`

- **Issue:** Bare `except Exception` blocks that silently swallow errors
- **Fix:** Added logging to all exception handlers
- **Impact:** Makes debugging easier by providing visibility into failures

```python
# Before
except Exception:
    return []

# After
except Exception as e:
    logger.error(f"Error fetching tours: {e}")
    return []
```

**Files affected:**
- `get_tours()` - Now logs failed tour fetches
- `get_scavenger_hunts()` - Now logs failed hunt fetches
- `get_cafe_tours()` - Now logs failed cafe tour fetches
- `get_plants()` - Now logs failed plant fetches

---

### 3. ✅ Configurable Total Beacons
**Files:** `app/config.py`, `app/routers/progress.py`

- **Issue:** Hard-coded magic number (10) for total beacons
- **Fix:** Made configurable via settings
- **Impact:** Easier to adjust for different deployments without code changes

```python
# In app/config.py
total_beacons: int = 10

# In progress router
total_beacons = settings.total_beacons
progress_percentage = min(100.0, (unique_beacons / total_beacons) * 100)
```

---

### 4. ✅ Removed Unused Import
**File:** `tests/test_e2e.py`

- **Issue:** Import of `re` module not used anywhere
- **Fix:** Removed the unused import
- **Impact:** Cleaner code, reduces confusion

---

### 5. ✅ Input Validation for Beacon Endpoint
**File:** `app/routers/progress.py`

- **Issue:** No validation of beacon data could cause division by zero or index errors
- **Fix:** Added comprehensive validation:
  - Ensures arrays are not empty
  - Validates arrays have the same length
  - Validates RSSI values are in valid range (-100 to 0)
- **Impact:** Prevents crashes from malicious or malformed input

```python
# Validate input
if not beacon_data.ids or not beacon_data.rssi:
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Beacon IDs and RSSI values must not be empty"
    )

if len(beacon_data.ids) != len(beacon_data.rssi):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Beacon IDs and RSSI arrays must have the same length"
    )

if not all(-100 <= rssi <= 0 for rssi in beacon_data.rssi):
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="RSSI values must be between -100 and 0"
    )
```

---

### 6. ✅ Replaced Fixed Timeouts in Tests
**File:** `tests/test_e2e.py`

- **Issue:** Hard-coded `page.wait_for_timeout(1000)` makes tests brittle and slow
- **Fix:** Replaced with `page.wait_for_selector("body", state="visible")`
- **Impact:** Tests are more reliable and faster

**Tests affected:**
- `test_admin_tours_page`
- `test_tour_creation_form_loads`
- `test_tour_creation_form_submission`
- `test_scavenger_hunt_creation_form_loads`
- `test_scavenger_hunt_creation_form_submission`
- `test_plant_creation_form_loads`
- `test_plant_creation_form_submission`
- `test_form_create_buttons_present`

---

### 7. ✅ Test Environment Variable Isolation
**File:** `tests/conftest.py`

- **Issue:** Module-level environment variable setting causes isolation issues
- **Fix:** Use pytest fixtures with session-scoped monkeypatch
- **Impact:** Proper test isolation and cleanup

```python
@pytest.fixture(scope="session", autouse=True)
def test_env_vars(monkeypatch_session):
    """Set test environment variables with proper isolation"""
    monkeypatch_session.setenv("APPWRITE_PROJECT_ID", "test-project")
    monkeypatch_session.setenv("APPWRITE_API_KEY", "test-api-key")
    monkeypatch_session.setenv("SECRET_KEY", "test-secret-key...")
    monkeypatch_session.setenv("ADMIN_PASSWORD", "test-password")
```

---

### 8. ✅ Optimized Admin Password Hashing
**Files:** `app/auth.py`, `app/startup.py`

- **Issue:** Admin password was being hashed on every request
- **Fix:** Hash admin password once at startup and store in module-level variable
- **Impact:** Reduces CPU usage and improves performance

```python
# Module-level variable
_admin_hashed_password = None

def initialize_admin_password(settings: Settings) -> None:
    """Initialize admin password hash at startup"""
    global _admin_hashed_password
    _admin_hashed_password = get_password_hash(settings.admin_password)

def get_user(username: str, settings: Settings) -> Optional[UserInDB]:
    """Get user from database"""
    global _admin_hashed_password
    if username == settings.admin_username:
        if _admin_hashed_password is None:
            # Fallback for testing or if startup didn't run
            _admin_hashed_password = get_password_hash(settings.admin_password)
        return UserInDB(
            username=settings.admin_username,
            hashed_password=_admin_hashed_password,
            disabled=False,
        )
    return None
```

The initialization is called in `startup.py`:
```python
print("\n🔐 Initializing admin authentication")
initialize_admin_password(settings)
print("  ✓ Admin password hash initialized")
```

---

## Testing

All modified files have been verified to compile without syntax errors:
```bash
python -m py_compile app/auth.py app/config.py app/routers/progress.py \
    app/routers/tours.py app/services/appwrite_service.py app/startup.py \
    tests/conftest.py tests/test_e2e.py
```

## Environment Configuration

The new `total_beacons` setting can be configured via environment variable:
```bash
export TOTAL_BEACONS=15  # Default is 10 if not specified
```

## Benefits

1. **Future-proof:** Compatible with Python 3.12+
2. **Better Debugging:** Errors are logged instead of silently swallowed
3. **Security:** Input validation prevents crashes from malformed data
4. **Performance:** Admin password hashing reduced from O(n requests) to O(1)
5. **Maintainability:** Hard-coded values are now configurable
6. **Reliability:** Tests are more robust with proper waiting mechanisms
7. **Test Quality:** Proper test isolation prevents interference

## Migration Notes

No breaking changes. All changes are backward compatible. The only environment variable addition is optional (`TOTAL_BEACONS`).
