import json
import os
from pathlib import Path

import joblib
import numpy as np
from flask import Flask, jsonify, request
from flask_cors import CORS


BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "model"
MODEL_PATH = MODEL_DIR / "model.pkl"
CATEGORY_ENCODER_PATH = MODEL_DIR / "category_encoder.pkl"
LABEL_ENCODER_PATH = MODEL_DIR / "label_encoder.pkl"
METRICS_PATH = MODEL_DIR / "metrics.json"


# Default is 0.50 (50%). Can be adjusted
DEMAND_THRESHOLD = 0.50

FEATURE_ORDER = [
    "category_encoded",
    "total_units_sold",
    "avg_daily_units",
    "unit_price",
]

REQUIRED_ITEM_FIELDS = [
    "item_name",
    "category",
    "total_units_sold",
    "avg_daily_units",
    "unit_price",
]


def load_required_file(path: Path):
    if not path.exists():
        raise FileNotFoundError(f"Missing required file: {path}")
    return path


def load_artifacts():
    load_required_file(MODEL_PATH)
    load_required_file(CATEGORY_ENCODER_PATH)
    load_required_file(LABEL_ENCODER_PATH)
    load_required_file(METRICS_PATH)

    try:
        model = joblib.load(MODEL_PATH)
        category_encoder = joblib.load(CATEGORY_ENCODER_PATH)
        label_encoder = joblib.load(LABEL_ENCODER_PATH)
        with METRICS_PATH.open("r", encoding="utf-8") as metrics_file:
            metrics = json.load(metrics_file)
    except Exception as exc:
        raise RuntimeError(f"Failed to load model artifacts: {exc}") from exc

    return {
        "model": model,
        "category_encoder": category_encoder,
        "label_encoder": label_encoder,
        "metrics": metrics,
    }


ARTIFACTS = load_artifacts()
MODEL = ARTIFACTS["model"]
CATEGORY_ENCODER = ARTIFACTS["category_encoder"]
LABEL_ENCODER = ARTIFACTS["label_encoder"]
METRICS = ARTIFACTS["metrics"]


def transform_features(item):
    for field in REQUIRED_ITEM_FIELDS:
        if field not in item:
            raise ValueError(f"missing required field: {field}")

    try:
        category_encoded = CATEGORY_ENCODER.transform([item["category"]])[0]
    except ValueError as exc:
        raise ValueError(f"unknown category: {item['category']}") from exc

    raw_features = np.array(
        [
            [
                category_encoded,
                item["total_units_sold"],
                item["avg_daily_units"],
                item["unit_price"],
            ]
        ],
        dtype=float,
    )

    return raw_features


def build_prediction(item):
    transformed = transform_features(item)
    probabilities = MODEL.predict_proba(transformed)[0]
    
    # classes_ are ['High Demand', 'Low Demand'], so index 0 is High Demand probability
    high_demand_prob = float(probabilities[0])
    
    if high_demand_prob >= DEMAND_THRESHOLD:
        predicted_label = "High Demand"
        confidence = high_demand_prob
    else:
        predicted_label = "Low Demand"
        # If it's Low Demand, we show the confidence of the Low Demand prediction (which is 1 - high_demand_prob)
        confidence = float(probabilities[1])

    return {
        "item_name": item["item_name"],
        "predicted_label": predicted_label,
        "confidence": confidence,
    }


app = Flask(__name__)
laravel_origin = os.environ.get("LARAVEL_ORIGIN", "http://localhost:8000")
CORS(app, resources={r"/*": {"origins": [laravel_origin]}})


@app.get("/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/metrics")
def metrics():
    return jsonify(METRICS)


@app.post("/predict")
def predict():
    try:
        payload = request.get_json(silent=True)
        if not isinstance(payload, dict):
            return jsonify({"error": "request body must be JSON"}), 400

        items = payload.get("items")
        if not isinstance(items, list) or not items:
            return jsonify({"error": "items must be a non-empty list"}), 400

        predictions = []
        errors = []

        for item in items:
            item_name = item.get("item_name") if isinstance(item, dict) else None

            if not isinstance(item, dict):
                errors.append({"item_name": item_name, "reason": "item must be an object"})
                continue

            try:
                predictions.append(build_prediction(item))
            except ValueError as exc:
                errors.append({"item_name": item.get("item_name"), "reason": str(exc)})

        response_body = {"predictions": predictions}
        if errors:
            response_body["errors"] = errors

        return jsonify(response_body)

    except Exception:
        app.logger.exception("Unexpected error during prediction")
        return jsonify({"error": "An unexpected error occurred while generating predictions."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)