"""Tours API router (deprecated - feature removed). Returns 410 Gone for all endpoints."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/tours", tags=["Tours"])


@router.get("")
async def get_tours():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tours feature removed")


@router.get("/{tour_id}")
async def get_tour(tour_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tours feature removed")


@router.post("")
async def create_tour():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tours feature removed")


@router.put("/{tour_id}")
async def update_tour(tour_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tours feature removed")


@router.delete("/{tour_id}")
async def delete_tour(tour_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Tours feature removed")
