export type InventoryItemCategory =
  | "STATIONERY"
  | "FOOD"
  | "CLEANING"
  | "UNIFORM"
  | "EQUIPMENT"
  | "MEDICAL"
  | "OTHER";

export type InventoryUnit =
  | "PIECE"
  | "KG"
  | "GRAM"
  | "LITRE"
  | "MILLILITRE"
  | "PACKET"
  | "BOX"
  | "DOZEN";

export type InventoryMovementType =
  | "RECEIPT"
  | "ISSUE"
  | "WASTAGE"
  | "ADJUSTMENT";

export type InventoryMovementDirection = "IN" | "OUT";

export type InventoryReferenceType =
  | "MANUAL"
  | "PURCHASE"
  | "STOCKTAKE";

export interface InventoryItem {
  id: string;
  institutionId: string;
  campusId: string | null;
  code: string;
  name: string;
  category: InventoryItemCategory;
  unit: InventoryUnit;
  quantityOnHand: number | string;
  reorderLevel: number | string;
  lowStock: boolean;
  active: boolean;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface InventoryStockMovement {
  id: string;
  itemId: string;
  movementType: InventoryMovementType;
  direction: InventoryMovementDirection;
  quantity: number | string;
  balanceAfter: number | string;
  referenceType: string | null;
  referenceId: string | null;
  remarks: string | null;
  recordedByUserId: string;
  occurredAt: string | null;
  createdAt: string;
}

export interface InventoryPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface InventoryItemSearch {
  institutionId: string;
  campusId?: string;
  category?: InventoryItemCategory;
  active?: boolean;
  lowStockOnly?: boolean;
  page: number;
  size: number;
}

export interface CreateInventoryItemRequest {
  institutionId: string;
  campusId?: string | null;
  code: string;
  name: string;
  category: InventoryItemCategory;
  unit: InventoryUnit;
  reorderLevel: number;
}

export interface UpdateInventoryItemRequest {
  name: string;
  category: InventoryItemCategory;
  unit: InventoryUnit;
  reorderLevel: number;
  version: number;
}

export interface RecordStockMovementRequest {
  quantity: number;
  referenceType?: InventoryReferenceType;
  referenceId?: string | null;
  remarks?: string | null;
}

export interface AdjustStockRequest extends RecordStockMovementRequest {
  direction: InventoryMovementDirection;
}

export interface InventoryMovementSearch {
  movementType?: InventoryMovementType;
  page: number;
  size: number;
}
