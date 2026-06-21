# CanPredict — API Contract

This documents the exact request/response shapes as they exist in the codebase today (post category-rename, post AcademicCalendar removal, post Combos exclusion). If the actual code changes, update this file in the same commit — it should never describe a state that no longer exists.

---

## Flask ML Service (`canteen-flask/app.py`)

Base URL: `http://localhost:5000` (configurable via `LARAVEL_ORIGIN` / `FLASK_URL` env vars on the Laravel side)

### `GET /health`
No auth, no params.

**Response 200:**
```json
{ "status": "ok" }
```

### `GET /metrics`
Returns the raw contents of `model/metrics.json` as-is.

**Response 200:**
```json
{
  "accuracy": 0.6825396825396826,
  "precision": 0.7063492063492064,
  "recall": 0.7946428571428571,
  "f1_score": 0.7478991596638656
}
```
Note: does not currently include `training_rows`, `trained_at`, or `notes` — see `DECISIONS.md` known limitations.

### `POST /predict`

**Request:**
```json
{
  "items": [
    {
      "item_name": "Pancit Canton",
      "category": "Main Meal",
      "total_units_sold": 150,
      "avg_daily_units": 21.4,
      "unit_price": 55.0
    }
  ]
}
```
`category` must be one of the trained values: `"Beverage"`, `"Dessert"`, `"Main Meal"`, `"Snack"`. `"Combos"` is not a valid value — the Laravel caller is responsible for never sending Combos items (see Cleanup decisions in `DECISIONS.md`).

**Response 200 (all items succeed):**
```json
{
  "predictions": [
    { "item_name": "Pancit Canton", "predicted_label": "Low Demand", "confidence": 0.5328395184003545 }
  ]
}
```

**Response 200 (some items fail, others succeed):** `predictions` contains only the successful ones; an `errors` array is added alongside it:
```json
{
  "predictions": [ { "item_name": "...", "predicted_label": "...", "confidence": 0.0 } ],
  "errors": [
    { "item_name": "Some Item", "reason": "unknown category: Combos" }
  ]
}
```
Per-item failure reasons seen in practice: `"missing required field: <field>"`, `"unknown category: <value>"`, `"item must be an object"`.

**Response 400 (malformed request body):**
```json
{ "error": "request body must be JSON" }
```
or
```json
{ "error": "items must be a non-empty list" }
```

**Response 500 (unexpected server error):**
```json
{ "error": "An unexpected error occurred while generating predictions." }
```

---

## Laravel API (consumed by the React frontend)

Base URL: `/api` · All routes below require `auth:sanctum` (Bearer token from `/login`).

### `POST /predict/generate`
Triggers `PredictionController::generateWeeklyPredictions`. No request body needed — it pulls all non-Combos menu items from the DB, computes each item's trailing 7-day `total_units_sold`/`avg_daily_units`, and calls Flask `/predict` internally.

**Response 200 (success):**
```json
{
  "message": "Weekly predictions generated successfully",
  "processed": 25,
  "errors": []
}
```
`errors` will be non-empty only if Flask itself reports per-item failures (e.g. a future category mismatch) — Combos items no longer appear here since they're filtered out before the call.

**Response 400 (no menu items to predict — edge case, e.g. if every item happened to be Combos):**
```json
{ "message": "No menu items found to predict" }
```

**Response 400 (Flask rejected the overall payload):**
```json
{ "message": "Flask rejected payload", "details": "request body must be JSON" }
```

**Response 503 (Flask unreachable):**
```json
{
  "error": "Prediction service unavailable",
  "details": "Failed to communicate with Flask service: cURL error 7: ..."
}
```

**Response 500 (unexpected Laravel-side error):**
```json
{ "error": "An unexpected error occurred" }
```

### `POST /predict/metrics/sync`
Calls Flask `/metrics`, writes a new `model_runs` row.

**Response 200:**
```json
{
  "message": "Model metrics synced successfully",
  "data": {
    "id": 4,
    "accuracy": "0.6825",
    "precision": "0.7063",
    "recall": "0.7946",
    "f1_score": "0.7479",
    "training_rows": null,
    "trained_at": "2026-06-20T08:00:00.000000Z",
    "notes": null
  }
}
```
`training_rows`, `trained_at` (real training timestamp, not sync time), and `notes` are currently always null/sync-time — Flask's `/metrics` doesn't provide them yet.

**Response 503 / 500:** same shape as `/predict/generate` above.

### `GET /predict`
Returns the latest week's predictions (all menu items with a `DemandPrediction` row for the most recent `week_start`). Returns `[]` if no predictions exist yet. Combos items will never appear here.

```json
[
  {
    "id": 12,
    "menu_item_id": 3,
    "week_start": "2026-06-15",
    "predicted_label": "High Demand",
    "confidence_score": "0.8734",
    "actual_units_sold": null,
    "menu_item": { "id": 3, "name": "Pork Sinigang", "price": "90.00", "...": "..." }
  }
]
```

### `GET /predict/metrics/latest`
Returns the most recent `model_runs` row, or `null` if none exist.

---

### Orders

### `PATCH /orders/{id}/cancel`
Cancels an order. Requires `cancellation_reason` in the request body. 
- Admin/Cashier can cancel any order that is not `Completed` or already `Cancelled`.
- Customers can only cancel their own orders, and only if the order is still `Pending`.

**Request:**
```json
{
  "cancellation_reason": "Out of stock"
}
```

**Response 200 (success):**
```json
{
  "id": 1,
  "status": "Cancelled",
  "cancellation_reason": "Out of stock"
}
```

**Response 400 (validation or state error):**
```json
{ "message": "Cannot cancel a completed or already cancelled order" }
```
or (if customer trying to cancel non-pending)
```json
{ "message": "Customers can only cancel Pending orders" }
```

**Response 403 (unauthorized access):**
```json
{ "message": "Unauthorized to cancel this order" }
```

---

## Known gaps (track in `DECISIONS.md`, not here)
- `model_runs.training_rows` / `trained_at` / `notes` are never meaningfully populated — Flask `/metrics` needs to return them for this to be fixed.
- No retry/backoff on the Laravel→Flask HTTP call beyond the 10s timeout already set in `FlaskPredictionService`.
