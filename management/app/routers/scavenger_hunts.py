"""Scavenger Hunts API router (deprecated - feature removed). Returns 410 Gone for all endpoints."""

from fastapi import APIRouter, HTTPException, status

router = APIRouter(prefix="/scavenger-hunts", tags=["Scavenger Hunts"])


@router.get("")
async def get_scavenger_hunts():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Scavenger hunts feature removed")


@router.get("/{hunt_id}")
async def get_scavenger_hunt(hunt_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Scavenger hunts feature removed")


@router.post("")
async def create_scavenger_hunt():
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Scavenger hunts feature removed")


@router.put("/{hunt_id}")
async def update_scavenger_hunt(hunt_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Scavenger hunts feature removed")


@router.delete("/{hunt_id}")
async def delete_scavenger_hunt(hunt_id: str):
    raise HTTPException(status_code=status.HTTP_410_GONE, detail="Scavenger hunts feature removed")
