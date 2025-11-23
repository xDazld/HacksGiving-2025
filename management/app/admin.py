"""Admin interface using FastUI"""

from typing import Annotated
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from fastapi.responses import HTMLResponse
from fastui import FastUI, AnyComponent, prebuilt_html, components as c
from fastui.components.display import DisplayLookup
from fastui.events import GoToEvent, BackEvent
from fastui.forms import fastui_form

from app.config import Settings, get_settings
from app.models import (
    Tour,
    TourCreate,
    ScavengerHunt,
    ScavengerHuntCreate,
    Plant,
    PlantCreate,
    AnalyticsOverview,
)
from app.services import AppwriteService
# from app.auth import get_current_active_user, User  # Removed unused imports

router = APIRouter()


class MetricValue(BaseModel):
    metric: str
    value: int | float | str


# Simplified form models (FastUI doesn't fully support array fields)
class TourFormCreate(BaseModel):
    """Simplified tour creation form"""

    title: str = Field(min_length=1, max_length=200, description="Tour title")
    description: str = Field(description="Tour description")


class ScavengerHuntFormCreate(BaseModel):
    """Simplified scavenger hunt creation form"""

    title: str = Field(min_length=1, max_length=200, description="Hunt title")
    description: str = Field(description="Hunt description")
    difficulty: str = Field(default="medium", description="Difficulty level (easy/medium/hard)")


class PlantFormCreate(BaseModel):
    """Plant creation form"""

    common_name: str = Field(description="Common name")
    scientific_name: str = Field(description="Scientific name")
    quantity: int = Field(ge=0, default=1, description="Quantity")
    dome_location: str = Field(default="", description="Dome location (e.g., Desert, Tropical, Show)")
    notes: str = Field(default="", description="Additional notes")


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    """Get Appwrite service instance"""
    return AppwriteService(settings)


@router.get("/api/admin", response_model=FastUI, response_model_exclude_none=True)
async def admin_home(
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """Admin dashboard home"""
    # Get basic analytics
    tours = await service.get_tours(limit=10)
    scavenger_hunts = await service.get_scavenger_hunts(limit=10)
    plants = await service.get_plants(limit=10)

    analytics = AnalyticsOverview(
        total_tours=len(tours),
        total_scavenger_hunts=len(scavenger_hunts),
        total_plants=len(plants),
        active_visitors=0,  # Would come from real-time tracking
        today_visitors=0,  # Would come from analytics service
        avg_completion_rate=0.0,  # Would come from analytics service
    )

    return [
        c.Page(
            components=[
                c.Heading(text="Milwaukee Domes Management Dashboard", level=1),
                c.Paragraph(text="Welcome to the admin interface for managing tours, plants, and visitor experiences."),
                c.Div(
                    components=[
                        c.Heading(text="Quick Stats", level=2),
                        c.Table(
                            data=[
                                MetricValue(metric="Total Tours", value=analytics.total_tours),
                                MetricValue(metric="Total Scavenger Hunts", value=analytics.total_scavenger_hunts),
                                MetricValue(metric="Total Plants", value=analytics.total_plants),
                                MetricValue(metric="Active Visitors", value=analytics.active_visitors),
                            ],
                            data_model=MetricValue,
                            columns=[
                                DisplayLookup(field="metric", title="Metric"),
                                DisplayLookup(field="value", title="Value"),
                            ],
                            no_data_message="No analytics data yet",
                        ),
                    ]
                ),
                c.Div(
                    components=[
                        c.Heading(text="Management", level=2),
                        c.LinkList(
                            links=[
                                c.Link(
                                    components=[c.Text(text="Manage Tours")],
                                    on_click=GoToEvent(url="/admin/tours"),
                                ),
                                c.Link(
                                    components=[c.Text(text="Manage Scavenger Hunts")],
                                    on_click=GoToEvent(url="/admin/scavenger-hunts"),
                                ),
                                c.Link(
                                    components=[c.Text(text="Manage Plants")],
                                    on_click=GoToEvent(url="/admin/plants"),
                                ),
                                c.Link(
                                    components=[c.Text(text="View API Documentation")],
                                    on_click=GoToEvent(url="/docs"),
                                ),
                            ]
                        ),
                    ]
                ),
            ]
        )
    ]


@router.get("/api/admin/tours", response_model=FastUI, response_model_exclude_none=True)
async def tours_list(
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """List all tours"""
    tours = await service.get_tours()

    return [
        c.Page(
            components=[
                c.Heading(text="Tours Management", level=1),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="Create New Tour", on_click=GoToEvent(url="/admin/tours/new")),
                c.Table(
                    data=tours,
                    data_model=Tour,
                    columns=[
                        DisplayLookup(field="title", title="Title"),
                        DisplayLookup(field="description", title="Description"),
                        DisplayLookup(field="id", title="ID"),
                    ],
                    no_data_message="No tours found",
                ),
            ]
        )
    ]


@router.get("/api/admin/scavenger-hunts", response_model=FastUI, response_model_exclude_none=True)
async def scavenger_hunts_list(
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """List all scavenger hunts"""
    hunts = await service.get_scavenger_hunts()

    return [
        c.Page(
            components=[
                c.Heading(text="Scavenger Hunts Management", level=1),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="Create New Hunt", on_click=GoToEvent(url="/admin/scavenger-hunts/new")),
                c.Table(
                    data=hunts,
                    data_model=ScavengerHunt,
                    columns=[
                        DisplayLookup(field="title", title="Title"),
                        DisplayLookup(field="description", title="Description"),
                        DisplayLookup(field="difficulty", title="Difficulty"),
                        DisplayLookup(field="id", title="ID"),
                    ],
                    no_data_message="No hunts found",
                ),
            ]
        )
    ]


@router.get("/api/admin/plants", response_model=FastUI, response_model_exclude_none=True)
async def plants_list(
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """List all plants"""
    plants = await service.get_plants()

    return [
        c.Page(
            components=[
                c.Heading(text="Plants Management", level=1),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="Add New Plant", on_click=GoToEvent(url="/admin/plants/new")),
                c.Table(
                    data=plants,
                    data_model=Plant,
                    columns=[
                        DisplayLookup(field="common_name", title="Common Name"),
                        DisplayLookup(field="scientific_name", title="Scientific Name"),
                        DisplayLookup(field="quantity", title="Quantity"),
                        DisplayLookup(field="dome_location", title="Location"),
                        DisplayLookup(field="id", title="ID"),
                    ],
                    no_data_message="No plants found",
                ),
            ]
        )
    ]


# Provide trailing-slash variants for FastUI JS fetches that may append '/'
@router.get("/api/admin/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def admin_home_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await admin_home(service)


@router.get("/api/admin/tours/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def tours_list_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await tours_list(service)


@router.get(
    "/api/admin/scavenger-hunts/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False
)
async def scavenger_hunts_list_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await scavenger_hunts_list(service)


@router.get("/api/admin/plants/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def plants_list_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await plants_list(service)


# --- Creation Pages (placeholders to eliminate 404s from "Create New" buttons) ---
@router.get("/api/admin/tours/new", response_model=FastUI, response_model_exclude_none=True)
async def tour_create_page() -> list[AnyComponent]:
    return [
        c.Page(
            components=[
                c.Heading(text="Create New Tour", level=1),
                c.Paragraph(text="Note: Parts/sections can be added after creation via the API."),
                c.ModelForm(model=TourFormCreate, submit_url="/api/admin/tours/create"),
                c.Button(text="← Back to Tours", on_click=GoToEvent(url="/admin/tours")),
            ]
        )
    ]


@router.post("/api/admin/tours/create", response_model=FastUI, response_model_exclude_none=True)
async def tour_create(
    form: Annotated[TourFormCreate, fastui_form(TourFormCreate)],
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """Create a new tour"""
    try:
        # Convert form to TourCreate with empty parts list
        tour_data = TourCreate(title=form.title, description=form.description, parts=[])
        await service.create_tour(tour_data)
        return [c.FireEvent(event=GoToEvent(url="/admin/tours"))]
    except Exception as e:
        return [
            c.Page(
                components=[
                    c.Heading(text="Error Creating Tour", level=1),
                    c.Text(text=f"Failed to create tour: {str(e)}"),
                    c.Button(text="← Back to Form", on_click=GoToEvent(url="/admin/tours/new")),
                ]
            )
        ]


@router.get("/api/admin/tours/new/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def tour_create_page_slash() -> list[AnyComponent]:
    return await tour_create_page()


@router.get("/api/admin/scavenger-hunts/new", response_model=FastUI, response_model_exclude_none=True)
async def scavenger_hunt_create_page() -> list[AnyComponent]:
    return [
        c.Page(
            components=[
                c.Heading(text="Create New Scavenger Hunt", level=1),
                c.Paragraph(text="Note: Items can be added after creation via the API."),
                c.ModelForm(model=ScavengerHuntFormCreate, submit_url="/api/admin/scavenger-hunts/create"),
                c.Button(text="← Back to Hunts", on_click=GoToEvent(url="/admin/scavenger-hunts")),
            ]
        )
    ]


@router.post("/api/admin/scavenger-hunts/create", response_model=FastUI, response_model_exclude_none=True)
async def scavenger_hunt_create(
    form: Annotated[ScavengerHuntFormCreate, fastui_form(ScavengerHuntFormCreate)],
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """Create a new scavenger hunt"""
    try:
        # Convert form to ScavengerHuntCreate with empty items list
        hunt_data = ScavengerHuntCreate(
            title=form.title, description=form.description, difficulty=form.difficulty, items=[]
        )
        await service.create_scavenger_hunt(hunt_data)
        return [c.FireEvent(event=GoToEvent(url="/admin/scavenger-hunts"))]
    except Exception as e:
        return [
            c.Page(
                components=[
                    c.Heading(text="Error Creating Scavenger Hunt", level=1),
                    c.Text(text=f"Failed to create hunt: {str(e)}"),
                    c.Button(text="← Back to Form", on_click=GoToEvent(url="/admin/scavenger-hunts/new")),
                ]
            )
        ]


@router.get(
    "/api/admin/scavenger-hunts/new/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False
)
async def scavenger_hunt_create_page_slash() -> list[AnyComponent]:
    return await scavenger_hunt_create_page()


@router.get("/api/admin/plants/new", response_model=FastUI, response_model_exclude_none=True)
async def plant_create_page() -> list[AnyComponent]:
    return [
        c.Page(
            components=[
                c.Heading(text="Add New Plant", level=1),
                c.ModelForm(model=PlantFormCreate, submit_url="/api/admin/plants/create"),
                c.Button(text="← Back to Plants", on_click=GoToEvent(url="/admin/plants")),
            ]
        )
    ]


@router.post("/api/admin/plants/create", response_model=FastUI, response_model_exclude_none=True)
async def plant_create(
    form: Annotated[PlantFormCreate, fastui_form(PlantFormCreate)],
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    """Create a new plant"""
    try:
        # Convert form to PlantCreate with all fields
        plant_data = PlantCreate(
            common_name=form.common_name,
            scientific_name=form.scientific_name,
            quantity=form.quantity,
            dome_location=form.dome_location or None,
            notes=form.notes or None,
        )
        await service.create_plant(plant_data)
        return [c.FireEvent(event=GoToEvent(url="/admin/plants"))]
    except Exception as e:
        return [
            c.Page(
                components=[
                    c.Heading(text="Error Adding Plant", level=1),
                    c.Text(text=f"Failed to add plant: {str(e)}"),
                    c.Button(text="← Back to Form", on_click=GoToEvent(url="/admin/plants/new")),
                ]
            )
        ]


@router.get("/api/admin/plants/new/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def plant_create_page_slash() -> list[AnyComponent]:
    return await plant_create_page()


@router.get("/admin/{path:path}")
async def html_landing() -> HTMLResponse:
    """Serve the FastUI HTML page for the admin interface"""
    return HTMLResponse(prebuilt_html(title="Milwaukee Domes Admin"))
