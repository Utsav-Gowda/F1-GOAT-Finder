# backend/app.py

import os
from collections import defaultdict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

from flags import flag_for_country, flag_for_nationality

load_dotenv()

app = Flask(__name__)

# ----- CORS configuration -----
# Add your GitHub Pages URL here once you deploy the frontend.
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://utsav-gowda.github.io",  # <-- update to match your GitHub username
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


# ----- Database connection -----
MONGO_URI = os.getenv("MONGO_URI")
if MONGO_URI:
    client = MongoClient(MONGO_URI)
    db = client["f1DB"]
    results_collection = db["results"]
    races_collection = db["races"]
    drivers_collection = db["drivers"]
    circuits_collection = db["circuits"]
else:
    print("Warning: MONGO_URI not found. All endpoints will return 500.")
    results_collection = None
    races_collection = None
    drivers_collection = None
    circuits_collection = None


def db_ready():
    return all([results_collection is not None,
                races_collection is not None,
                drivers_collection is not None,
                circuits_collection is not None])


# ----- Routes -----
@app.route("/api/health", methods=["GET"])
def health():
    """Used by the keep-warm pinger and for quick deployment checks."""
    return jsonify({"status": "ok", "db_configured": db_ready()})


@app.route("/api/initial-data", methods=["GET"])
def get_initial_data():
    """Return drivers and circuits with display names and flag emojis."""
    if not db_ready():
        return jsonify({"error": "Database not configured on the server."}), 500

    try:
        drivers_cursor = drivers_collection.find(
            {},
            {"_id": 0, "driverId": 1, "forename": 1, "surname": 1, "nationality": 1},
        ).sort([("surname", 1), ("forename", 1)])

        drivers = [
            {
                "id": d["driverId"],
                "name": f"{d['forename']} {d['surname']}",
                "country": flag_for_nationality(d.get("nationality", "")),
            }
            for d in drivers_cursor
        ]

        circuits_cursor = circuits_collection.find(
            {},
            {"_id": 0, "circuitId": 1, "name": 1, "country": 1},
        ).sort("name", 1)

        circuits = [
            {
                "id": c["circuitId"],
                "name": c["name"],
                "country": flag_for_country(c.get("country", "")),
            }
            for c in circuits_cursor
        ]

        return jsonify({"drivers": drivers, "circuits": circuits})

    except Exception as e:
        print(f"Error fetching initial data: {e}")
        return jsonify({"error": "Failed to fetch initial data."}), 500


@app.route("/api/analyze", methods=["POST"])
def analyze_drivers():
    """Compute a 0-100 performance score for each selected driver at a circuit."""
    if not db_ready():
        return jsonify({"error": "Database not configured on the server."}), 500

    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Invalid request body."}), 400

        selected_drivers = data.get("drivers", [])
        selected_circuit_id = data.get("circuitId")

        if not selected_drivers or selected_circuit_id is None:
            return jsonify({"error": "Missing 'drivers' or 'circuitId'."}), 400

        driver_ids = [int(d["id"]) for d in selected_drivers]
        driver_lookup = {int(d["id"]): d for d in selected_drivers}

        pipeline = [
            {
                "$lookup": {
                    "from": "races",
                    "localField": "raceId",
                    "foreignField": "raceId",
                    "as": "raceInfo",
                }
            },
            {"$unwind": "$raceInfo"},
            {
                "$match": {
                    "driverId": {"$in": driver_ids},
                    "raceInfo.circuitId": int(selected_circuit_id),
                }
            },
            {"$project": {"_id": 0, "driverId": 1, "position": 1}},
        ]

        results = list(results_collection.aggregate(pipeline))
        if not results:
            return jsonify([])

        positions_by_driver = defaultdict(list)
        for result in results:
            positions_by_driver[result["driverId"]].append(result["position"])

        def calculate_score(positions):
            """Score = 100 - 5 * avg_finishing_position - 5 * dnf_count, clamped [0, 100]."""
            numeric_positions = []
            dnf_count = 0
            for pos in positions:
                if pos == "\\N":
                    dnf_count += 1
                else:
                    try:
                        numeric_positions.append(int(pos))
                    except (ValueError, TypeError):
                        dnf_count += 1

            if not numeric_positions and dnf_count == 0:
                return 0

            avg_position = (
                sum(numeric_positions) / len(numeric_positions)
                if numeric_positions else 20
            )
            score = 100 - (avg_position * 5) - (dnf_count * 5)
            return max(0, min(100, round(score, 2)))

        scored = []
        for driver_id, positions in positions_by_driver.items():
            driver_info = driver_lookup.get(driver_id)
            if driver_info:
                scored.append({
                    "driver": driver_info,
                    "score": calculate_score(positions),
                    "races": len(positions),
                })

        ranked = sorted(scored, key=lambda x: x["score"], reverse=True)
        return jsonify([{**r, "rank": i + 1} for i, r in enumerate(ranked)])

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": "An unexpected error occurred during analysis."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
