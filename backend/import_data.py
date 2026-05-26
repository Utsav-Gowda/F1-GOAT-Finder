"""
Import Ergast F1 CSV data into MongoDB.

Run from the `backend/` directory after placing the CSVs in `csv_data/`.
Re-running is safe — it drops and re-imports each collection.
"""

import csv
import os
import sys

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    sys.exit("ERROR: MONGO_URI not found in .env file")

client = MongoClient(MONGO_URI)
db = client["f1DB"]

# Quick connectivity check
try:
    client.admin.command("ping")
    print(f"Connected to MongoDB at {MONGO_URI.split('@')[1].split('/')[0]}\n")
except Exception as e:
    sys.exit(f"ERROR: Could not connect to MongoDB: {e}")


def import_csv(filename, collection_name, int_fields=None):
    """Import a CSV file into a MongoDB collection.

    int_fields: list of column names that should be stored as integers
    rather than strings. Values of '\\N' (Ergast's null marker) are left alone.
    """
    int_fields = int_fields or []
    path = os.path.join("csv_data", filename)

    if not os.path.exists(path):
        print(f"  SKIP: {path} not found")
        return

    collection = db[collection_name]
    collection.drop()

    docs = []
    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            for field in int_fields:
                value = row.get(field)
                if value and value != "\\N":
                    try:
                        row[field] = int(value)
                    except ValueError:
                        pass  # leave as string if not parseable
            docs.append(row)

    if docs:
        collection.insert_many(docs)
    print(f"  {collection_name:12s} {len(docs):>6d} documents")


print("Importing collections:")
import_csv("circuits.csv", "circuits",
           int_fields=["circuitId"])
import_csv("drivers.csv", "drivers",
           int_fields=["driverId"])
import_csv("races.csv", "races",
           int_fields=["raceId", "year", "round", "circuitId"])
import_csv("results.csv", "results",
           int_fields=["resultId", "raceId", "driverId", "constructorId",
                       "grid", "positionOrder", "laps", "statusId"])

# Index the fields we query on, for speed
print("\nCreating indexes:")
db.results.create_index("driverId")
db.results.create_index("raceId")
db.races.create_index("raceId")
db.races.create_index("circuitId")
print("  done\n")

print("Import complete.")
