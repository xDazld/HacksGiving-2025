"""Admin interface using FastUI (tours & hunts removed; context files + plants remain)"""

from typing import Annotated
from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel, Field
from fastapi.responses import HTMLResponse
from fastui import FastUI, AnyComponent, prebuilt_html, components as c
from fastui.components.display import DisplayLookup
from fastui.events import GoToEvent, BackEvent
from fastui.forms import fastui_form

from app.config import Settings, get_settings
from app.models import (
    Plant,
    PlantCreate,
    AnalyticsOverview,
    ContextFile,
)
from app.services import AppwriteService

router = APIRouter()


class MetricValue(BaseModel):
    metric: str
    value: int | float | str


class PlantFormCreate(BaseModel):
    """Plant creation/update form"""

    common_name: str = Field(description="Common name")
    scientific_name: str = Field(description="Scientific name")
    quantity: int = Field(ge=0, default=1, description="Quantity")
    dome_location: str = Field(default="", description="Dome location (e.g., Desert, Tropical, Show)")
    notes: str = Field(default="", description="Additional notes")


def get_appwrite_service(settings: Settings = Depends(get_settings)) -> AppwriteService:
    return AppwriteService(settings)


@router.get("/api/admin", response_model=FastUI, response_model_exclude_none=True)
async def admin_home(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    plants = await service.get_plants(limit=10)
    context_files = await service.list_context_files()

    analytics = AnalyticsOverview(
        total_tours=0,
        total_scavenger_hunts=0,
        total_plants=len(plants),
        active_visitors=0,
        today_visitors=0,
        avg_completion_rate=0.0,
    )

    return [
        c.Page(
            components=[
                c.Heading(text="Milwaukee Domes Management Dashboard", level=1),
                c.Paragraph(text="Manage uploaded context files for LLM generation and maintain plant records."),
                c.Div(
                    components=[
                        c.Heading(text="Quick Stats", level=2),
                        c.Table(
                            data=[
                                MetricValue(metric="Context Files", value=len(context_files)),
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
                                    components=[c.Text(text="Context Files")],
                                    on_click=GoToEvent(url="/admin/context-files"),
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


@router.get("/api/admin/context-files", response_model=FastUI, response_model_exclude_none=True)
async def context_files_list(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    files = await service.list_context_files()
    return [
        c.Page(
            components=[
                c.Heading(text="Context Files", level=1),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="Upload New File", on_click=GoToEvent(url="/admin/context-files/upload")),
                c.Button(text="Simple Upload Form", on_click=GoToEvent(url="/admin/context-files/upload-direct")),
                c.Table(
                    data=files,
                    data_model=ContextFile,
                    columns=[
                        DisplayLookup(field="name", title="Name"),
                        DisplayLookup(field="mime_type", title="MIME Type"),
                        DisplayLookup(field="size_original", title="Size"),
                        DisplayLookup(field="id", title="ID"),
                    ],
                    no_data_message="No context files uploaded",
                ),
            ]
        )
    ]


@router.get("/api/admin/context-files/upload", response_model=FastUI, response_model_exclude_none=True)
async def context_file_upload_page() -> list[AnyComponent]:
    return [
        c.Page(
            components=[
                c.Heading(text="Upload Context File", level=1),
                c.Paragraph(text="Select a file and upload it. Supported: text, JSON, images (used for LLM context)."),
                c.Markdown(
                    text="""
<form action="/api/admin/context-files/upload" method="post" enctype="multipart/form-data" style="margin:1rem 0;">
    <input type="file" name="file" required />
    <button type="submit">Upload</button>
</form>
"""
                ),
                c.Button(text="← Back to Files", on_click=GoToEvent(url="/admin/context-files")),
            ]
        )
    ]


@router.get("/admin/context-files/upload-direct")
async def context_files_upload_direct() -> HTMLResponse:
    """Direct HTML form upload page (bypasses FastUI form limitations for file inputs)."""
    html = """
        <!DOCTYPE html>
        <html><head><title>Upload Context File</title></head>
        <body style='font-family:system-ui;max-width:640px;margin:2rem auto;'>
            <h1>Upload Context File</h1>
            <p>Use this simple form to upload a file for LLM context generation.</p>
            <form action="/api/admin/context-files/upload" method="post" enctype="multipart/form-data" style="margin:1rem 0;">
                <input type="file" name="file" required />
                <button type="submit">Upload</button>
            </form>
            <p><a href="/admin/context-files">Back to Context Files</a></p>
        </body></html>
        """
    return HTMLResponse(html)


@router.post("/api/admin/context-files/upload", response_model=FastUI, response_model_exclude_none=True)
async def context_file_upload(
    file: UploadFile = File(...),
    service: AppwriteService = Depends(get_appwrite_service),
):
    data = await file.read()
    created = await service.upload_context_file(
        filename=file.filename or "upload", file_bytes=data, mime_type=file.content_type
    )
    # Return FastUI event redirect
    return [c.FireEvent(event=GoToEvent(url="/admin/context-files"))]


@router.get("/api/admin/context-files/{file_id}/delete", response_model=FastUI, response_model_exclude_none=True)
async def context_file_delete(
    file_id: str, service: AppwriteService = Depends(get_appwrite_service)
) -> list[AnyComponent]:
    ok = await service.delete_context_file(file_id)
    if ok:
        return [c.FireEvent(event=GoToEvent(url="/admin/context-files"))]
    return [
        c.Page(
            components=[
                c.Heading(text="Error Deleting File", level=1),
                c.Button(text="← Back", on_click=GoToEvent(url="/admin/context-files")),
            ]
        )
    ]


@router.get("/api/admin/plants", response_model=FastUI, response_model_exclude_none=True)
async def plants_list(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
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
                c.Heading(text="Plant Actions", level=2),
                c.Div(
                    components=[
                        c.LinkList(
                            links=[
                                c.Link(
                                    components=[c.Text(text=f"✏️ Edit {p.common_name}")],
                                    on_click=GoToEvent(url=f"/admin/plants/{p.id}/edit"),
                                )
                                for p in plants
                            ]
                            + [
                                c.Link(
                                    components=[c.Text(text=f"🗑 Delete {p.common_name}")],
                                    on_click=GoToEvent(url=f"/admin/plants/{p.id}/delete"),
                                )
                                for p in plants
                            ],
                        )
                    ]
                ),
            ]
        )
    ]


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
    try:
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
                    c.Text(text=f"Failed to add plant: {e}"),
                    c.Button(text="← Back to Form", on_click=GoToEvent(url="/admin/plants/new")),
                ]
            )
        ]


@router.get("/api/admin/plants/{plant_id}/edit", response_model=FastUI, response_model_exclude_none=True)
async def plant_edit_page(
    plant_id: str, service: AppwriteService = Depends(get_appwrite_service)
) -> list[AnyComponent]:
    plant = await service.get_plant(plant_id)
    if not plant:
        return [
            c.Page(
                components=[
                    c.Heading(text="Plant Not Found", level=1),
                    c.Button(text="← Back to Plants", on_click=GoToEvent(url="/admin/plants")),
                ]
            )
        ]

    # Dynamic model with defaults for prefill
    class PlantFormPrefill(BaseModel):
        common_name: str = Field(default=plant.common_name)
        scientific_name: str = Field(default=plant.scientific_name)
        quantity: int = Field(default=plant.quantity, ge=0)
        dome_location: str = Field(default=plant.dome_location or "")
        notes: str = Field(default=plant.notes or "")

    return [
        c.Page(
            components=[
                c.Heading(text=f"Edit Plant: {plant.common_name}", level=1),
                c.Text(text="Update the fields and submit."),
                c.ModelForm(model=PlantFormPrefill, submit_url=f"/api/admin/plants/{plant_id}/update"),
                c.Button(text="Delete Plant", on_click=GoToEvent(url=f"/admin/plants/{plant_id}/delete")),
                c.Button(text="← Back to Plants", on_click=GoToEvent(url="/admin/plants")),
            ]
        )
    ]


@router.post("/api/admin/plants/{plant_id}/update", response_model=FastUI, response_model_exclude_none=True)
async def plant_update(
    plant_id: str,
    form: Annotated[PlantFormCreate, fastui_form(PlantFormCreate)],
    service: AppwriteService = Depends(get_appwrite_service),
) -> list[AnyComponent]:
    try:
        from app.models import PlantUpdate  # local import to avoid circular

        update = PlantUpdate(
            common_name=form.common_name,
            scientific_name=form.scientific_name,
            quantity=form.quantity,
            dome_location=form.dome_location or None,
            notes=form.notes or None,
        )
        await service.update_plant(plant_id, update)
        return [c.FireEvent(event=GoToEvent(url="/admin/plants"))]
    except Exception as e:
        return [
            c.Page(
                components=[
                    c.Heading(text="Error Updating Plant", level=1),
                    c.Text(text=f"Failed to update plant: {e}"),
                    c.Button(text="← Back", on_click=GoToEvent(url=f"/admin/plants/{plant_id}/edit")),
                ]
            )
        ]


@router.get("/api/admin/plants/{plant_id}/delete", response_model=FastUI, response_model_exclude_none=True)
async def plant_delete(plant_id: str, service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    ok = await service.delete_plant(plant_id)
    if ok:
        return [c.FireEvent(event=GoToEvent(url="/admin/plants"))]
    return [
        c.Page(
            components=[
                c.Heading(text="Error Deleting Plant", level=1),
                c.Button(text="← Back to Plants", on_click=GoToEvent(url="/admin/plants")),
            ]
        )
    ]


# Trailing-slash variants
@router.get("/api/admin/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def admin_home_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await admin_home(service)


@router.get(
    "/api/admin/context-files/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False
)
async def context_files_list_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await context_files_list(service)


@router.get("/api/admin/plants/", response_model=FastUI, response_model_exclude_none=True, include_in_schema=False)
async def plants_list_slash(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    return await plants_list(service)


@router.get("/admin/{path:path}")
async def html_landing() -> HTMLResponse:
    return HTMLResponse(prebuilt_html(title="Milwaukee Domes Admin"))
