"""Scavenger Hunts API router"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models import ScavengerHunt, ScavengerHuntCreate, ScavengerHuntUpdate
from app.services import AppwriteService
from app.auth import get_current_active_user

router = APIRouter(prefix="/scavenger-hunts", tags=["Scavenger Hunts"])


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.get("", response_model=list[ScavengerHunt])
async def get_scavenger_hunts(
    limit: int = 100,
    offset: int = 0,
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[ScavengerHunt]:
    """Get all scavenger hunts (public endpoint)"""
    return await service.get_scavenger_hunts(limit=limit, offset=offset)


@router.get("/{hunt_id}", response_model=ScavengerHunt)
async def get_scavenger_hunt(
    hunt_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
) -> ScavengerHunt:
    """Get a specific scavenger hunt (public endpoint)"""
    hunt = await service.get_scavenger_hunt(hunt_id)
    if not hunt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scavenger hunt not found")
    return hunt


@router.post("", response_model=ScavengerHunt, status_code=status.HTTP_201_CREATED)
async def create_scavenger_hunt(
    hunt: ScavengerHuntCreate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> ScavengerHunt:
    """Create a new scavenger hunt (requires authentication)"""
    return await service.create_scavenger_hunt(hunt)


@router.put("/{hunt_id}", response_model=ScavengerHunt)
async def update_scavenger_hunt(
    hunt_id: str,
    hunt: ScavengerHuntUpdate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> ScavengerHunt:
    """Update a scavenger hunt (requires authentication)"""
    updated_hunt = await service.update_scavenger_hunt(hunt_id, hunt)
    if not updated_hunt:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scavenger hunt not found")
    return updated_hunt


@router.delete("/{hunt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scavenger_hunt(
    hunt_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> None:
    """Delete a scavenger hunt (requires authentication)"""
    success = await service.delete_scavenger_hunt(hunt_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Scavenger hunt not found")
