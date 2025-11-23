"""Progress tracking and barcode validation API router"""

import logging

from app.config import Settings, get_settings
from app.models import BeaconData, ProgressResponse, BarcodeValidationRequest, \
    BarcodeValidationResponse
from app.services import AppwriteService
from fastapi import APIRouter, Depends, HTTPException, status

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/progress", tags=["Progress & Validation"])


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.post("/calculate", response_model=ProgressResponse)
async def calculate_progress(
    beacon_data: BeaconData,
    service: AppwriteService = Depends(get_appwrite_service),
    settings: Settings = Depends(get_settings),
) -> ProgressResponse:
    """
    Calculate visitor progress based on BLE beacon data.

    This endpoint processes beacon proximity data to determine how far
    a visitor has progressed through the dome exhibits.
    """
    # Validate input
    if not beacon_data.ids or not beacon_data.rssi:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
            detail="Beacon IDs and RSSI values must not be empty"
        )

    if len(beacon_data.ids) != len(beacon_data.rssi):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
            detail="Beacon IDs and RSSI arrays must have the same length"
        )

    # Validate RSSI values are in valid range
    if not all(-100 <= rssi <= 0 for rssi in beacon_data.rssi):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="RSSI values must be between -100 and 0")

    # Simple algorithm: use the number of unique beacons detected and their RSSI
    # In production, this should use a more sophisticated algorithm that considers:
    # - Beacon locations and sequencing
    # - Signal strength thresholds
    # - Historical visitor paths

    unique_beacons = len(set(beacon_data.ids))
    total_beacons = settings.total_beacons
    progress_percentage = min(100.0, (unique_beacons / total_beacons) * 100)

    # Find the nearest beacon (highest RSSI)
    nearest_idx = beacon_data.rssi.index(max(beacon_data.rssi))
    nearest_location = beacon_data.ids[nearest_idx]

    return ProgressResponse(
        progress=progress_percentage,
        nearest_location=nearest_location,
        suggested_next="Continue forward to discover more exhibits",
    )


@router.post("/validate-ticket", response_model=BarcodeValidationResponse)
async def validate_ticket(
    request: BarcodeValidationRequest,
    service: AppwriteService = Depends(get_appwrite_service),
) -> BarcodeValidationResponse:
    """
    Validate a ticket barcode.

    This endpoint checks if a ticket barcode is valid and returns
    ticket details if found.
    """
    is_valid, ticket_data = await service.validate_ticket(request.barcode)

    if not is_valid:
        message = ticket_data.get("message", "Invalid ticket") if ticket_data else "Invalid ticket"
        return BarcodeValidationResponse(valid=False, message=message)

    return BarcodeValidationResponse(
        valid=True,
        ticket_type=ticket_data.get("ticket_type") if ticket_data else None,
        visitor_name=ticket_data.get("visitor_name") if ticket_data else None,
        expiry_date=ticket_data.get("expiry_date") if ticket_data else None,
        message="Ticket is valid",
    )
