"""Script to initialize Appwrite database with sample data"""

import asyncio
import csv
from pathlib import Path

from app.config import get_settings
from app.services import AppwriteService
from app.models import PlantCreate, TourCreate, TourPart, ScavengerHuntCreate, ScavengerHuntItem


async def load_plants_from_csv():
    """Load plants from CSV file"""
    settings = get_settings()
    service = AppwriteService(settings)

    csv_path = Path(__file__).parent.parent / "Plants_Formatted.csv"
    if not csv_path.exists():
        print(f"CSV file not found at {csv_path}")
        return

    print(f"Loading plants from {csv_path}...")
    plants_added = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                # Parse boolean fields
                buy_new_wont_survive = bool(row.get("Buy New & Won't Survive/Not Worth Moving", "").strip())
                buy_new_available = bool(row.get("Buy New & Readily Available", "").strip())
                move_by_staff = bool(row.get("Move It & Can be done by Domes staff", "").strip())
                move_requires_consult = bool(row.get("Move It & Requires consult - might not survive move", "").strip())

                plant = PlantCreate(
                    common_name=row["Common Name"].strip(),
                    scientific_name=row["Scientific Name"].strip(),
                    quantity=int(row.get("Qty", "0") or "0"),
                    buy_new_wont_survive=buy_new_wont_survive,
                    buy_new_readily_available=buy_new_available,
                    move_by_staff=move_by_staff,
                    move_requires_consult=move_requires_consult,
                    notes=row.get("Notes", "").strip(),
                )

                await service.create_plant(plant)
                plants_added += 1
                if plants_added % 10 == 0:
                    print(f"Added {plants_added} plants...")

            except Exception as e:
                print(f"Error adding plant {row.get('Common Name', 'unknown')}: {e}")

    print(f"✅ Successfully added {plants_added} plants!")


async def create_sample_tours():
    """Create sample tours"""
    settings = get_settings()
    service = AppwriteService(settings)

    tours = [
        TourCreate(
            title="Tropical Dome Discovery",
            description="Explore the lush tropical plants from around the world",
            parts=[
                TourPart(
                    id="intro",
                    title="Welcome to the Tropics",
                    content="Welcome! You're about to journey through a tropical rainforest ecosystem.",
                    unlock_progress=0,
                ),
                TourPart(
                    id="palms",
                    title="Palm Paradise",
                    content="Notice the variety of palm trees, each adapted to different tropical environments.",
                    unlock_progress=25,
                ),
                TourPart(
                    id="orchids",
                    title="Orchid Collection",
                    content="Our orchids represent some of the most beautiful and diverse plants on Earth.",
                    unlock_progress=50,
                ),
                TourPart(
                    id="canopy",
                    title="Canopy Layer",
                    content="Look up! The canopy layer is home to many epiphytes and climbing plants.",
                    unlock_progress=75,
                ),
            ],
        ),
        TourCreate(
            title="Desert Dome Adventure",
            description="Discover the resilient plants of the world's deserts",
            parts=[
                TourPart(
                    id="intro",
                    title="Desert Introduction",
                    content="Welcome to the desert! These plants have amazing adaptations for survival.",
                    unlock_progress=0,
                ),
                TourPart(
                    id="cacti",
                    title="Cactus Collection",
                    content="Cacti store water in their thick stems and have spines instead of leaves.",
                    unlock_progress=33,
                ),
                TourPart(
                    id="succulents",
                    title="Succulent Showcase",
                    content="Succulents come in amazing shapes and colors, all designed to conserve water.",
                    unlock_progress=66,
                ),
            ],
        ),
    ]

    for tour in tours:
        try:
            await service.create_tour(tour)
            print(f"✅ Created tour: {tour.title}")
        except Exception as e:
            print(f"❌ Error creating tour {tour.title}: {e}")


async def create_sample_scavenger_hunts():
    """Create sample scavenger hunts"""
    settings = get_settings()
    service = AppwriteService(settings)

    hunts = [
        ScavengerHuntCreate(
            title="Plant Detective Challenge",
            description="Find these special plants throughout the domes!",
            difficulty="easy",
            items=[
                ScavengerHuntItem(
                    id="1",
                    name="Bird of Paradise",
                    description="Find the plant with orange and blue flowers that looks like a bird",
                    hint="Look in the tropical section",
                ),
                ScavengerHuntItem(
                    id="2",
                    name="Giant Cactus",
                    description="Find a cactus taller than you are",
                    hint="In the desert dome",
                ),
                ScavengerHuntItem(
                    id="3",
                    name="Hanging Plant",
                    description="Find a plant growing on another plant (epiphyte)",
                    hint="Look up in the tropical canopy",
                ),
            ],
        ),
        ScavengerHuntCreate(
            title="Leaf Shape Hunt",
            description="Find plants with these different leaf shapes",
            difficulty="medium",
            items=[
                ScavengerHuntItem(
                    id="1", name="Heart-Shaped Leaves", description="Find a plant with heart-shaped leaves"
                ),
                ScavengerHuntItem(
                    id="2", name="Needle-Like Leaves", description="Find a plant with needle-like leaves"
                ),
                ScavengerHuntItem(
                    id="3", name="Compound Leaves", description="Find a plant with leaves made of smaller leaflets"
                ),
            ],
        ),
    ]

    for hunt in hunts:
        try:
            await service.create_scavenger_hunt(hunt)
            print(f"✅ Created scavenger hunt: {hunt.title}")
        except Exception as e:
            print(f"❌ Error creating hunt {hunt.title}: {e}")


async def main():
    """Main initialization function"""
    print("🌿 Milwaukee Domes Database Initialization")
    print("=" * 50)

    try:
        print("\n1️⃣  Loading plants from CSV...")
        await load_plants_from_csv()

        print("\n2️⃣  Creating sample tours...")
        await create_sample_tours()

        print("\n3️⃣  Creating sample scavenger hunts...")
        await create_sample_scavenger_hunts()

        print("\n" + "=" * 50)
        print("✅ Database initialization complete!")
        print("\nNext steps:")
        print("1. Visit http://localhost:8000/admin to view the admin dashboard")
        print("2. Check http://localhost:8000/docs for API documentation")
        print("3. Start building your mobile app!")

    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        print("\nMake sure:")
        print("1. Your .env file is configured correctly")
        print("2. Appwrite collections are created")
        print("3. You have network access to Appwrite")


if __name__ == "__main__":
    asyncio.run(main())
