# CanPredict — Decisions Log

Append-only. Each entry is a locked decision with a one-line rationale. If a decision needs to change later, add a new entry that supersedes it — don't edit history.

---

## Architecture (established)

**Flask over FastAPI for the ML microservice.**
Simpler for the scope of this project, and consistent with the approach already used on the Dropout Early Warning System capstone.

**Weekly aggregation for demand data.**
Predictions are generated per menu item per ISO week, not per day — matches the granularity a canteen manager actually plans around.

**Per-item relative threshold labeling, not a global median split.**
More panel-defensible: a global median would call the cheapest item "high demand" at an arbitrary, hard-to-justify cutoff. Per-item relative thresholds tie the label to each item's own sales behavior.

**Synthetic CSV as training data.**
The `orders` tables had no real transaction history at the time of training, so a synthetic dataset (1,890 rows, 18 menu items, Jan 2024–Dec 2025) was generated and used instead. Documented as a scope/validity limitation, same framing used for the UCI dataset on the Dropout project.

**Model artifacts committed directly to the Flask repo.**
`model.pkl`, `category_encoder.pkl`, `label_encoder.pkl`, `metrics.json` are committed rather than re-trained on deploy — simplest path for a capstone with no CI/CD pipeline.

---

## Model verification (2026-06-20)

**Confirmed deployed model: Logistic Regression, 4 features.**
`model.pkl` is `sklearn.linear_model.LogisticRegression`, trained on `category_encoded`, `total_units_sold`, `avg_daily_units`, `unit_price`, in that exact order. This matches the existing defense script/cheat sheet's explanation of how the confidence score works — no rewrite needed there.

**`scaler.pkl` is not applied at inference, and that's correct.**
Verified the scaler was fit on 7 features (`month`, `unit_price`, `weekend_days_count`, `is_break_week`, `is_exam_week`, `is_enrollment_week`, `category_encoded`) — leftover from an earlier, abandoned calendar-aware model design that was replaced by the current 4-feature model. Deleted the file; `app.py` never referenced it.

**Label encoder class order verified correct — no bug.**
`label_encoder.classes_ = ['High Demand', 'Low Demand']` and `model.classes_ = [0, 1]`, confirming index 0 = High Demand exactly as assumed in `app.py`'s `build_prediction()`. No code change needed, though the hardcoded assumption (rather than an explicit assertion) is worth tightening at some point.

## Cleanup (2026-06-20)

**Removed AcademicCalendar feature entirely.**
Was scaffolding from the abandoned calendar-aware model design discovered above (same artifact, same abandoned design). Removed: `app/Support/AcademicCalendar.php`, the `is_break_week`/`is_exam_week`/`is_enrollment_week` columns from `demand_predictions`, the corresponding `$fillable`/`$casts` entries in `DemandPrediction`, and all related logic (including the unused `$weekendDaysCount`) from `PredictionController::generateWeeklyPredictions`. Verified via full codebase search: zero remaining references, zero frontend impact, end-to-end test passed after `migrate:fresh --seed`.

**Renamed live category names to match the trained vocabulary.**
`category_encoder.pkl` was trained on `['Beverage', 'Dessert', 'Main Meal', 'Snack']`, but the live `categories` table used `Meals`, `Snacks`, `Beverages`, `Desserts` — a plural/singular mismatch that caused every prediction to fail with `unknown category`. Renamed the DB rows and `CategorySeeder.php` to the singular trained vocabulary. The model and encoder were not retrained or touched — only the display strings in the database moved to match what's already trained.

**Excluded the Combos category from the prediction pipeline (group decision).**
The trained model has no `Combos` category at all — not a naming issue, a genuine training-data gap. Decided as a group to scope Combos out of predictions entirely rather than guess-map it to an existing category or retrain this close to the defense. The 5 Combos menu items remain fully valid, sellable items in the menu/POS/ordering flow — only `PredictionController::generateWeeklyPredictions` filters them out before calling Flask, so they never appear in the predictions table at all (not even as an error). Verified the frontend already degrades gracefully for items with no prediction (optional chaining on `predicted_label`), so no frontend changes were needed.

## Data quality fixes (2026-06-20)

**Filtered `total_units_sold` to `Completed` orders only.**
`PredictionController::generateWeeklyPredictions` previously summed `order_items.quantity` for any order in the last 7 days regardless of status, meaning Cancelled and Pending orders inflated apparent demand exactly as much as Completed ones. Added `->where('status', 'Completed')` to the query. Verified the fix actually changes behavior: "Buko Pandan" dropped from 27 units (all statuses) to 5 units (Completed only) for the same 7-day window.

**Deleted 4 manual test orders with anomalous quantities.**
Found via `OrderItem` rows with `quantity > 10` (seeder only ever generates 1–3). All 4 had order numbers that didn't match the seeder's `ORD-XXXXX` pattern, confirming they were created manually through the POS during development, not by `OrderSeeder`. Quantities ranged 114–169 on items with `Completed` status — meaning the status filter above would *not* have caught these on its own; deletion was independently necessary. Parent orders were also deleted where they had no remaining items.

**Note on enum status casing:** `orders.status` is defined capitalized (`Completed`, `Cancelled`, etc.) in the migration, but `OrderSeeder.php` inserts lowercase values (`'completed'`, `'cancelled'`). MySQL ENUM columns match case-insensitively and always return the canonical defined-case value on read — confirmed via `Order::distinct()->pluck('status')` returning the capitalized versions despite lowercase inserts. Not a bug, just worth knowing so no one later writes a strict `=== 'completed'` comparison that silently never matches.

## Access control fix (2026-06-20)

**Restricted `/predict/generate` and `/predict/metrics/sync` to `admin` role only.**
Confirmed via audit that these routes only required `auth:sanctum` (any logged-in user), not role-specific access — a `customer` or `cashier` token could trigger a full forecast regeneration. Added a manual role check at the top of both `PredictionController` methods (`if ($request->user()->role !== 'admin') return 403`). Verified: cashier token now gets `403 Forbidden`, admin token still works exactly as before.

**Broader finding, not yet acted on:** the same audit found that *no controller in the app* checks roles for sensitive actions, including user deletion — this is a system-wide gap, not specific to CanPredict's prediction routes. Flagged for the group to decide whether it's in scope to fix before the defense or documented as a known limitation.

**Second round of outlier deletion — this is a recurring pattern, not a one-time fix.**
Two more `OrderItem` rows with anomalous quantities (113, 190) were found and deleted, same root cause as the first round: manual POS UI testing creating real `Completed` orders outside the seeder. Timestamps confirmed these were created *after* the first cleanup, not missed by it. Since POS testing is ongoing, **re-run the outlier check (`OrderItem::where('quantity', '>', 10)`) before any demo or live prediction run** — don't assume this is permanently resolved.

## System-wide role protection (2026-06-20)

**Fixed a privilege escalation in self-registration.**
`AuthController::register` previously accepted a client-supplied `role` field and passed it straight into `User::create()` — meaning any unauthenticated person could self-register as `admin`, no login required. This was more severe than the `POST /users` issue below, since it needed zero prior access to exploit. Removed `role` from registration validation and hardcoded `role => 'customer'` server-side regardless of request input. Verified: a registration request sending `"role": "admin"` now creates a `customer` account.

**Rolled out a single, unified role-checking middleware across all 18 sensitive routes.**
A full route audit found 16 of 18 sensitive routes (menu/category mutation, report access, user management, inventory adjustment, order status changes, and the 2 prediction-trigger routes) had no role check at all — any authenticated account, including `customer`, could call them. Built `EnsureUserHasRole` (registered under the `role` alias in `bootstrap/app.php`, per Laravel 11's middleware registration model), applied as `role:admin` or `role:admin,cashier` per route group, nested inside the existing `auth:sanctum` group so an unauthenticated request is always rejected before any role check runs. Policy: Menu, Category, Report, and User management are admin-only; Order status updates and Inventory adjustments allow admin+cashier; everything else (browsing menu/categories, placing an order, viewing predictions) stays open to any authenticated user. Retrofitted the two manual role checks added earlier directly in `PredictionController` to use this same middleware, so there's exactly one role-checking mechanism in the codebase, not two. Verified with representative spot-checks across every route group, including the most critical case: `POST /users` is now blocked for `customer` tokens, closing the path that previously let any authenticated account self-elevate by creating a new admin user.

---

## Known limitations (for defense write-up)

- Synthetic training data, not real transaction history (see Architecture section above).
- Combos category is out of scope for demand prediction — by design, documented here, not a bug.
- `model_runs` metadata (`training_rows`, `trained_at`, `notes`) is not populated by the current `metrics.json`, since it only contains accuracy/precision/recall/F1. Low priority — only matters if the historical model-run log needs to be more detailed for the defense.