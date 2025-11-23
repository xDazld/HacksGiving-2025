"""Script to initialize Appwrite database with sample data"""

import asyncio
import csv
from pathlib import Path

from app.config import get_settings
from app.services import AppwriteService
from app.models import PlantCreate


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


# Tour and scavenger hunt sample data has been removed. Use context file uploads and LLM generation instead.


async def main():
    """Main initialization function"""
    print("🌿 Milwaukee Domes Database Initialization")
    print("=" * 50)

    try:
        print("\n1️⃣  Loading plants from CSV...")
        await load_plants_from_csv()

        print("\n" + "=" * 50)
        print("✅ Database initialization complete!")
        print("\nNext steps:")
        print("1. Visit http://localhost:8000/admin to view the admin dashboard")
        print("2. Check http://localhost:8000/docs for API documentation")
        print("3. Upload context files for LLM generation via /admin/context-files")

    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        print("\nMake sure:")
        print("1. Your .env file is configured correctly")
        print("2. Appwrite collections are created")
        print("3. You have network access to Appwrite")


if __name__ == "__main__":
    asyncio.run(main())
