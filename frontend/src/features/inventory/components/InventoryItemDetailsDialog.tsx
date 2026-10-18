import { LoaderCircle, X } from "lucide-react";
import type { InventoryItem } from "../api/inventory-types";

interface InventoryItemDetailsDialogProps {
  item: InventoryItem;
  loading: boolean;
  onClose: () => void;
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function quantity(value: number | string, unit: string): string {
  return `${numberValue(value).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`;
}

function labelFor(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function formatDateTime(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function InventoryItemDetailsDialog({
  item,
  loading,
  onClose,
}: InventoryItemDetailsDialogProps) {
  return (
    <div
      className="inventory-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="inventory-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-detail-title"
        aria-describedby="inventory-detail-description"
      >
        <div className="inventory-panel-heading">
          <div>
            <h2 id="inventory-detail-title">Item details</h2>
            <p id="inventory-detail-description">{item.code}</p>
          </div>
          <button className="inventory-icon-button" aria-label="Close item details" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        {loading ? (
          <div className="inventory-state" role="status">
            <LoaderCircle className="inventory-spin" size={22} /> Loading item…
          </div>
        ) : (
          <div className="inventory-detail-body">
            <h3>{item.name}</h3>
            <div className="inventory-detail-grid">
              <div><small>Category</small><strong>{labelFor(item.category)}</strong></div>
              <div><small>Unit</small><strong>{labelFor(item.unit)}</strong></div>
              <div><small>Quantity on hand</small><strong>{quantity(item.quantityOnHand, item.unit)}</strong></div>
              <div><small>Reorder level</small><strong>{quantity(item.reorderLevel, item.unit)}</strong></div>
              <div><small>Stock status</small><strong>{item.lowStock ? "Low stock" : "In range"}</strong></div>
              <div><small>Item status</small><strong>{item.active ? "Active" : "Inactive"}</strong></div>
              <div><small>Last updated</small><strong>{formatDateTime(item.updatedAt)}</strong></div>
              <div><small>Version</small><strong>{item.version}</strong></div>
            </div>
            <div className="inventory-detail-id"><span>Item ID</span><code>{item.id}</code></div>
            {item.campusId && <div className="inventory-detail-id"><span>Campus ID</span><code>{item.campusId}</code></div>}
          </div>
        )}
        <div className="inventory-form-actions">
          <button className="inventory-button inventory-button--quiet" onClick={onClose}>Close</button>
        </div>
      </section>
    </div>
  );
}
