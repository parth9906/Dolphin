# Inventory Management

Status: **Implemented** (V1 feature #5, integrated with mess)

[Shared conventions](../../../../../../../docs/api/README.md) apply.

## A. Module overview

Owns inventory items (stock-keeping units), a running stock ledger and the
receipt/issue/wastage/adjustment movements that change quantities. Mess meal
records consume inventory through this ledger.

Included in V1: item create/search/read/update/deactivate; stock
receipt/issue/wastage/adjustment; movement history.

Excluded: purchase orders, suppliers, valuation, batch/expiry tracking,
multi-warehouse transfers.

Dependencies: `organization`, `identity`; consumed by `mess`.

Principal classes: `controller/{InventoryItemController,InventoryStockController}`,
`service/{InventoryItemService,InventoryStockService}`,
`entity/{InventoryItem,InventoryStockMovement,InventoryItemCategory,InventoryUnit,InventoryMovementType,InventoryMovementDirection,InventoryReferenceType}`.

## B. API conventions

- Base paths: `/api/v1/inventory/items`, `/api/v1/inventory/items/{itemId}`.
- Authentication: bearer; permissions in the inventory.
- Scope: institution/campus scope.
- Quantities are `BigDecimal` (11 integer digits, 3 decimals).
- Optimistic locking: `InventoryItem` carries `version`.
- Pagination: all lists return `Page<...>`.

## C. Endpoint inventory

| Method | Path | Purpose | Permission | Scope |
|---|---|---|---|---|
| POST | `/api/v1/inventory/items` | Create item | `INVENTORY_ITEM_CREATE` | institution/campus |
| GET | `/api/v1/inventory/items` | Search items | `INVENTORY_ITEM_READ` | institution/campus |
| GET | `/api/v1/inventory/items/{itemId}` | Read item | `INVENTORY_ITEM_READ` | institution/campus |
| PUT | `/api/v1/inventory/items/{itemId}` | Update item | `INVENTORY_ITEM_UPDATE` | institution/campus |
| PATCH | `/api/v1/inventory/items/{itemId}/deactivate` | Deactivate item | `INVENTORY_ITEM_UPDATE` | institution/campus |
| POST | `/api/v1/inventory/items/{itemId}/receipts` | Record receipt | `INVENTORY_STOCK_RECEIVE` | institution/campus |
| POST | `/api/v1/inventory/items/{itemId}/issues` | Record issue | `INVENTORY_STOCK_ISSUE` | institution/campus |
| POST | `/api/v1/inventory/items/{itemId}/wastage` | Record wastage | `INVENTORY_STOCK_ISSUE` | institution/campus |
| POST | `/api/v1/inventory/items/{itemId}/adjustments` | Stock adjustment | `INVENTORY_STOCK_ADJUST` | institution/campus |
| GET | `/api/v1/inventory/items/{itemId}/movements` | Movement history | `INVENTORY_STOCK_READ` | institution/campus |

All `Implemented`.

## D. Endpoint contracts

### POST /api/v1/inventory/items

`CreateInventoryItemRequest`: `institutionId` (required), `campusId`
(optional), `code` (required, <= 50, unique per institution case-insensitive),
`name` (required, <= 200), `category` (required), `unit` (required),
`reorderLevel` (required, >= 0, 11.3 digits). Response `201`
`InventoryItemResponse`.

`InventoryItemCategory` = `STATIONERY | FOOD | CLEANING | UNIFORM | EQUIPMENT |
MEDICAL | OTHER`. `InventoryUnit` = `PIECE | KG | GRAM | LITRE | MILLILITRE |
PACKET | BOX | DOZEN`.

`InventoryItemResponse`: `{ id, institutionId, campusId, code, name, category,
unit, quantityOnHand, reorderLevel, lowStock, active, createdByUserId,
createdAt, updatedAt, version }`.

### GET /api/v1/inventory/items

Query: `institutionId` (required), `campusId` (optional), `category`
(optional), `active` (optional), `lowStockOnly` (default `false`),
`page`,`size`,`sort` (default `size=20`, `sort=name`).

### PUT /api/v1/inventory/items/{itemId}

`UpdateInventoryItemRequest`: `name`, `category`, `unit`, `reorderLevel`,
`version` (required). Response `200`. `409` on stale version.

### PATCH /api/v1/inventory/items/{itemId}/deactivate

Response `200` with `active=false`. Rule: blocked (`422`) while
`quantityOnHand > 0`.

### POST /api/v1/inventory/items/{itemId}/receipts | /issues | /wastage

Body (`RecordStockMovementRequest`): `quantity` (required, > 0, 11.3 digits),
`referenceType` (optional: `MANUAL|PURCHASE|MESS_MEAL|STOCKTAKE`), `referenceId`
(optional), `remarks` (<= 500), `occurredAt` (optional, `OffsetDateTime`; must
not be in the future).
Response `200` `InventoryStockMovementResponse`.
- Receipts increase stock (`IN`); issues and wastage decrease stock (`OUT`).
- Errors: `400`, `403`, `404`, `422` (insufficient stock for issue/wastage,
  future `occurredAt`, inactive item).

### POST /api/v1/inventory/items/{itemId}/adjustments

Body (`AdjustStockRequest`): `direction` (`IN|OUT`, required), `quantity`
(required, > 0), `referenceType`, `referenceId`, `remarks`, `occurredAt`.
Response `200` `InventoryStockMovementResponse`.

### GET /api/v1/inventory/items/{itemId}/movements

Query: `movementType` (optional: `RECEIPT|ISSUE|WASTAGE|ADJUSTMENT`),
`page`,`size`,`sort` (default `size=20`, `sort=occurredAt,desc`).
Response `200` `Page<InventoryStockMovementResponse>` where each row includes
`balanceAfter`.

## E. Validation and business rules

- Item `code` unique per institution (case-insensitive).
- Quantities > 0 with 3 decimal places; stock cannot go negative.
- `occurredAt` cannot be in the future.
- Deactivation blocked while stock remains.
- Ledger rows are immutable; `balanceAfter` records the running balance.
- Optimistic locking on the item.

## F. Authorization matrix

| Permission | Read | Create | Update | Movements |
|---|---|---|---|---|
| `INVENTORY_ITEM_READ` | yes | - | - | - |
| `INVENTORY_ITEM_CREATE` | - | yes | - | - |
| `INVENTORY_ITEM_UPDATE` | - | - | yes/deactivate | - |
| `INVENTORY_STOCK_READ` | yes (ledger) | - | - | - |
| `INVENTORY_STOCK_RECEIVE` | - | - | - | receipts |
| `INVENTORY_STOCK_ISSUE` | - | - | - | issues/wastage |
| `INVENTORY_STOCK_ADJUST` | - | - | - | adjustments |

## G. Error contract

`400`, `403`, `404`, `409 DUPLICATE_RESOURCE`/`CONCURRENT_MODIFICATION`,
`422 BUSINESS_RULE_VIOLATION`.

## H. State transitions

Items are `active` until deactivated (one-way; blocked while stock > 0). The
stock ledger is append-only.

## I. Dependencies and integrations

- `mess`: meal records issue inventory (`referenceType = MESS_MEAL`), which is
  why meal creation requires `INVENTORY_STOCK_ISSUE` in addition to
  `MESS_MEAL_CREATE`.

## J. Open issues and implementation gaps

- No suppliers, purchase orders, valuation or reorder automation (only a
  `lowStock` flag and `lowStockOnly` filter).
- No item reactivation or delete.
- Public ledger primitives (`recordReceipt` etc.) are callable directly; the
  mess module reuses them cross-package.
