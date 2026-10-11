# Mess / Canteen

Status: **Implemented** (V1 feature #5, integrated with inventory)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns mess/canteen meal records. A meal record captures the meal type, date,
headcount and the inventory consumption lines that were issued for it. Creating
a meal issues stock through the `inventory` ledger.

Included in V1: create meal (with consumption lines), search, read-by-id.

Excluded: menu planning, per-student meal attendance, costing, billing.

Dependencies: `organization`, `inventory` (stock issue), `identity`.

Principal classes: `controller/MessMealController`,
`service/MessMealService`,
`entity/{MessMealRecord,MessMealType}`.

## B. API conventions

- Base path: `/api/v1/mess/meals`.
- Authentication: bearer.
- Scope: institution/campus scope.
- Pagination: search returns `Page<MessMealSummaryResponse>`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/mess/meals` | Create meal + consume stock | `MESS_MEAL_CREATE` **and** `INVENTORY_STOCK_ISSUE` | institution/campus |
| GET | `/api/v1/mess/meals` | Search meals | `MESS_MEAL_READ` | institution/campus |
| GET | `/api/v1/mess/meals/{mealId}` | Read meal | `MESS_MEAL_READ` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/mess/meals

Requires **both** `MESS_MEAL_CREATE` and `INVENTORY_STOCK_ISSUE` (meal creation
issues inventory). Request (`CreateMessMealRequest`):

| Field | Type | Required | Constraints |
|---|---|---|---|
| `institutionId` | UUID | yes | - |
| `campusId` | UUID | no | - |
| `mealType` | enum | yes | `BREAKFAST|LUNCH|SNACK|DINNER` |
| `servedOn` | date | yes | past or present |
| `headcount` | int | yes | >= 1 |
| `notes` | string | no | <= 1000 |
| `consumptions` | array | yes | 1..100 entries of `{ itemId (UUID), quantity (> 0, 11.3 digits) }` |

```json
{
  "institutionId": "1111...",
  "campusId": null,
  "mealType": "LUNCH",
  "servedOn": "2026-01-15",
  "headcount": 220,
  "notes": "Regular lunch",
  "consumptions": [
    { "itemId": "aaaa...", "quantity": 25.000 },
    { "itemId": "bbbb...", "quantity": 12.500 }
  ]
}
```

- Response `201` `MessMealResponse`:

```json
{
  "id": "cccc...",
  "institutionId": "1111...",
  "campusId": null,
  "mealType": "LUNCH",
  "servedOn": "2026-01-15",
  "headcount": 220,
  "notes": "Regular lunch",
  "recordedByUserId": "dddd...",
  "createdAt": "2026-01-15T13:05:00+05:30",
  "consumptions": [
    { "itemId": "aaaa...", "itemCode": "RICE", "itemName": "Rice", "unit": "KG", "quantity": 25.000 }
  ]
}
```

- Errors: `400`, `403`, `404` (unknown item), `422` (insufficient stock, future
  `servedOn`, inactive item).
- Side effects: creates `InventoryStockMovement` `ISSUE` rows with
  `referenceType = MESS_MEAL` and `referenceId` = meal id; decrements stock.

### GET /api/v1/mess/meals

Query: `institutionId` (required), `campusId` (optional), `fromDate`/`toDate`
(optional, ISO date), `page`,`size`,`sort` (default `size=20`, `sort=servedOn`).
Response `200` `Page<MessMealSummaryResponse>` (no consumption lines).

### GET /api/v1/mess/meals/{mealId}

Response `200` `MessMealResponse` (with consumption lines). Errors `403`, `404`.

## E. Validation and business rules

- `servedOn` must be past or present.
- `headcount >= 1`; 1..100 consumption lines.
- Each consumption quantity > 0, 3 decimals; item must be active and in scope;
  stock must be sufficient (`422` otherwise).
- Meal creation is transactional and issues stock atomically.

## F. Authorization matrix

| Permission | Read | Create |
|---|---|---|
| `MESS_MEAL_READ` | yes | - |
| `MESS_MEAL_CREATE` + `INVENTORY_STOCK_ISSUE` | - | yes |

## G. Error contract

`400`, `403`, `404`, `422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

Meal records are append-only; no update/delete/cancel in V1.

## I. Dependencies and integrations

- `inventory`: every meal consumes stock through the shared ledger; the
  `referenceType = MESS_MEAL` link is a soft reference (`referenceId`).

## J. Open issues and implementation gaps

- No meal update/cancel, so a recording mistake cannot be reversed (a
  compensating adjustment must be made in `inventory`).
- The link between a meal and its stock movements is a soft `referenceId` with
  no foreign key.
- No per-student meal tracking or cost/billing.
