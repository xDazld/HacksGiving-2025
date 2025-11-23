"""Appwrite service for database and authentication operations

Note: We use the Databases API (legacy documents API) because the Python SDK 6.0.0
does not yet support the newer TablesDB API. The deprecation warnings come from the
Appwrite server, not the SDK. The API is fully functional and supported.
"""

import warnings
import json
from datetime import datetime
from typing import Optional, Any
from appwrite.client import Client
from appwrite.services.databases import Databases
from appwrite.services.storage import Storage
from appwrite.services.users import Users
from appwrite.query import Query
from appwrite.id import ID

# Suppress Appwrite SDK deprecation warnings since TablesDB is not yet available in Python SDK
warnings.filterwarnings("ignore", message="Call to deprecated function")

from app.config import Settings
from app.models import (
    Tour,
    TourCreate,
    TourUpdate,
    ScavengerHunt,
    ScavengerHuntCreate,
    ScavengerHuntUpdate,
    CafeTour,
    CafeTourCreate,
    CafeTourUpdate,
    Plant,
    PlantCreate,
    PlantUpdate,
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

    # Tours
    async def get_tours(self, limit: int = 100, offset: int = 0) -> list[Tour]:
        """Get all tours"""
        try:
            result = self.databases.list_documents(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.tours_collection_id,
                queries=[Query.limit(limit), Query.offset(offset)],
            )
            tours = []
            for doc in result["documents"]:
                doc_dict = dict(doc)
                doc_dict["id"] = doc_dict.pop("$id")
                doc_dict.pop("$collectionId", None)
                doc_dict.pop("$databaseId", None)
                doc_dict.pop("$createdAt", None)
                doc_dict.pop("$updatedAt", None)
                doc_dict.pop("$permissions", None)
                # Deserialize parts if needed
                if "parts" in doc_dict and isinstance(doc_dict["parts"], str):
                    doc_dict["parts"] = json.loads(doc_dict["parts"])
                tours.append(Tour(**doc_dict))
            return tours
        except Exception:
            return []

    async def get_tour(self, tour_id: str) -> Optional[Tour]:
        """Get a specific tour"""
        try:
            doc = self.databases.get_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.tours_collection_id,
                document_id=tour_id,
            )
            return Tour(**doc)
        except Exception:
            return None

    async def create_tour(self, tour: TourCreate) -> Tour:
        """Create a new tour"""
        data = tour.model_dump()
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()

        # Serialize parts array to JSON string for Appwrite
        if "parts" in data:
            data["parts"] = json.dumps(data["parts"])

        doc = self.databases.create_document(
            database_id=self.settings.appwrite_database_id,
            collection_id=self.settings.tours_collection_id,
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

        # Deserialize parts back to list for response
        if "parts" in result and isinstance(result["parts"], str):
            result["parts"] = json.loads(result["parts"])
        return Tour(**result)

    async def update_tour(self, tour_id: str, tour: TourUpdate) -> Optional[Tour]:
        """Update a tour"""
        try:
            data = tour.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.now().isoformat()

            doc = self.databases.update_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.tours_collection_id,
                document_id=tour_id,
                data=data,
            )
            return Tour(**doc)
        except Exception:
            return None

    async def delete_tour(self, tour_id: str) -> bool:
        """Delete a tour"""
        try:
            self.databases.delete_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.tours_collection_id,
                document_id=tour_id,
            )
            return True
        except Exception:
            return False

    # Scavenger Hunts
    async def get_scavenger_hunts(self, limit: int = 100, offset: int = 0) -> list[ScavengerHunt]:
        """Get all scavenger hunts"""
        try:
            result = self.databases.list_documents(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.scavenger_hunts_collection_id,
                queries=[Query.limit(limit), Query.offset(offset)],
            )
            hunts = []
            for doc in result["documents"]:
                doc_dict = dict(doc)
                doc_dict["id"] = doc_dict.pop("$id")
                doc_dict.pop("$collectionId", None)
                doc_dict.pop("$databaseId", None)
                doc_dict.pop("$createdAt", None)
                doc_dict.pop("$updatedAt", None)
                doc_dict.pop("$permissions", None)
                if "items" in doc_dict and isinstance(doc_dict["items"], str):
                    doc_dict["items"] = json.loads(doc_dict["items"])
                hunts.append(ScavengerHunt(**doc_dict))
            return hunts
        except Exception:
            return []

    async def get_scavenger_hunt(self, hunt_id: str) -> Optional[ScavengerHunt]:
        """Get a specific scavenger hunt"""
        try:
            doc = self.databases.get_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.scavenger_hunts_collection_id,
                document_id=hunt_id,
            )
            return ScavengerHunt(**doc)
        except Exception:
            return None

    async def create_scavenger_hunt(self, hunt: ScavengerHuntCreate) -> ScavengerHunt:
        """Create a new scavenger hunt"""
        data = hunt.model_dump()
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()

        # Serialize items array to JSON string for Appwrite
        if "items" in data:
            data["items"] = json.dumps(data["items"])

        doc = self.databases.create_document(
            database_id=self.settings.appwrite_database_id,
            collection_id=self.settings.scavenger_hunts_collection_id,
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

        # Deserialize items back to list for response
        if "items" in result and isinstance(result["items"], str):
            result["items"] = json.loads(result["items"])
        return ScavengerHunt(**result)

    async def update_scavenger_hunt(self, hunt_id: str, hunt: ScavengerHuntUpdate) -> Optional[ScavengerHunt]:
        """Update a scavenger hunt"""
        try:
            data = hunt.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.now().isoformat()

            doc = self.databases.update_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.scavenger_hunts_collection_id,
                document_id=hunt_id,
                data=data,
            )
            return ScavengerHunt(**doc)
        except Exception:
            return None

    async def delete_scavenger_hunt(self, hunt_id: str) -> bool:
        """Delete a scavenger hunt"""
        try:
            self.databases.delete_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.scavenger_hunts_collection_id,
                document_id=hunt_id,
            )
            return True
        except Exception:
            return False

    # Cafe Tours
    async def get_cafe_tours(self, limit: int = 100, offset: int = 0) -> list[CafeTour]:
        """Get all cafe tours"""
        try:
            result = self.databases.list_documents(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.cafe_tours_collection_id,
                queries=[Query.limit(limit), Query.offset(offset)],
            )
            return [CafeTour(**doc) for doc in result["documents"]]
        except Exception:
            return []

    async def get_cafe_tour(self, tour_id: str) -> Optional[CafeTour]:
        """Get a specific cafe tour"""
        try:
            doc = self.databases.get_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.cafe_tours_collection_id,
                document_id=tour_id,
            )
            return CafeTour(**doc)
        except Exception:
            return None

    async def create_cafe_tour(self, tour: CafeTourCreate) -> CafeTour:
        """Create a new cafe tour"""
        data = tour.model_dump()
        data["created_at"] = datetime.now().isoformat()
        data["updated_at"] = datetime.now().isoformat()

        doc = self.databases.create_document(
            database_id=self.settings.appwrite_database_id,
            collection_id=self.settings.cafe_tours_collection_id,
            document_id=ID.unique(),
            data=data,
        )
        return CafeTour(**doc)

    async def update_cafe_tour(self, tour_id: str, tour: CafeTourUpdate) -> Optional[CafeTour]:
        """Update a cafe tour"""
        try:
            data = tour.model_dump(exclude_unset=True)
            data["updated_at"] = datetime.now().isoformat()

            doc = self.databases.update_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.cafe_tours_collection_id,
                document_id=tour_id,
                data=data,
            )
            return CafeTour(**doc)
        except Exception:
            return None

    async def delete_cafe_tour(self, tour_id: str) -> bool:
        """Delete a cafe tour"""
        try:
            self.databases.delete_document(
                database_id=self.settings.appwrite_database_id,
                collection_id=self.settings.cafe_tours_collection_id,
                document_id=tour_id,
            )
            return True
        except Exception:
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
        except Exception:
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
            return Plant(**doc)
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
