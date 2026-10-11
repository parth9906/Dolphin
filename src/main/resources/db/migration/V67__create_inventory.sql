CREATE TABLE inventory_item (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity_on_hand NUMERIC(14, 3) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(14, 3) NOT NULL DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT uk_inventory_item_institution_code
        UNIQUE (institution_id, code),

    CONSTRAINT chk_inventory_item_category
        CHECK (category IN (
            'STATIONERY',
            'FOOD',
            'CLEANING',
            'UNIFORM',
            'EQUIPMENT',
            'MEDICAL',
            'OTHER'
        )),

    CONSTRAINT chk_inventory_item_unit
        CHECK (unit IN (
            'PIECE',
            'KG',
            'GRAM',
            'LITRE',
            'MILLILITRE',
            'PACKET',
            'BOX',
            'DOZEN'
        )),

    CONSTRAINT chk_inventory_item_quantity_on_hand
        CHECK (quantity_on_hand >= 0),

    CONSTRAINT chk_inventory_item_reorder_level
        CHECK (reorder_level >= 0)
);

CREATE INDEX idx_inventory_item_institution_active
    ON inventory_item(institution_id, active);

CREATE INDEX idx_inventory_item_institution_campus
    ON inventory_item(institution_id, campus_id);

-- Immutable stock ledger. The current on-hand quantity on inventory_item is a
-- denormalized balance kept in step with this ledger inside a single
-- transaction; the ledger is the audit trail and must never be mutated.
CREATE TABLE inventory_stock_movement (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES inventory_item(id),
    institution_id UUID NOT NULL REFERENCES institution(id),
    movement_type VARCHAR(20) NOT NULL,
    direction VARCHAR(3) NOT NULL,
    quantity NUMERIC(14, 3) NOT NULL,
    balance_after NUMERIC(14, 3) NOT NULL,
    reference_type VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    reference_id UUID,
    remarks VARCHAR(500),
    recorded_by_user_id UUID NOT NULL REFERENCES user_account(id),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_inventory_movement_type
        CHECK (movement_type IN (
            'RECEIPT', 'ISSUE', 'WASTAGE', 'ADJUSTMENT'
        )),

    CONSTRAINT chk_inventory_movement_direction
        CHECK (direction IN ('IN', 'OUT')),

    CONSTRAINT chk_inventory_movement_quantity
        CHECK (quantity > 0),

    CONSTRAINT chk_inventory_movement_balance
        CHECK (balance_after >= 0),

    CONSTRAINT chk_inventory_movement_reference_type
        CHECK (reference_type IN (
            'MANUAL', 'PURCHASE', 'MESS_MEAL', 'STOCKTAKE'
        )),

    -- Receipts always increase stock, issues and wastage always decrease it;
    -- only an adjustment may go either way.
    CONSTRAINT chk_inventory_movement_direction_matches_type
        CHECK (
            (movement_type = 'RECEIPT' AND direction = 'IN')
            OR (movement_type IN ('ISSUE', 'WASTAGE') AND direction = 'OUT')
            OR movement_type = 'ADJUSTMENT'
        )
);

CREATE INDEX idx_inventory_movement_item_occurred
    ON inventory_stock_movement(item_id, occurred_at DESC);

CREATE INDEX idx_inventory_movement_institution_occurred
    ON inventory_stock_movement(institution_id, occurred_at DESC);

-- A mess meal must not double-issue the same item for the same meal. The index
-- is intentionally scoped to MESS_MEAL so repeated movements against a shared
-- reference (for example partial receipts against one purchase order) remain
-- allowed for the other reference types.
CREATE UNIQUE INDEX uk_inventory_movement_mess_meal_item
    ON inventory_stock_movement(reference_id, item_id)
    WHERE reference_type = 'MESS_MEAL' AND reference_id IS NOT NULL;
