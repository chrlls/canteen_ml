# CanPredict — Database Schema

Reflects the live schema as of 2026-06-20, after the `demand_predictions` cleanup (AcademicCalendar columns removed) and the outlier deletions documented in `DECISIONS.md`. Update this file in the same commit as any migration change — it should never describe a schema that no longer exists.

---

## `categories`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| name | string | Canonical values after rename: `Main Meal`, `Snack`, `Beverage`, `Dessert`, `Combos`. Must exactly match `category_encoder.pkl`'s trained vocabulary for the first 4 — `Combos` is intentionally excluded from prediction (see `DECISIONS.md`). |
| description | string, nullable | |
| timestamps | | |

**Relationships:** `hasMany(MenuItem)`

---

## `menu_items`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| category_id | FK → categories, cascade delete | |
| name | string | |
| description | text, nullable | |
| price | decimal(8,2) | This is `unit_price` in the ML feature set |
| stock | integer, default 0 | |
| is_available | boolean, default true | |
| image | string, nullable | |
| timestamps | | |

**Relationships:** `belongsTo(Category)`, `hasMany(OrderItem)`, `hasMany(InventoryLog)`

**Live seeded data:** 30 items total — 7 Main Meal, 6 Snack, 6 Beverage, 6 Dessert, 5 Combos.

---

## `orders`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| user_id | FK → users, cascade delete | |
| order_number | string, unique | Seeder pattern: `ORD-00001`...`ORD-00200`. Anything outside this pattern is manual/test data, not seeded — used as the signal to identify and remove test orders (see `DECISIONS.md`). |
| total_amount | decimal(10,2) | |
| status | enum: `Pending`, `Preparing`, `Ready`, `Completed`, `Cancelled` — default `Pending` | MySQL enum matching is case-insensitive on write, canonical-case on read — seeder inserts lowercase, DB always returns the capitalized defined values. |
| order_type | enum: `Take Away`, `Dine In` — default `Take Away` | Added after initial schema (found via doc-alignment audit, 2026-06-20). Validated in `OrderController::store`. Not currently used anywhere in the prediction pipeline — `PredictionController` only counts `quantity`/`status`, not `order_type`. |
| timestamps | | |

**Relationships:** `belongsTo(User)`, `hasMany(OrderItem)`

**Live data note:** all 5 status values are present in seeded data. `total_units_sold` in the prediction pipeline filters to `status = 'Completed'` only (fixed 2026-06-20 — see `DECISIONS.md`); Cancelled/Pending/Preparing/Ready orders do not count toward demand.

---

## `order_items`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| order_id | FK → orders, cascade delete | |
| menu_item_id | FK → menu_items, cascade delete | |
| quantity | integer | Seeder range: 1–3 (`rand(1,3)`). Real seeded data confirmed range 1–3 after outlier cleanup; average ≈3.05. Anything double-digit-plus is not from the seeder. |
| price | decimal(8,2) | Price *at time of order* — may differ from `menu_items.price` if the item's price changed since. Worth noting in any report that discusses revenue, since this is the historically accurate price, not the current one. |
| timestamps | | |

**Relationships:** `belongsTo(Order)`, `belongsTo(MenuItem)`

**This is the table `PredictionController` sums `quantity` over** (last 7 days, `Completed` orders only) to compute `total_units_sold` and `avg_daily_units` for the ML payload.

---

## `inventory_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| menu_item_id | FK → menu_items, cascade delete | |
| quantity_change | integer | Positive = restock, negative = depletion (sign convention inferred from column name — not yet verified against actual inventory-adjustment code; confirm before documenting further if this table becomes relevant to the ML pipeline). |
| reason | string, nullable | |
| timestamps | | |

**Relationships:** `belongsTo(MenuItem)`

**Not currently used anywhere in the prediction pipeline** — exists for `InventoryController`'s stock-tracking features only.

---

## `users`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | Standard Laravel default migration |
| name | string | |
| email | string, unique | |
| password | string, hashed | |
| role | string | `admin`, `cashier`, or `customer` per `UserSeeder`. **Gap:** the migration adding this column wasn't extracted directly — confirmed only via `User::$fillable` and seeded values. Low risk, but worth a quick look if role-based permissions become security-relevant later. |
| email_verified_at | timestamp, nullable | |
| remember_token | string, nullable | |
| timestamps | | |

**Relationships:** `hasMany(Order)`. Uses `HasApiTokens` (Sanctum) for API auth.

---

## `demand_predictions`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| menu_item_id | FK → menu_items, cascade delete | |
| week_start | date | Monday of the predicted ISO week |
| predicted_label | enum: `High Demand`, `Low Demand` | |
| confidence_score | decimal(5,4), nullable | |
| actual_units_sold | integer, nullable | Filled in after the week passes, for predicted-vs-actual comparison — not yet wired up anywhere in the codebase as of this writing |
| timestamps | | |

**Unique constraint:** `(menu_item_id, week_start)` — one prediction per item per week.

**Relationships:** `belongsTo(MenuItem)`

**Note:** `is_break_week`, `is_exam_week`, `is_enrollment_week` columns were removed 2026-06-20 (see `DECISIONS.md` — AcademicCalendar cleanup). If you're looking at an older ERD or an earlier version of this file, those columns no longer exist.

**Combos items never get a row here** — they're filtered out before the Flask call (see `DECISIONS.md`).

---

## `model_runs`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| accuracy | decimal(5,4) | |
| precision | decimal(5,4) | |
| recall | decimal(5,4) | |
| f1_score | decimal(5,4) | |
| training_rows | integer, nullable | Currently always null — Flask's `/metrics` doesn't return this field |
| trained_at | timestamp | Currently always set to sync-time, not real training time — same root cause |
| notes | text, nullable | Currently always null, same reason |
| timestamps | | |

**No foreign keys** — standalone historical log, one row per metrics sync.

---

## Entity relationships (text form)

```
users 1───* orders 1───* order_items *───1 menu_items *───1 categories
                                              │
                                              ├──* inventory_logs
                                              └──* demand_predictions

model_runs (standalone, no FKs)
```

## Known gaps in this document
- `users` migration not directly extracted — `role` column confirmed only indirectly (model + seeder). Revisit if role-based access control becomes a documented requirement.
- `inventory_logs.quantity_change` sign convention is inferred, not confirmed against actual `InventoryController` logic.