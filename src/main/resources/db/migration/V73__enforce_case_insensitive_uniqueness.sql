-- The application checks these codes case-insensitively (exists...IgnoreCase),
-- but the original UNIQUE constraints were case-sensitive, so concurrent or
-- direct inserts could create codes that differ only by case. Replace them with
-- functional unique indexes on lower(...) to make the database agree with the
-- application rule.
ALTER TABLE inventory_item
    DROP CONSTRAINT uk_inventory_item_institution_code;

CREATE UNIQUE INDEX uk_inventory_item_institution_code_ci
    ON inventory_item (institution_id, lower(code));

ALTER TABLE hostel
    DROP CONSTRAINT uk_hostel_institution_code;

CREATE UNIQUE INDEX uk_hostel_institution_code_ci
    ON hostel (institution_id, lower(code));

ALTER TABLE hostel_room
    DROP CONSTRAINT uk_hostel_room_number;

CREATE UNIQUE INDEX uk_hostel_room_number_ci
    ON hostel_room (hostel_id, lower(room_number));
