# backend/app.py

import os
import certifi
from collections import defaultdict

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo import MongoClient

from flags import flag_for_country, flag_for_nationality

load_dotenv()

app = Flask(__name__)

# ----- CORS configuration -----
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://utsav-gowda.github.io",  # <-- update to match your GitHub username
]
CORS(app, resources={r"/api/*": {"origins": ALLOWED_ORIGINS}})


# ----- Database connection -----
MONGO_URI = os.getenv("MONGO_URI")
if MONGO_URI:
    client = MongoClient(MONGO_URI, tlsCAFile=certifi.where())
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


# ----- Scoring constants -----
# These are tunable parameters of the scoring algorithm. They live up top so
# they're easy to find and adjust.
WIN_BONUS = 15           # extra points for finishing P1
PODIUM_BONUS = 5         # extra points for P2 or P3
DNF_PENALTY = -10        # flat negative for not finishing
CONFIDENCE_THRESHOLD = 10  # races needed for full statistical confidence
NEUTRAL_SCORE = 50       # score that low-data drivers regress toward


def calculate_race_score(position_str: str, starters: int) -> float:
    """Score a single race for a driver.

    Position normalized by field size: 100 for P1, 0 for last place, smooth
    in between. Wins and podiums get bonuses. DNFs get a flat penalty.
    """
    if position_str == "\\N":
        return DNF_PENALTY

    try:
        position = int(position_str)
    except (ValueError, TypeError):
        return DNF_PENALTY

    # Field-size-normalized position score.
    # P1 in any field = 100; last place = 0. This makes 5th in a 22-car modern
    # grid score higher than 5th in an 8-car 1950s grid.
    if starters > 1:
        pos_score = 100.0 * (starters - position) / (starters - 1)
    else:
        pos_score = 100.0 if position == 1 else 0.0

    # Podium bonuses — winning is meaningfully better than 2nd, 2nd/3rd
    # meaningfully better than 4th. Linear scaling alone undersells this.
    if position == 1:
        pos_score += WIN_BONUS
    elif position in (2, 3):
        pos_score += PODIUM_BONUS

    return pos_score


def aggregate_score(race_scores: list[float]) -> float:
    """Aggregate per-race scores into a final 0-100 score for the driver.

    Uses a sample-size confidence factor: drivers with few races at the
    circuit regress toward a neutral score, because one lucky win shouldn't
    crown anyone the GOAT of a track. Once a driver has CONFIDENCE_THRESHOLD
    races, the regression goes away.
    """
    if not race_scores:
        return 0.0

    avg = sum(race_scores) / len(race_scores)

    # Bayesian-style shrinkage: weight true average by sample size, fill
    # remaining weight with the neutral score.
    confidence = min(1.0, len(race_scores) / CONFIDENCE_THRESHOLD)
    final = avg * confidence + NEUTRAL_SCORE * (1 - confidence)

    return max(0.0, min(100.0, round(final, 2)))


# ----- Routes -----
@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "db_configured": db_ready()})


@app.route("/api/initial-data", methods=["GET"])
def get_initial_data():
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
    """Compute a 0-100 performance score for each selected driver at a circuit.

    Uses an aggregation pipeline that returns every race entry at the circuit
    (not just the selected drivers') so we can compute field sizes. Then
    Python applies the scoring algorithm.
    """
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

        # Get every result at this circuit. We need all of them — not just the
        # selected drivers' — because field size per race comes from counting
        # all entries in that race.
        pipeline = [
            {"$lookup": {
                "from": "races",
                "localField": "raceId",
                "foreignField": "raceId",
                "as": "raceInfo",
            }},
            {"$unwind": "$raceInfo"},
            {"$match": {"raceInfo.circuitId": int(selected_circuit_id)}},
            {"$group": {
                "_id": "$raceId",
                "starters": {"$sum": 1},
                "entries": {"$push": {
                    "driverId": "$driverId",
                    "position": "$position",
                }},
            }},
        ]

        races_at_circuit = list(results_collection.aggregate(pipeline))
        if not races_at_circuit:
            return jsonify([])

        # Collect each selected driver's (position, starters) pairs.
        per_driver_entries = defaultdict(list)
        for race in races_at_circuit:
            starters = race["starters"]
            for entry in race["entries"]:
                if entry["driverId"] in driver_lookup:
                    per_driver_entries[entry["driverId"]].append(
                        (entry["position"], starters)
                    )

        # Score each driver and assemble the response.
        scored = []
        for driver_id, entries in per_driver_entries.items():
            race_scores = [calculate_race_score(pos, st) for pos, st in entries]
            scored.append({
                "driver": driver_lookup[driver_id],
                "score": aggregate_score(race_scores),
                "races": len(race_scores),
            })

        ranked = sorted(scored, key=lambda x: x["score"], reverse=True)
        return jsonify([{**r, "rank": i + 1} for i, r in enumerate(ranked)])

    except Exception as e:
        print(f"Error during analysis: {e}")
        return jsonify({"error": "An unexpected error occurred during analysis."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
