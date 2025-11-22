"""Plants API router"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models import Plant, PlantCreate, PlantUpdate
from app.services import AppwriteService
from app.auth import get_current_active_user

router = APIRouter(prefix="/plants", tags=["Plants"])


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.get("", response_model=list[Plant])
async def get_plants(
    limit: int = 100,
    offset: int = 0,
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[Plant]:
    """Get all plants (public endpoint)"""
    return await service.get_plants(limit=limit, offset=offset)


@router.get("/{plant_id}", response_model=Plant)
async def get_plant(
    plant_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
) -> Plant:
    """Get a specific plant (public endpoint)"""
    plant = await service.get_plant(plant_id)
    if not plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return plant


@router.post("", response_model=Plant, status_code=status.HTTP_201_CREATED)
async def create_plant(
    plant: PlantCreate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> Plant:
    """Create a new plant (requires authentication)"""
    return await service.create_plant(plant)


@router.put("/{plant_id}", response_model=Plant)
async def update_plant(
    plant_id: str,
    plant: PlantUpdate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> Plant:
    """Update a plant (requires authentication)"""
    updated_plant = await service.update_plant(plant_id, plant)
    if not updated_plant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
    return updated_plant


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plant(
    plant_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> None:
    """Delete a plant (requires authentication)"""
    success = await service.delete_plant(plant_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")
