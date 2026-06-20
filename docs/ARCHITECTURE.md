# CanPredict — Architecture

For schema details see `DATABASE.md`. For exact request/response shapes see `API_CONTRACT.md`. For *why* any of these choices were made, see `DECISIONS.md`. This file is the big picture only — don't duplicate detail that already lives in those three.

---

## Stack overview

Three layers, same pattern as the Dropout Early Warning System capstone:

```
┌─────────────────────┐      ┌──────────────────────┐      ┌────────────────────┐
│  React + Tailwind    │      │   Laravel 11          │      │   Flask (Python)   │
│  + shadcn/ui          │ ───▶ │   (API + business     │ ───▶ │   ML microservice   │
│  (canteen-frontend)   │ ◀─── │    logic + DB)         │ ◀─── │   (canteen-flask)   │
│                       │      │   (canteen-backend)    │      │                     │
└─────────────────────┘      └──────────────────────┘      └────────────────────┘
                                       │
                                       ▼
                                  MySQL database
```

Flask is intentionally stateless — it has no database connection of its own. It only ever sees what Laravel sends it in a request and returns a prediction; it never reads or writes `demand_predictions` or `model_runs` directly. Laravel owns all persistence.

---

## Data flow — weekly forecast generation

1. Admin clicks "Generate Weekly Forecast" in the dashboard.
2. React calls `POST /predict/generate`.
3. `PredictionController::generateWeeklyPredictions`:
   - Pulls all `MenuItem`s **excluding** the `Combos` category.
   - For each item, sums `order_items.quantity` over the last 7 days, filtered to `orders.status = 'Completed'`, to get `total_units_sold`; derives `avg_daily_units` as `total_units_sold / 7`.
   - Builds a JSON payload and calls Flask via `FlaskPredictionService`.
4. Flask `app.py` `/predict`:
   - Encodes `category` via `category_encoder.pkl`, builds the 4-feature vector, calls `model.predict_proba()`.
   - Returns `predicted_label` (`High Demand`/`Low Demand`) and `confidence` per item, with per-item error reporting for bad input.
5. Laravel `updateOrCreate`s each result into `demand_predictions` (unique per `menu_item_id` + `week_start`).
6. Frontend later calls `GET /predict` to display the latest week's predictions. Items with no row (Combos) simply show no badge — confirmed graceful, no special-casing needed.

## Data flow — model metrics sync

1. Admin triggers `POST /predict/metrics/sync`.
2. Laravel calls Flask `GET /metrics`, which returns the static contents of `metrics.json`.
3. Laravel writes a new `model_runs` row. (`training_rows`/`trained_at`/`notes` currently always null — `metrics.json` doesn't provide them; see `REQUIREMENTS.md` open questions.)
4. Frontend calls `GET /predict/metrics/latest` to display current model performance on the dashboard.

---

## Component map

**Frontend (`canteen-frontend`)**
- `LoginPage` — Tailwind HSL token system, Poppins font, light-mode only
- `MenuList` / `MenuItemCard` — renders menu items with optional High Demand badge (optional chaining on `prediction?.predicted_label`, degrades gracefully when absent)
- `POSInterface` — order creation, same graceful-degradation pattern for predictions
- `ReportsPage` — displays predictions list and model metrics; has a static decorative bar chart with a TODO to wire up `/api/predictions/summary` live

**Backend (`canteen-backend`)**
- `PredictionController` — the only controller that talks to Flask; owns `generateWeeklyPredictions` and `syncMetrics`
- `FlaskPredictionService` — thin HTTP client wrapping calls to the Flask service, 10s timeout, translates connection failures into clean `503` responses
- Models: `Category`, `MenuItem`, `Order`, `OrderItem`, `InventoryLog`, `DemandPrediction`, `ModelRun`, `User` — see `DATABASE.md` for full schema and relationships

**ML service (`canteen-flask`)**
- `app.py` — `/health`, `/metrics`, `/predict`
- `model/` — `model.pkl` (LogisticRegression), `category_encoder.pkl`, `label_encoder.pkl`, `metrics.json`. `scaler.pkl` was deleted 2026-06-20 — it belonged to an earlier, abandoned 7-feature calendar-aware design (see `DECISIONS.md`); do not re-add a scaler without retraining the current model on scaled features first.

---

## Design system notes (frontend)
- Tailwind HSL design tokens: `primary` (red/orange-red), `success` (green), `warning` (amber), `--panel` (dark panel background)
- Poppins font, light-mode only — no dark mode planned
- Submit buttons use the `primary` token; lucide-react `TrendingUp` used as the brand icon
- shadcn/ui `Checkbox` component; no shake animation on form errors (deliberate choice)

## What this architecture deliberately does *not* do
- No real-time/per-order prediction — weekly batch only (see `REQUIREMENTS.md` scope).
- No academic-calendar awareness — built, then removed; the 7-feature `scaler.pkl` is the fossil record of that abandoned direction.
- No automated retraining pipeline — model artifacts are static and manually committed.
