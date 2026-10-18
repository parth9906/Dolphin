import { apiClient } from "../../../lib/api/api-client";
import type {
  AdjustStockRequest,
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryItemSearch,
  InventoryMovementSearch,
  InventoryPage,
  InventoryStockMovement,
  RecordStockMovementRequest,
  UpdateInventoryItemRequest,
} from "./inventory-types";

export const inventoryService = {
  searchItems(filters: InventoryItemSearch): Promise<InventoryPage<InventoryItem>> {
    const params = new URLSearchParams();
    params.set("institutionId", filters.institutionId);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    params.set("sort", "name,asc");

    if (filters.campusId) params.set("campusId", filters.campusId);
    if (filters.category) params.set("category", filters.category);
    if (filters.active !== undefined) params.set("active", String(filters.active));
    if (filters.lowStockOnly !== undefined) {
      params.set("lowStockOnly", String(filters.lowStockOnly));
    }

    return apiClient.get<InventoryPage<InventoryItem>>(
      `inventory/items?${params.toString()}`,
    );
  },

  getItem(id: string): Promise<InventoryItem> {
    return apiClient.get<InventoryItem>(`inventory/items/${encodeURIComponent(id)}`);
  },

  createItem(request: CreateInventoryItemRequest): Promise<InventoryItem> {
    return apiClient.post<InventoryItem>("inventory/items", request);
  },

  updateItem(id: string, request: UpdateInventoryItemRequest): Promise<InventoryItem> {
    return apiClient.put<InventoryItem>(
      `inventory/items/${encodeURIComponent(id)}`,
      request,
    );
  },

  deactivateItem(id: string): Promise<InventoryItem> {
    return apiClient.patch<InventoryItem>(
      `inventory/items/${encodeURIComponent(id)}/deactivate`,
      undefined,
    );
  },

  recordReceipt(id: string, request: RecordStockMovementRequest): Promise<InventoryStockMovement> {
    return apiClient.post<InventoryStockMovement>(
      `inventory/items/${encodeURIComponent(id)}/receipts`,
      request,
    );
  },

  recordIssue(id: string, request: RecordStockMovementRequest): Promise<InventoryStockMovement> {
    return apiClient.post<InventoryStockMovement>(
      `inventory/items/${encodeURIComponent(id)}/issues`,
      request,
    );
  },

  recordWastage(id: string, request: RecordStockMovementRequest): Promise<InventoryStockMovement> {
    return apiClient.post<InventoryStockMovement>(
      `inventory/items/${encodeURIComponent(id)}/wastage`,
      request,
    );
  },

  adjustStock(id: string, request: AdjustStockRequest): Promise<InventoryStockMovement> {
    return apiClient.post<InventoryStockMovement>(
      `inventory/items/${encodeURIComponent(id)}/adjustments`,
      request,
    );
  },

  listMovements(
    id: string,
    filters: InventoryMovementSearch,
  ): Promise<InventoryPage<InventoryStockMovement>> {
    const params = new URLSearchParams();
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    params.set("sort", "occurredAt,desc");
    if (filters.movementType) params.set("movementType", filters.movementType);

    return apiClient.get<InventoryPage<InventoryStockMovement>>(
      `inventory/items/${encodeURIComponent(id)}/movements?${params.toString()}`,
    );
  },
};
