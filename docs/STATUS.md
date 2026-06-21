# CanPredict — Status

*Last updated: 2026-06-20. Update this every session — it's the file you paste into a fresh Gemini chat to resync it instantly.*

## Done
- ML pipeline trained and validated: Logistic Regression, 4 features (`category_encoded`, `total_units_sold`, `avg_daily_units`, `unit_price`). Accuracy 0.6825 / F1 0.7479 (current `metrics.json`).
- Flask `/health`, `/metrics`, `/predict` all working, including graceful per-item error handling.
- Laravel↔Flask integration wired end-to-end: `FlaskPredictionService`, `PredictionController` (`generateWeeklyPredictions`, `syncMetrics`), `demand_predictions` upsert, `model_runs` sync.
- 502/503 error handling confirmed: stopping Flask returns a clean JSON error from the Laravel trigger route, not an unhandled crash.
- Login page UI redesign (Tailwind HSL tokens, Poppins, light-mode only).
- Data/ML bug fixes: category name mismatch (DB renamed to match trained vocabulary), AcademicCalendar feature fully removed (abandoned earlier model design), Combos category excluded from predictions (group-confirmed decision), `total_units_sold` filtered to `Completed` orders only, manual test orders with anomalous quantities deleted (two rounds — recurs with POS testing, see Known gaps).
- **Security: full role-based access control implemented.** Fixed a privilege-escalation bug in `AuthController::register` (previously allowed self-registration as `admin`). Built `EnsureUserHasRole` middleware, applied across all 18 sensitive routes (menu/category mutation, reports, user management, inventory adjustment, order status changes, prediction triggers). Policy: Menu/Category/Reports/Users = admin-only; Order status + Inventory adjustment = admin+cashier; everything else = any authenticated user. Verified via spot-checks across every route group.
- **Order Cancellation Flow implemented.** (2026-06-21) Added cancellation tracking to the `orders` table. Updated the UI and API endpoints to allow cancelling orders with standard reasons ("Out of stock", "Order error", etc.), and secured ML predictions by omitting `Cancelled` rows in analytics (`ReportController`). Further extended this feature so that **Customers** can cancel their own orders, but only while the order remains in the `Pending` state.
- **Dynamic Order Workflow for Non-cooked items:** Added `requires_preparation` schema flag. Bottled drinks/ready-to-eat items bypass the "Cook" phase in the POS queue, going straight from `Pending` to `Ready`.
- Docs complete: `DECISIONS.md`, `API_CONTRACT.md`, `DATABASE.md`, `STATUS.md`, `REQUIREMENTS.md`, `ARCHITECTURE.md`.
- One full docs-vs-code alignment audit run — found and fixed the access-control gap and an undocumented `order_type` (Take Away/Dine In) feature.

## In progress
Nothing currently mid-task — last item (inventory route confirmation) closed out and logged.

## Next concrete task
Re-run the docs-vs-code alignment audit one more time, now that the role middleware rollout and register() fix have landed — confirm nothing from this round drifted, and update docs if anything new turns up.

## Known gaps (not blocking, but not forgotten)
- `model_runs.training_rows` / `trained_at` / `notes` never populated — `metrics.json` doesn't return them.
- `users` migration not directly verified (role column confirmed indirectly via model/seeder only).
- `inventory_logs.quantity_change` sign convention inferred, not confirmed against actual inventory-adjustment code.
- Combos category has no trained model support — excluded from predictions by design, not planned to be revisited before the defense.
- **Recurring:** manual POS testing keeps introducing quantity outliers into `order_items` (happened twice already). Re-run the outlier check (`OrderItem::where('quantity', '>', 10)`) before any demo or live prediction run.

## Decided, not yet acted on
- Defense materials (`defense_script.md`, `presentation_cheat_sheet.md`) still cite older metrics (0.672/0.7285/0.7156/0.722) that don't match the current `metrics.json` (0.6825/0.7063/0.7946/0.7479) — needs updating before the defense.
- Live end-to-end demo hasn't been run yet against the fully fixed system — worth doing before defense day, not just trusting tonight's individual API responses.
