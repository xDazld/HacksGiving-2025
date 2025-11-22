"""Cafe Tours API router"""

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models import CafeTour, CafeTourCreate, CafeTourUpdate
from app.services import AppwriteService
from app.auth import get_current_active_user

router = APIRouter(prefix="/cafe-tours", tags=["Cafe Tours"])


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.get("", response_model=list[CafeTour])
async def get_cafe_tours(
    limit: int = 100,
    offset: int = 0,
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[CafeTour]:
    """Get all cafe tours (public endpoint)"""
    return await service.get_cafe_tours(limit=limit, offset=offset)


@router.get("/{tour_id}", response_model=CafeTour)
async def get_cafe_tour(
    tour_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
) -> CafeTour:
    """Get a specific cafe tour (public endpoint)"""
    tour = await service.get_cafe_tour(tour_id)
    if not tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe tour not found")
    return tour


@router.post("", response_model=CafeTour, status_code=status.HTTP_201_CREATED)
async def create_cafe_tour(
    tour: CafeTourCreate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> CafeTour:
    """Create a new cafe tour (requires authentication)"""
    return await service.create_cafe_tour(tour)


@router.put("/{tour_id}", response_model=CafeTour)
async def update_cafe_tour(
    tour_id: str,
    tour: CafeTourUpdate,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> CafeTour:
    """Update a cafe tour (requires authentication)"""
    updated_tour = await service.update_cafe_tour(tour_id, tour)
    if not updated_tour:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe tour not found")
    return updated_tour


@router.delete("/{tour_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cafe_tour(
    tour_id: str,
    service: AppwriteService = Depends(get_appwrite_service),
    _current_user=Depends(get_current_active_user),
) -> None:
    """Delete a cafe tour (requires authentication)"""
    success = await service.delete_cafe_tour(tour_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cafe tour not found")
