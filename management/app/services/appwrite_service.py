"""Appwrite service for database and authentication operations

Note: We use the Databases API (legacy documents API) because the Python SDK 6.0.0
does not yet support the newer TablesDB API. The deprecation warnings come from the
Appwrite server, not the SDK. The API is fully functional and supported.
"""

import warnings
import json
import logging
from datetime import datetime
from typing import Optional, Any
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.users import Users
from appwrite.query import Query
from appwrite.id import ID
from appwrite.input_file import InputFile

# Suppress Appwrite SDK deprecation warnings since TablesDB is not yet available in Python SDK
warnings.filterwarnings("ignore", message="Call to deprecated function", module="appwrite")

logger = logging.getLogger(__name__)

from app.config import Settings
from app.models import (
    Plant,
    PlantCreate,
    PlantUpdate,
    ContextFile,
)


class AppwriteService:
    """Service for interacting with Appwrite backend"""

    def __init__(self, settings: Settings):
        self.settings = settings
        self.client = Client()
        self.client.set_endpoint(settings.appwrite_endpoint)
        self.client.set_project(settings.appwrite_project_id)
        self.client.set_key(settings.appwrite_api_key)

        self.databases = Databases(self.client)
        self.storage = Storage(self.client)
        self.users = Users(self.client)

    # Context Files (Storage)
    async def list_context_files(self) -> list[ContextFile]:
        """List uploaded context files used for LLM generation."""
        try:
            files = self.storage.list_files(bucket_id=self.settings.context_files_bucket_id)
            results: list[ContextFile] = []
            for f in files.get("files", []):
                file_dict = dict(f)
                file_dict["id"] = file_dict.pop("$id")
                file_dict["size_original"] = file_dict.get("sizeOriginal", 0)
                file_dict["mime_type"] = file_dict.get("mimeType")
                file_dict["created_at"] = file_dict.get("createdAt")
                results.append(ContextFile(**file_dict))
            return results
        except Exception as e:
            logger.error(f"Error listing context files: {e}")
            return []

    async def upload_context_file(self, filename: str, file_bytes: bytes, mime_type: str | None) -> ContextFile:
        """Upload a new context file to storage bucket."""
        try:
            created = self.storage.create_file(
                bucket_id=self.settings.context_files_bucket_id,
                file_id=ID.unique(),
                file=InputFile.from_bytes(
                    file_bytes, filename=filename, mime_type=mime_type or "application/octet-stream"
                ),
            )
            data = dict(created)
            data["id"] = data.pop("$id")
            data["size_original"] = data.get("sizeOriginal", 0)
            data["mime_type"] = data.get("mimeType")
            data["created_at"] = data.get("createdAt")
            return ContextFile(**data)
        except Exception as e:
            logger.error(f"Error uploading context file: {e}")
            raise

    async def delete_context_file(self, file_id: str) -> bool:
        """Delete a context file from storage."""
        try:
            self.storage.delete_file(bucket_id=self.settings.context_files_bucket_id, file_id=file_id)
            return True
        except Exception as e:
            logger.error(f"Error deleting context file {file_id}: {e}")
            return False

    # Plants
    async def get_plants(self, limit: int = 100, offset: int = 0) -> list[Plant]:
        """Get all plants"""
        try:
            result = self.databases.list_documents(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.plants_collection_id,
                queries=[Query.limit(limit), Query.offset(offset)],
            )
            plants = []
            for doc in result["documents"]:
                doc_dict = dict(doc)
                doc_dict["id"] = doc_dict.pop("$id")
                doc_dict.pop("$collectionId", None)
                doc_dict.pop("$databaseId", None)
                doc_dict.pop("$createdAt", None)
                doc_dict.pop("$updatedAt", None)
                doc_dict.pop("$permissions", None)
                plants.append(Plant(**doc_dict))
            return plants
        except Exception as e:
            logger.error(f"Error fetching plants: {e}")
            return []

    async def get_plant(self, plant_id: str) -> Optional[Plant]:
        """Get a specific plant"""
        try:
            doc = self.databases.get_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.plants_collection_id,
                document_id=plant_id,
            )
            return Plant(**doc)
        except Exception:
            return None

    async def create_plant(self, plant: PlantCreate) -> Plant:
        """Create a new plant"""
        data = plant.model_dump()
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()

        doc = self.databases.create_document(
            database_id=self.settings.appwrite_database_id,
            collection_id=self.settings.plants_collection_id,
            document_id=ID.unique(),
            data=data,
        )

        # Map Appwrite fields ($id, $createdAt, etc.) to our model fields
        result = dict(doc)
        result["id"] = result.pop("$id")
        result.pop("$collectionId", None)
        result.pop("$databaseId", None)
        result.pop("$createdAt", None)
        result.pop("$updatedAt", None)
        result.pop("$permissions", None)

        return Plant(**result)

    async def update_plant(self, plant_id: str, plant: PlantUpdate) -> Optional[Plant]:
        """Update a plant"""
        try:
            data = plant.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.now().isoformat()

            doc = self.databases.update_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.plants_collection_id,
                document_id=plant_id,
                data=data,
            )
            result = dict(doc)
            result["id"] = result.pop("$id")
            result.pop("$collectionId", None)
            result.pop("$databaseId", None)
            result.pop("$createdAt", None)
            result.pop("$updatedAt", None)
            result.pop("$permissions", None)
            return Plant(**result)
        except Exception:
            return None

    async def delete_plant(self, plant_id: str) -> bool:
        """Delete a plant"""
        try:
            self.databases.delete_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.plants_collection_id,
                document_id=plant_id,
            )
            return True
        except Exception:
            return False

    # Ticket validation
    async def validate_ticket(self, barcode: str) -> tuple[bool, Optional[dict[str, Any]]]:
        """Validate a ticket barcode"""
        try:
            result = self.databases.list_documents(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.tickets_collection_id,
                queries=[Query.equal("barcode", barcode)],
            )

            if result["total"] == 0:
                return False, None

            ticket = result["documents"][0]
            # Check if ticket is not expired
            if "expiry_date" in ticket:
                expiry = datetime.fromisoformat(ticket["expiry_date"])
                if expiry < datetime.now():
                    return False, {"message": "Ticket expired"}

            return True, ticket
        except Exception as e:
            print(f"Error validating ticket: {e}")
            return False, None
