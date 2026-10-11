INSERT INTO permission (
    id,
    code,
    name,
    description,
    active,
    created_at,
    updated_at
)
VALUES
    (
        gen_random_uuid(),
        'INVENTORY_ITEM_CREATE',
        'Create Inventory Item',
        'Create inventory items for an institution or campus store',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_ITEM_READ',
        'Read Inventory Item',
        'View inventory items and their current stock levels',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_ITEM_UPDATE',
        'Update Inventory Item',
        'Update inventory item details and deactivate items',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_STOCK_READ',
        'Read Inventory Stock Movements',
        'View the stock movement ledger for an inventory item',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_STOCK_RECEIVE',
        'Receive Inventory Stock',
        'Record stock receipts that increase inventory on hand',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_STOCK_ISSUE',
        'Issue Inventory Stock',
        'Record stock issues and wastage that decrease inventory on hand',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        gen_random_uuid(),
        'INVENTORY_STOCK_ADJUST',
        'Adjust Inventory Stock',
        'Record positive or negative stock adjustments after a stocktake',
        TRUE,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permission (role_id, permission_id)
SELECT r.id, p.id
FROM role r
CROSS JOIN permission p
WHERE r.code = 'PLATFORM_ADMIN'
  AND p.code IN (
      'INVENTORY_ITEM_CREATE',
      'INVENTORY_ITEM_READ',
      'INVENTORY_ITEM_UPDATE',
      'INVENTORY_STOCK_READ',
      'INVENTORY_STOCK_RECEIVE',
      'INVENTORY_STOCK_ISSUE',
      'INVENTORY_STOCK_ADJUST'
  )
ON CONFLICT DO NOTHING;
