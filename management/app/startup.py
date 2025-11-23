"""Application startup tasks - database initialization"""

import sys

from appwrite.client import Client
from appwrite.services.databases import Databases

from appwrite.exception import AppwriteException

from app.config import Settings


def create_string_attribute(
    databases: Databases,
    database_id: str,
    collection_id: str,
    key: str,
    size: int,
    required: bool = False,
    default: str | None = None,
) -> None:
    """Create a string attribute with error handling"""
    try:
        databases.create_string_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key=key,
            size=size,
            required=required,
            default=default,
        )
        print(f"  ✓ Created attribute: {key}")
    except AppwriteException as e:
        if "already exists" in str(e).lower():
            print(f"  • Attribute {key} already exists")
        else:
            raise


def create_integer_attribute(
    databases: Databases,
    database_id: str,
    collection_id: str,
    key: str,
    required: bool = False,
    default: int | None = None,
    min_value: int | None = None,
    max_value: int | None = None,
) -> None:
    """Create an integer attribute with error handling"""
    try:
        databases.create_integer_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key=key,
            required=required,
            default=default,
            min=min_value,
            max=max_value,
        )
        print(f"  ✓ Created attribute: {key}")
    except AppwriteException as e:
        if "already exists" in str(e).lower():
            print(f"  • Attribute {key} already exists")
        else:
            raise


def create_boolean_attribute(
    databases: Databases,
    database_id: str,
    collection_id: str,
    key: str,
    required: bool = False,
    default: bool | None = None,
) -> None:
    """Create a boolean attribute with error handling"""
    try:
        databases.create_boolean_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key=key,
            required=required,
            default=default,
        )
        print(f"  ✓ Created attribute: {key}")
    except AppwriteException as e:
        if "already exists" in str(e).lower():
            print(f"  • Attribute {key} already exists")
        else:
            raise


def create_datetime_attribute(
    databases: Databases,
    database_id: str,
    collection_id: str,
    key: str,
    required: bool = False,
    default: str | None = None,
) -> None:
    """Create a datetime attribute with error handling"""
    try:
        databases.create_datetime_attribute(
            database_id=database_id,
            collection_id=collection_id,
            key=key,
            required=required,
            default=default,
        )
        print(f"  ✓ Created attribute: {key}")
    except AppwriteException as e:
        if "already exists" in str(e).lower():
            print(f"  • Attribute {key} already exists")
        else:
            raise


def setup_tours_collection(databases: Databases, database_id: str, collection_id: str) -> None:
    """Setup tours collection schema"""
    print(f"\n📋 Setting up collection: {collection_id}")

    # Basic fields
    create_string_attribute(databases, database_id, collection_id, "title", 255, required=True)
    create_string_attribute(databases, database_id, collection_id, "description", 1000, required=True)

    # JSON field for parts array - stored as string
    create_string_attribute(databases, database_id, collection_id, "parts", 65535, required=True)

    # Timestamps
    create_datetime_attribute(databases, database_id, collection_id, "created_at")
    create_datetime_attribute(databases, database_id, collection_id, "updated_at")


def setup_scavenger_hunts_collection(databases: Databases, database_id: str, collection_id: str) -> None:
    """Setup scavenger hunts collection schema"""
    print(f"\n📋 Setting up collection: {collection_id}")

    create_string_attribute(databases, database_id, collection_id, "title", 255, required=True)
    create_string_attribute(databases, database_id, collection_id, "description", 1000, required=True)
    create_string_attribute(databases, database_id, collection_id, "difficulty", 50, required=True)

    # JSON field for items array
    create_string_attribute(databases, database_id, collection_id, "items", 65535, required=True)

    # Timestamps
    create_datetime_attribute(databases, database_id, collection_id, "created_at")
    create_datetime_attribute(databases, database_id, collection_id, "updated_at")


def setup_cafe_tours_collection(databases: Databases, database_id: str, collection_id: str) -> None:
    """Setup cafe tours collection schema"""
    print(f"\n📋 Setting up collection: {collection_id}")

    create_string_attribute(databases, database_id, collection_id, "title", 255, required=True)
    create_string_attribute(databases, database_id, collection_id, "description", 1000, required=True)

    # JSON field for parts array
    create_string_attribute(databases, database_id, collection_id, "parts", 65535, required=True)

    # Timestamps
    create_datetime_attribute(databases, database_id, collection_id, "created_at")
    create_datetime_attribute(databases, database_id, collection_id, "updated_at")


def setup_plants_collection(databases: Databases, database_id: str, collection_id: str) -> None:
    """Setup plants collection schema"""
    print(f"\n📋 Setting up collection: {collection_id}")

    create_string_attribute(databases, database_id, collection_id, "common_name", 255, required=True)
    create_string_attribute(databases, database_id, collection_id, "scientific_name", 255, required=True)
    create_integer_attribute(databases, database_id, collection_id, "quantity", default=0)

    # Movement/status booleans
    create_boolean_attribute(databases, database_id, collection_id, "buy_new_wont_survive", default=False)
    create_boolean_attribute(databases, database_id, collection_id, "buy_new_readily_available", default=False)
    create_boolean_attribute(databases, database_id, collection_id, "move_by_staff", default=False)
    create_boolean_attribute(databases, database_id, collection_id, "move_requires_consult", default=False)

    create_string_attribute(databases, database_id, collection_id, "notes", 2000)
    create_string_attribute(databases, database_id, collection_id, "dome_location", 255)
    create_string_attribute(databases, database_id, collection_id, "image_url", 500)

    # Timestamps
    create_datetime_attribute(databases, database_id, collection_id, "created_at")
    create_datetime_attribute(databases, database_id, collection_id, "updated_at")


def setup_tickets_collection(databases: Databases, database_id: str, collection_id: str) -> None:
    """Setup tickets collection schema"""
    print(f"\n📋 Setting up collection: {collection_id}")

    create_string_attribute(databases, database_id, collection_id, "barcode", 255, required=True)
    create_datetime_attribute(databases, database_id, collection_id, "expiry_date")
    create_boolean_attribute(databases, database_id, collection_id, "is_valid", default=True)

    # Timestamps
    create_datetime_attribute(databases, database_id, collection_id, "created_at")


def initialize_database(settings: Settings) -> bool:
    """
    Initialize Appwrite database and collections if they don't exist.
    Returns True if successful, False otherwise.
    """
    print("\n" + "=" * 60)
    print("🚀 Initializing Appwrite Database")
    print("=" * 60)

    try:
        # Setup client
        client = Client()
        client.set_endpoint(settings.appwrite_endpoint)
        client.set_project(settings.appwrite_project_id)
        client.set_key(settings.appwrite_api_key)

        databases = Databases(client)

        # 1. Create database if it doesn't exist
        print(f"\n📊 Checking database: {settings.appwrite_database_id}")
        try:
            databases.get(database_id=settings.appwrite_database_id)
            print(f"  ✓ Database exists")
        except AppwriteException as e:
            if "not found" in str(e).lower():
                print(f"  • Database not found, creating...")
                databases.create(
                    database_id=settings.appwrite_database_id,
                    name=settings.appwrite_database_id,
                )
                print(f"  ✓ Database created")
            else:
                raise

        # 2. Create collections with schemas
        collections = [
            (settings.tours_collection_id, "Tours", setup_tours_collection),
            (settings.scavenger_hunts_collection_id, "Scavenger Hunts", setup_scavenger_hunts_collection),
            (settings.cafe_tours_collection_id, "Cafe Tours", setup_cafe_tours_collection),
            (settings.plants_collection_id, "Plants", setup_plants_collection),
            (settings.tickets_collection_id, "Tickets", setup_tickets_collection),
        ]

        for collection_id, collection_name, setup_func in collections:
            print(f"\n📁 Checking collection: {collection_id}")
            try:
                # Try to create collection - if it exists, Appwrite will error
                databases.create_collection(
                    database_id=settings.appwrite_database_id,
                    collection_id=collection_id,
                    name=collection_name,
                    permissions=[],  # Will be handled by API
                    document_security=False,  # Use collection-level permissions
                )
                print(f"  ✓ Collection created")
            except AppwriteException as e:
                if "already exists" in str(e).lower() or "duplicate" in str(e).lower():
                    print(f"  ✓ Collection already exists")
                elif "not found" not in str(e).lower():
                    # If it's not a "not found" error, show warning
                    print(f"  ⚠ Note: {e}")
                else:
                    # Unknown error
                    print(f"  ⚠ Error: {e}")

            # Setup collection schema
            try:
                setup_func(databases, settings.appwrite_database_id, collection_id)
            except Exception as e:
                print(f"  ⚠ Schema setup note: {str(e)[:100]}")
                # Continue anyway - attributes may already exist

        print("\n" + "=" * 60)
        print("✅ Database initialization complete!")
        print("=" * 60)
        return True

    except AppwriteException as e:
        print(f"\n❌ Appwrite Error: {e}", file=sys.stderr)
        print(f"Error code: {e.code}", file=sys.stderr)
        print(f"Error type: {e.type}", file=sys.stderr)
        return False
    except Exception as e:
        print(f"\n❌ Unexpected Error: {e}", file=sys.stderr)
        import traceback

        traceback.print_exc()
        return False
