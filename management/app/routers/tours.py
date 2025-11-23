"""Tours API router"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models import Tour, TourCreate, TourUpdate
from app.services import AppwriteService
from app.auth import get_current_active_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/tours", tags=["Tours"])


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.get("", response_model=list[Tour])
async def get_tours(
    limit: int = 100,
    offset: int = 0,
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[Tour]:
    """Get all tours (public endpoint)"""
    return await service.get_tours(limit=limit, offset=offset)


@router.get("/{tour_id}", response_model=Tour)
async def get_tour(
    tour_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
) -> Tour:
    """Get a specific tour (public endpoint)"""
    tour = await service.get_tour(tour_id)
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    return tour


@router.post("", response_model=Tour, status_code=status.HTTP_201_CREATED)
async def create_tour(
    tour: TourCreate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> Tour:
    """Create a new tour (requires authentication)"""
    return await service.create_tour(tour)


@router.put("/{tour_id}", response_model=Tour)
async def update_tour(
    tour_id: str,
    tour: TourUpdate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> Tour:
    """Update a tour (requires authentication)"""
    updated_tour = await service.update_tour(tour_id, tour)
    if not updated_tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
    return updated_tour


@router.delete("/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tour(
    tour_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> None:
    """Delete a tour (requires authentication)"""
    success = await service.delete_tour(tour_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tour not found")
