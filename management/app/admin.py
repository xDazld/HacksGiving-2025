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

    # Calculate enhanced metrics for better insights
    total_file_size = sum(f.size_original for f in context_files)
    endangered_plants = sum(1 for p in plants if hasattr(p, 'buy_new_wont_survive') and p.buy_new_wont_survive)
    
    return [
        c.Page(
            components=[
                c.Heading(text="🌿 Milwaukee Domes Management Dashboard", level=1),
                c.Paragraph(
                    text="Welcome to the Milwaukee Domes Alliance management interface. This system helps staff and volunteers efficiently manage plant collections, educational content, and visitor experiences."
                ),
                c.Markdown(
                    text="""### 📊 System Overview
                    
This dashboard provides real-time insights into our collections and educational resources. Use the navigation below to manage different aspects of the Milwaukee Domes experience.

**Quick Tips:**
- 🌱 Context Files power our AI-driven tours and educational content
- 🪴 Plant inventory tracks our living collection across all three domes
- 📈 Analytics help us understand visitor engagement and improve experiences
                    """
                ),
                c.Div(
                    components=[
                        c.Heading(text="📈 Collection Metrics", level=2),
                        c.Paragraph(
                            text="Key performance indicators for the Milwaukee Domes collections and educational resources."
                        ),
                        c.Table(
                            data=[
                                MetricValue(metric="📁 Context Files", value=len(context_files)),
                                MetricValue(metric="💾 Total Content Size", value=f"{total_file_size:,} bytes"),
                                MetricValue(metric="🌱 Total Plants", value=analytics.total_plants),
                                MetricValue(metric="⚠️ Endangered Species", value=endangered_plants),
                                MetricValue(metric="👥 Active Visitors (Today)", value=analytics.active_visitors),
                            ],
                            data_model=MetricValue,
                            columns=[
                                DisplayLookup(field="metric", title="Metric"),
                                DisplayLookup(field="value", title="Value"),
                            ],
                            no_data_message="No analytics data available yet. Data will populate as the system is used.",
                        ),
                    ]
                ),
                c.Div(
                    components=[
                        c.Heading(text="🔧 Management Tools", level=2),
                        c.Paragraph(
                            text="Access management interfaces for different system components. Each tool is designed for easy use by staff and volunteers."
                        ),
                        c.LinkList(
                            links=[
                                c.Link(
                                    components=[
                                        c.Text(text="📁 Context Files Manager"),
                                        c.Paragraph(
                                            text="Upload and manage educational content files used for AI-powered tours and visitor experiences."
                                        ),
                                    ],
                                    on_click=GoToEvent(url="/admin/context-files"),
                                ),
                                c.Link(
                                    components=[
                                        c.Text(text="🌿 Plant Inventory"),
                                        c.Paragraph(
                                            text="Maintain comprehensive records of our living plant collection across Desert, Tropical, and Show Domes."
                                        ),
                                    ],
                                    on_click=GoToEvent(url="/admin/plants"),
                                ),
                                c.Link(
                                    components=[
                                        c.Text(text="📖 API Documentation"),
                                        c.Paragraph(
                                            text="Technical documentation for developers integrating with the Milwaukee Domes API."
                                        ),
                                    ],
                                    on_click=GoToEvent(url="/docs"),
                                ),
                                c.Link(
                                    components=[
                                        c.Text(text="❤️ System Health Check"),
                                        c.Paragraph(
                                            text="Verify system status and connectivity to ensure optimal performance."
                                        ),
                                    ],
                                    on_click=GoToEvent(url="/health"),
                                ),
                            ]
                        ),
                    ]
                ),
                c.Markdown(
                    text="""---

### 💡 Need Help?

- **New Users**: Start with the Plant Inventory to familiarize yourself with the interface
- **Content Upload**: Use Context Files Manager to add educational materials
- **Technical Issues**: Contact IT support or check the health status above
- **Accessibility**: This interface supports keyboard navigation and screen readers

*Built with ❤️ for Milwaukee Domes Alliance | Powered by AI & Human-Centered Design*
                    """
                ),
            ]
        )
    ]


@router.get("/api/admin/context-files", response_model=FastUI, response_model_exclude_none=True)
async def context_files_list(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    files = await service.list_context_files()
    
    # Calculate useful metrics
    total_size = sum(f.size_original for f in files)
    file_types = {}
    for f in files:
        mime = f.mime_type or "unknown"
        file_types[mime] = file_types.get(mime, 0) + 1

    return [
        c.Page(
            components=[
                c.Heading(text="📁 Context Files Manager", level=1),
                c.Paragraph(
                    text="Context files contain domain knowledge, plant descriptions, educational content, and other information used to power AI-generated tours and visitor experiences. These files help create personalized, engaging interactions for guests."
                ),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="⬆️ Upload New File", on_click=GoToEvent(url="/admin/context-files/upload")),
                c.Markdown(
                    text=f"""### 📊 Collection Summary

- **Total Files**: {len(files)}
- **Total Storage**: {total_size:,} bytes ({total_size / (1024*1024):.2f} MB)
- **File Types**: {', '.join(f'{mime}: {count}' for mime, count in file_types.items()) if file_types else 'None'}

*These files enable personalized, multilingual educational experiences for visitors with diverse backgrounds and interests.*
                    """
                ),
                c.Table(
                    data=files,
                    data_model=ContextFile,
                    columns=[
                        DisplayLookup(field="name", title="📄 File Name"),
                        DisplayLookup(field="mime_type", title="🏷️ Type"),
                        DisplayLookup(field="size_original", title="📦 Size (bytes)"),
                        DisplayLookup(field="created_at", title="📅 Uploaded"),
                    ],
                    no_data_message="📭 No context files uploaded yet. Upload your first file to get started!",
                ),
                c.Paragraph(text="**File Management Actions** - View details or remove files from the collection:"),
                *[
                    c.Div(
                        components=[
                            c.Button(
                                text=f"👁️ View {f.name}", on_click=GoToEvent(url=f"/admin/context-files/{f.id}/view")
                            ),
                            c.Button(
                                text=f"🗑️ Delete {f.name}", on_click=GoToEvent(url=f"/admin/context-files/{f.id}/delete")
                            ),
                        ]
                    )
                    for f in files
                ],
                c.Markdown(
                    text="""---

### 💡 Best Practices

**Supported File Types:**
- **Text** (.txt, .md): Educational content, plant descriptions
- **Data** (.json, .csv): Structured information, plant databases
- **Documents** (.pdf): Guides, brochures, educational materials
- **Images** (.jpg, .png): Plant photos, signage (for future OCR/embedding)

**Tips for Success:**
- Use descriptive filenames (e.g., "desert-dome-cacti-guide.txt")
- Keep files focused on specific topics for better AI responses
- Update content regularly to reflect seasonal changes
- Remove outdated files to maintain quality

**Accessibility**: All uploaded content helps create inclusive experiences for visitors of all backgrounds, languages, and abilities.
                    """
                ),
            ]
        )
    ]


@router.get("/api/admin/context-files/upload", response_model=FastUI, response_model_exclude_none=True)
async def context_file_upload_page() -> list[AnyComponent]:
    # Native FastUI form components (avoids HTML being displayed as literal text)
    # FormFieldFile provides proper multipart encoding automatically.
    upload_form = c.Form(
        submit_url="/api/admin/context-files/upload",
        form_fields=[
            c.FormFieldFile(
                name="file",
                title="📤 Select File to Upload",
                required=True,
                accept=".txt,.md,.json,.csv,.pdf,.png,.jpg,.jpeg",
                description="Choose a file containing educational content, plant information, or other domain knowledge that will enhance visitor experiences.",
            ),
        ],
        # Leave footer empty so default submit button is rendered by FastUI
        footer=None,
    )
    return [
        c.Page(
            components=[
                c.Heading(text="⬆️ Upload Context File", level=1),
                c.Paragraph(
                    text="Add educational content, plant descriptions, or other materials to the system. These files power AI-generated tours, multilingual support, and personalized visitor experiences."
                ),
                c.Markdown(
                    text="""### 📋 Upload Guidelines

**What to Upload:**
- Plant care guides and species information
- Educational materials about ecosystems
- Seasonal exhibit descriptions
- Historical information about the Milwaukee Domes
- Accessibility guides and multilingual content
- Staff training materials

**Supported File Formats:**
- **Text Files** (.txt, .md): Best for plain educational content
- **Structured Data** (.json, .csv): Plant databases, structured information
- **Documents** (.pdf): Scanned guides, brochures, official materials
- **Images** (.jpg, .png): Plant photos, diagrams (future feature)

**File Size**: Maximum 10MB per file  
**Encoding**: UTF-8 recommended for multilingual content
                    """
                ),
                upload_form,
                c.Markdown(
                    text="""---

### ✅ After Upload

Your file will be:
1. **Stored securely** in the cloud-based system
2. **Indexed** for fast AI-powered retrieval
3. **Available immediately** for tour generation
4. **Accessible** to authorized staff members

**Note**: Files containing sensitive information should be reviewed before upload. All content helps create inclusive, educational experiences for visitors.
                    """
                ),
                c.Button(text="← Back to Files", on_click=GoToEvent(url="/admin/context-files")),
            ]
        )
    ]


@router.post("/api/admin/context-files/upload", response_model=FastUI, response_model_exclude_none=True)
async def context_file_upload(
    file: UploadFile = File(...),
    service: AppwriteService = Depends(get_appwrite_service),
):
    try:
        data = await file.read()
        filename = file.filename or "uploaded-context-file"
        await service.upload_context_file(filename=filename, file_bytes=data, mime_type=file.content_type)
        return [c.FireEvent(event=GoToEvent(url="/admin/context-files"))]
    except Exception as e:
        # Return an error page with helpful guidance instead of raw 500
        return [
            c.Page(
                components=[
                    c.Heading(text="⚠️ Upload Error", level=1),
                    c.Markdown(
                        text=f"""### Upload Failed

We encountered an issue while uploading your file.

**Error Details:**
```
{str(e)}
```

**Common Solutions:**
- Verify the file is not corrupted
- Check that file size is under 10MB
- Ensure file format is supported (.txt, .md, .json, .csv, .pdf, .jpg, .png)
- Try uploading again - temporary network issues can occur
- Contact IT support if problem persists

**Troubleshooting Tips:**
- Rename file if it contains special characters
- Try a different file format (e.g., save PDF as .txt)
- Check system status at /health endpoint
                        """
                    ),
                    c.Button(text="← Try Again", on_click=GoToEvent(url="/admin/context-files/upload")),
                    c.Button(text="🏠 Return to Files", on_click=GoToEvent(url="/admin/context-files")),
                ]
            )
        ]


@router.get("/api/admin/context-files/{file_id}/view", response_model=FastUI, response_model_exclude_none=True)
async def context_file_view(
    file_id: str, service: AppwriteService = Depends(get_appwrite_service)
) -> list[AnyComponent]:
    """View context file details"""
    files = await service.list_context_files()
    file = next((f for f in files if f.id == file_id), None)

    if not file:
        return [
            c.Page(
                components=[
                    c.Heading(text="❌ File Not Found", level=1),
                    c.Markdown(
                        text="""### Context File Not Found

The requested file could not be located in the system.

**Possible Reasons:**
- File may have been deleted by another staff member
- File ID may be incorrect
- Temporary storage connectivity issue

**Next Steps:**
- Return to context files list to verify file exists
- Check with colleagues if you're looking for specific content
- Contact system administrator if this seems like an error
                        """
                    ),
                    c.Button(text="← Back to Files", on_click=GoToEvent(url="/admin/context-files")),
                ]
            )
        ]
    
    # Calculate human-readable file size
    size_kb = file.size_original / 1024
    size_mb = size_kb / 1024
    readable_size = f"{size_mb:.2f} MB" if size_mb >= 1 else f"{size_kb:.2f} KB"
    
    # Determine file category
    file_category = "Unknown"
    if file.mime_type:
        if "text" in file.mime_type:
            file_category = "📔 Text Document"
        elif "json" in file.mime_type:
            file_category = "🗃️ Structured Data (JSON)"
        elif "csv" in file.mime_type:
            file_category = "📈 Spreadsheet Data (CSV)"
        elif "pdf" in file.mime_type:
            file_category = "📝 PDF Document"
        elif "image" in file.mime_type:
            file_category = "🖼️ Image File"

    return [
        c.Page(
            components=[
                c.Heading(text=f"👁️ Context File Details: {file.name}", level=1),
                c.Markdown(
                    text=f"""### 📋 File Information

**Basic Details:**
- **File Name**: `{file.name}`
- **Category**: {file_category}
- **MIME Type**: `{file.mime_type or 'Not specified'}`
- **File Size**: {readable_size} ({file.size_original:,} bytes)
- **Uploaded**: {file.created_at.strftime('%B %d, %Y at %I:%M %p') if file.created_at else 'Unknown'}
- **File ID**: `{file.id}`

**Usage:**
This file is part of the AI context corpus used to generate personalized tours, answer visitor questions, and provide educational content. The information in this file helps create engaging, accurate experiences for guests.

**Impact:**
- Powers natural language understanding for mobile app
- Enables multilingual support through translation
- Provides factual foundation for educational content
- Supports accessibility features for diverse audiences
                    """
                ),
                c.Markdown(
                    text="""### 🔧 File Management Actions

**Available Operations:**
                    """
                ),
                c.Button(text="🗑️ Delete This File", on_click=GoToEvent(url=f"/admin/context-files/{file_id}/delete")),
                c.Button(text="← Return to Files List", on_click=GoToEvent(url="/admin/context-files")),
                c.Markdown(
                    text="""---

### ⚠️ Deletion Warning

**Before deleting this file, consider:**
- This action cannot be undone
- AI-generated content may lose accuracy without this context
- Tours relying on this information may be affected
- You can always re-upload the file if needed

**Best Practice**: Review file contents and confirm it's truly outdated or incorrect before deletion.
                    """
                ),
            ]
        )
    ]


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
                c.Heading(text="⚠️ Error Deleting File", level=1),
                c.Markdown(
                    text="""### Deletion Failed

The file could not be removed from the system.

**Possible Reasons:**
- File may have already been deleted
- Storage connectivity issue (temporary)
- Insufficient permissions
- File is currently locked by another operation

**Next Steps:**
1. Refresh the context files list to verify file status
2. Try the deletion operation again
3. Check with system administrator if problem persists
4. Verify you have proper access permissions

**Note**: If the file no longer appears in the list, deletion may have succeeded despite this error message.
                    """
                ),
                c.Button(text="← Back to Files", on_click=GoToEvent(url="/admin/context-files")),
            ]
        )
    ]


@router.get("/api/admin/plants", response_model=FastUI, response_model_exclude_none=True)
async def plants_list(service: AppwriteService = Depends(get_appwrite_service)) -> list[AnyComponent]:
    plants = await service.get_plants()
    
    # Calculate inventory insights
    total_quantity = sum(p.quantity for p in plants)
    dome_breakdown = {}
    for p in plants:
        loc = p.dome_location or "Unspecified"
        dome_breakdown[loc] = dome_breakdown.get(loc, 0) + p.quantity
    
    endangered_count = sum(1 for p in plants if hasattr(p, 'buy_new_wont_survive') and p.buy_new_wont_survive)
    requires_specialist = sum(1 for p in plants if hasattr(p, 'move_requires_consult') and p.move_requires_consult)
    
    return [
        c.Page(
            components=[
                c.Heading(text="🌿 Plant Inventory Management", level=1),
                c.Paragraph(
                    text="Comprehensive plant collection database for the Milwaukee Domes. Track species, locations, care requirements, and conservation status across Desert, Tropical, and Show Domes."
                ),
                c.Button(text="← Back to Dashboard", on_click=BackEvent()),
                c.Button(text="➕ Add New Plant", on_click=GoToEvent(url="/admin/plants/new")),
                c.Markdown(
                    text=f"""### 📊 Inventory Overview

- **Total Species**: {len(plants)} unique entries
- **Total Specimens**: {total_quantity:,} individual plants
- **⚠️ Endangered/Sensitive**: {endangered_count} species requiring special care
- **👨‍🔬 Specialist Consultation Required**: {requires_specialist} species

**Distribution by Location:**
{chr(10).join(f'- **{loc}**: {count} plants' for loc, count in sorted(dome_breakdown.items()))}

*This living collection represents decades of horticultural expertise and conservation efforts. Accurate records ensure proper care and educational value.*
                    """
                ),
                c.Table(
                    data=plants,
                    data_model=Plant,
                    columns=[
                        DisplayLookup(field="common_name", title="🌱 Common Name"),
                        DisplayLookup(field="scientific_name", title="🔬 Scientific Name"),
                        DisplayLookup(field="quantity", title="🔢 Quantity"),
                        DisplayLookup(field="dome_location", title="🏛️ Location"),
                    ],
                    no_data_message="🌱 No plants in database. Add your first plant specimen to begin building the collection!",
                ),
                c.Paragraph(
                    text="**Plant Record Actions** - Edit details, update quantities, or remove entries from the inventory:"
                ),
                *[
                    c.Div(
                        components=[
                            c.Button(
                                text=f"✏️ Edit {p.common_name}",
                                on_click=GoToEvent(url=f"/admin/plants/{p.id}/edit"),
                            ),
                            c.Button(
                                text=f"🗑️ Remove {p.common_name}",
                                on_click=GoToEvent(url=f"/admin/plants/{p.id}/delete"),
                            ),
                        ]
                    )
                    for p in plants
                ],
                c.Markdown(
                    text="""---

### 📝 Plant Management Best Practices

**Data Entry Guidelines:**
- Use complete botanical names for scientific accuracy
- Update quantities during regular inventory checks
- Note special care requirements in the Notes field
- Specify dome location for watering/maintenance schedules

**Conservation Tracking:**
- Mark endangered species for special monitoring
- Flag plants requiring specialist consultation for moves
- Document availability for replacement planning
- Record seasonal changes and growth patterns

**Staff Training:**
- New volunteers should review plant records before tours
- Update information based on horticultural team feedback
- Coordinate with education staff for tour content accuracy

**Accessibility Note**: Detailed plant information enables personalized educational experiences for visitors with different interests and accessibility needs.
                    """
                ),
            ]
        )
    ]


@router.get("/api/admin/plants/new", response_model=FastUI, response_model_exclude_none=True)
async def plant_create_page() -> list[AnyComponent]:
    return [
        c.Page(
            components=[
                c.Heading(text="➕ Add New Plant to Collection", level=1),
                c.Paragraph(
                    text="Enter detailed information about a new plant specimen for the Milwaukee Domes collection. Complete records ensure proper care, accurate educational content, and effective conservation efforts."
                ),
                c.Markdown(
                    text="""### 📝 Field Guide

**Required Information:**
- **Common Name**: The name visitors will recognize (e.g., "Saguaro Cactus")
- **Scientific Name**: Botanical nomenclature for accuracy (e.g., "Carnegiea gigantea")
- **Quantity**: Current number of specimens in the collection

**Optional Details:**
- **Dome Location**: Desert Dome, Tropical Dome, Show Dome, or Storage
- **Notes**: Special care instructions, seasonal information, educational highlights

**Tip**: Include common misspellings or alternative names in Notes to help staff and visitors find information easily.
                    """
                ),
                c.ModelForm(model=PlantFormCreate, submit_url="/api/admin/plants/create"),
                c.Markdown(
                    text="""---

### ✅ After Submission

Your plant record will be:
1. **Added to the inventory** for immediate access
2. **Available to mobile app** for visitor information
3. **Included in tour generation** for AI-powered experiences
4. **Searchable by staff** for maintenance and education

**Data Quality**: Accurate plant information directly improves visitor education and conservation awareness.
                    """
                ),
                c.Button(text="← Cancel & Return to Plants", on_click=GoToEvent(url="/admin/plants")),
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
                    c.Heading(text="⚠️ Error Adding Plant", level=1),
                    c.Markdown(
                        text=f"""### Failed to Add Plant Record

**Error Details:**
```
{str(e)}
```

**Possible Causes:**
- Duplicate plant record (check if this species already exists)
- Invalid data format (verify scientific name follows botanical convention)
- Database connectivity issue (temporary - try again)
- Required fields missing or incorrectly formatted

**Next Steps:**
1. Review the form data for accuracy
2. Check if a similar plant already exists in inventory
3. Try submitting again
4. Contact system administrator if error persists

**Data Validation Tips:**
- Scientific names should be italicized format: *Genus species*
- Quantity must be a positive number
- Use standard dome location names (Desert Dome, Tropical Dome, Show Dome)
                        """
                    ),
                    c.Button(text="← Back to Form", on_click=GoToEvent(url="/admin/plants/new")),
                    c.Button(text="🏠 Return to Inventory", on_click=GoToEvent(url="/admin/plants")),
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
                    c.Heading(text="❌ Plant Not Found", level=1),
                    c.Markdown(
                        text="""### Record Not Found

The requested plant record could not be located in the database.

**Possible Reasons:**
- Plant may have been deleted by another user
- Database ID may be incorrect
- Temporary database connectivity issue

**Next Steps:**
- Return to plant inventory and verify the record exists
- Check with other staff members if you're looking for a specific plant
- Contact system administrator if you believe this is an error
                        """
                    ),
                    c.Button(text="← Back to Plants", on_click=GoToEvent(url="/admin/plants")),
                ]
            )
        ]
    # Pre-populate form with existing data
    initial_data = {
        "common_name": plant.common_name,
        "scientific_name": plant.scientific_name,
        "quantity": plant.quantity,
        "dome_location": plant.dome_location or "",
        "notes": plant.notes or "",
    }

    return [
        c.Page(
            components=[
                c.Heading(text=f"✏️ Edit Plant: {plant.common_name}", level=1),
                c.Paragraph(
                    text=f"Update information for **{plant.common_name}** (*{plant.scientific_name}*). Changes will be immediately available to staff and reflected in visitor experiences."
                ),
                c.Markdown(
                    text=f"""### 📊 Current Record Details

- **Common Name**: {plant.common_name}
- **Scientific Name**: {plant.scientific_name}
- **Current Quantity**: {plant.quantity}
- **Location**: {plant.dome_location or 'Not specified'}
- **Special Notes**: {plant.notes or 'None'}

**Edit Guidelines:**
- Update quantity after inventory checks or plant relocations
- Add seasonal observations to Notes field
- Correct any spelling or scientific name errors
- Update location when plants are moved between domes

*Last updated: {plant.updated_at if hasattr(plant, 'updated_at') and plant.updated_at else 'Unknown'}*
                    """
                ),
                c.ModelForm(
                    model=PlantFormCreate,
                    submit_url=f"/api/admin/plants/{plant_id}/update",
                    initial=initial_data,
                ),
                c.Button(text="🗑️ Delete This Plant", on_click=GoToEvent(url=f"/admin/plants/{plant_id}/delete")),
                c.Button(text="← Cancel & Return to Plants", on_click=GoToEvent(url="/admin/plants")),
                c.Markdown(
                    text="""---

### ⚠️ Important Notes

**Data Integrity:**
- Changes affect mobile app immediately
- Updated information appears in AI-generated tours
- Staff and volunteers rely on this data for educational programs

**Deletion Warning:**
- Deleting a plant removes all associated records
- This action cannot be undone
- Consider setting quantity to 0 instead of deleting if plant may return
                    """
                ),
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
                    c.Heading(text="⚠️ Error Updating Plant", level=1),
                    c.Markdown(
                        text=f"""### Update Failed

We couldn't save your changes to this plant record.

**Error Details:**
```
{str(e)}
```

**Common Issues:**
- Database connectivity problem (temporary - try again)
- Invalid data format (check scientific name and quantity)
- Conflicting changes (another user may have modified this record)
- Required field validation failed

**Recovery Steps:**
1. Verify all required fields are completed
2. Check that quantity is a positive number
3. Ensure scientific name follows proper botanical format
4. Try submitting the form again
5. Contact IT support if problem continues

**Data Safety**: Your original data is preserved. No changes were saved due to this error.
                        """
                    ),
                    c.Button(text="← Back to Edit Form", on_click=GoToEvent(url=f"/admin/plants/{plant_id}/edit")),
                    c.Button(text="🏠 Return to Inventory", on_click=GoToEvent(url="/admin/plants")),
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
                c.Heading(text="⚠️ Error Deleting Plant", level=1),
                c.Markdown(
                    text="""### Deletion Failed

The plant record could not be removed from the inventory.

**Possible Reasons:**
- Plant record may have already been deleted
- Database connectivity issue (temporary)
- Record is referenced by other system components
- Insufficient permissions for deletion

**Recommended Actions:**
1. Return to plant inventory to verify record status
2. **Alternative**: Set quantity to 0 instead of deleting (preserves history)
3. Try deletion again after a moment
4. Contact database administrator if issue continues

**Conservation Note**: For rare or endangered species, consider marking as "temporarily unavailable" rather than deleting to maintain historical records.

**Data Integrity**: If this plant is referenced in tours or educational materials, deletion may affect content quality.
                    """
                ),
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
