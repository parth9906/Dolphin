-- Canteen/mess meal service. Inventory consumption is stored in the inventory
-- stock ledger (inventory_stock_movement with reference_type = 'MESS_MEAL'),
-- so this table only holds the meal header.
CREATE TABLE mess_meal_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID NOT NULL REFERENCES institution(id),
    campus_id UUID REFERENCES campus(id),
    meal_type VARCHAR(20) NOT NULL,
    served_on DATE NOT NULL,
    headcount INTEGER NOT NULL,
    notes VARCHAR(1000),
    recorded_by_user_id UUID NOT NULL REFERENCES user_account(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_mess_meal_type
        CHECK (meal_type IN ('BREAKFAST', 'LUNCH', 'SNACK', 'DINNER')),

    CONSTRAINT chk_mess_meal_headcount
        CHECK (headcount > 0)
);

CREATE INDEX idx_mess_meal_institution_served_on
    ON mess_meal_record(institution_id, served_on DESC);

CREATE INDEX idx_mess_meal_campus_served_on
    ON mess_meal_record(campus_id, served_on DESC);
