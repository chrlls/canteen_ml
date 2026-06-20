# CanPredict — Requirements

Written last, against the settled system — reflects what CanPredict actually does as of 2026-06-20, not an aspirational design. For *why* any of these choices were made, see `DECISIONS.md`.

---

## Functional Requirements

**FR1 — Menu management.** Admins manage menu items (name, price, stock, availability, category) and categories. Categories: `Main Meal`, `Snack`, `Beverage`, `Dessert`, `Combos`.

**FR2 — Order processing (POS).** Cashiers create orders against menu items; each order has a status (`Pending` → `Preparing` → `Ready` → `Completed`, or `Cancelled`).

**FR3 — Weekly demand forecasting.** On admin request, the system computes each non-Combo menu item's trailing 7-day `Completed`-order sales and classifies it as `High Demand` or `Low Demand` with a confidence score, via a trained Logistic Regression model.

**FR4 — Combos are excluded from forecasting by design.** The 5 Combos menu items remain fully orderable but never receive a prediction — there is no trained model support for that category (group decision, see `DECISIONS.md`).

**FR5 — Model performance tracking.** Admins can sync the ML model's current accuracy/precision/recall/F1 into a historical `model_runs` log, for tracking model performance over time.

**FR6 — Prediction history.** The system stores one prediction per menu item per ISO week (unique constraint), viewable on a reports dashboard.

**FR7 — Authentication & roles.** Users authenticate via Sanctum tokens. Three roles exist: `admin`, `cashier`, `customer`.

---

## Non-Functional Requirements

### Security
- All routes require a valid Sanctum bearer token (`auth:sanctum`).
- **Role-based access control implemented (2026-06-20).** `HasRole` middleware enforces: Menu management, Category management, Reports, and User management are `admin`-only; Order status updates and Inventory adjustments allow `admin`+`cashier`; all other authenticated actions (browsing, placing orders, viewing predictions) are open to any role. Applied across all 18 sensitive routes identified in a full route audit, including the two prediction-trigger routes.
- **Fixed a privilege-escalation vulnerability in self-registration.** `AuthController::register` previously accepted a client-supplied `role` field, allowing any unauthenticated person to self-register as `admin`. Now hardcoded server-side to always assign `role => 'customer'` on registration, regardless of request input.
- Passwords are hashed (`'password' => 'hashed'` cast on `User`).

### Reliability
- If the Flask service is unreachable, `/predict/generate` and `/predict/metrics/sync` return a clean `503` JSON error rather than an unhandled exception — confirmed via manual test (Flask stopped, route hit directly).
- Flask itself handles per-item failures gracefully (bad category, missing field) without failing the entire batch — confirmed.
- `total_units_sold` only counts `Completed` orders, so Cancelled/Pending/Preparing/Ready orders don't distort demand signals — fixed 2026-06-20.

### Performance
- No formal load testing has been done. Acceptable given scope: single-canteen scale, ~30 menu items, weekly (not real-time) batch prediction — there is no requirement for sub-second response under concurrent load.
- Flask `/predict` call has a 10-second timeout configured in `FlaskPredictionService`; no retry logic beyond that.

### Scalability
- Designed for weekly batch generation, not per-order real-time inference — appropriate for a single canteen's order volume. Not designed or tested for multi-canteen/multi-tenant use.

### Maintainability
- Project state is tracked in `docs/` (`DECISIONS.md`, `API_CONTRACT.md`, `DATABASE.md`, `STATUS.md`, this file) rather than only in code comments, specifically so two different AI tools (Claude for planning, Gemini for implementation) stay aligned across sessions.
- Model artifacts (`model.pkl`, `category_encoder.pkl`, `label_encoder.pkl`, `metrics.json`) are committed directly to the Flask repo rather than retrained on deploy — no CI/CD pipeline exists or is required for this scope.

### User Experience
- Frontend uses a Tailwind HSL design-token system (primary: red/orange-red, success: green, warning: amber), Poppins font, light-mode only.
- Items with no prediction (Combos) render with no badge rather than an error or placeholder — confirmed via frontend code review, no changes were needed.

---

## Explicitly out of scope
- Predicting demand for the Combos category (no trained model support — see FR4).
- Academic-calendar-aware prediction (break weeks, exam weeks, enrollment weeks) — built, then deliberately removed; see `DECISIONS.md`.
- Real-time/per-order prediction — system is weekly-batch by design.
- Automated model retraining — artifacts are static and manually committed.

## Open questions (resolve before defense if time allows)
- Decide whether to enrich `metrics.json` with `training_rows`/`trained_at`/`notes` so `model_runs` history is more meaningful, or accept the gap as a documented limitation.