import {
  AlertCircle,
  Archive,
  History,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
} from "lucide-react";
import type { InventoryItem } from "../api/inventory-types";

export type InventoryMovementAction = "RECEIPT" | "ISSUE" | "WASTAGE" | "ADJUSTMENT";

type InventoryItemsListProps = {
  items: InventoryItem[];
  loading: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canReadMovements: boolean;
  allowedMovementActions: InventoryMovementAction[];
  saving: boolean;
  onOpenDetails: (item: InventoryItem) => void;
  onEdit: (item: InventoryItem) => void;
  onRecordMovement: (item: InventoryItem, action: InventoryMovementAction) => void;
  onOpenLedger: (item: InventoryItem) => void;
  onDeactivate: (item: InventoryItem) => void;
};

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

export function InventoryItemsList({
  items,
  loading,
  canRead,
  canUpdate,
  canReadMovements,
  allowedMovementActions,
  saving,
  onOpenDetails,
  onEdit,
  onRecordMovement,
  onOpenLedger,
  onDeactivate,
}: InventoryItemsListProps) {
  if (loading) {
    return <div className="inventory-state" role="status" aria-live="polite"><LoaderCircle className="inventory-spin" size={22} /> Loading inventory…</div>;
  }

  if (!canRead) {
    return <div className="inventory-state" role="status"><AlertCircle size={23} /><strong>Inventory read permission required</strong></div>;
  }

  if (items.length === 0) {
    return <div className="inventory-state" role="status"><Package size={24} /><strong>No items found</strong><span>Try different filters or create an inventory item.</span></div>;
  }

  return (
    <>
      <div className="inventory-table-wrap inventory-items-desktop">
        <table className="inventory-table">
          <caption className="inventory-sr-only">Inventory items and available actions</caption>
          <thead>
            <tr>
              <th scope="col">Item</th><th scope="col">Category</th><th scope="col">On hand</th><th scope="col">Reorder level</th><th scope="col">Stock status</th><th scope="col">Item status</th><th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  <button className="inventory-item-name" onClick={() => onOpenDetails(item)}>{item.name}</button>
                  <small className="inventory-item-code">{item.code}</small>
                </td>
                <td><span className="inventory-category-pill">{labelFor(item.category)}</span></td>
                <td><strong>{quantity(item.quantityOnHand, item.unit)}</strong></td>
                <td>{quantity(item.reorderLevel, item.unit)}</td>
                <td><span className={`inventory-stock-pill ${item.lowStock ? "inventory-stock-pill--low" : "inventory-stock-pill--ok"}`}>{item.lowStock ? "Low stock" : "In range"}</span></td>
                <td><span className={`inventory-active-pill ${item.active ? "inventory-active-pill--yes" : "inventory-active-pill--no"}`}>{item.active ? "Active" : "Inactive"}</span></td>
                <td><div className="inventory-actions">
                  {canUpdate && item.active && <button className="inventory-icon-button" title="Edit item" aria-label={`Edit ${item.name}`} onClick={() => onEdit(item)}><Pencil size={15} /></button>}
                  {item.active && allowedMovementActions.length > 0 && <button className="inventory-icon-button" title="Record stock movement" aria-label={`Record stock movement for ${item.name}`} onClick={() => onRecordMovement(item, allowedMovementActions[0])}><Plus size={16} /></button>}
                  {canReadMovements && <button className="inventory-icon-button" title="Movement history" aria-label={`Movement history for ${item.name}`} onClick={() => onOpenLedger(item)}><History size={16} /></button>}
                  {canUpdate && item.active && numberValue(item.quantityOnHand) === 0 && <button className="inventory-icon-button inventory-icon-button--danger" title="Deactivate item" aria-label={`Deactivate ${item.name}`} disabled={saving} onClick={() => onDeactivate(item)}><Archive size={15} /></button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inventory-items-mobile" aria-label="Inventory items">
        {items.map((item) => (
          <article className="inventory-item-card" key={item.id}>
            <div className="inventory-item-card-heading">
              <div><button className="inventory-item-name" onClick={() => onOpenDetails(item)}>{item.name}</button><small className="inventory-item-code">{item.code}</small></div>
              <span className={`inventory-active-pill ${item.active ? "inventory-active-pill--yes" : "inventory-active-pill--no"}`}>{item.active ? "Active" : "Inactive"}</span>
            </div>
            <div className="inventory-item-card-badges">
              <span className="inventory-category-pill">{labelFor(item.category)}</span>
              <span className={`inventory-stock-pill ${item.lowStock ? "inventory-stock-pill--low" : "inventory-stock-pill--ok"}`}>{item.lowStock ? "Low stock" : "In range"}</span>
            </div>
            <dl className="inventory-item-card-details">
              <div><dt>On hand</dt><dd>{quantity(item.quantityOnHand, item.unit)}</dd></div>
              <div><dt>Reorder level</dt><dd>{quantity(item.reorderLevel, item.unit)}</dd></div>
            </dl>
            <div className="inventory-item-card-actions">
              {canUpdate && item.active && <button className="inventory-button inventory-button--quiet" onClick={() => onEdit(item)}><Pencil size={15} /> Edit</button>}
              {item.active && allowedMovementActions.length > 0 && <button className="inventory-button inventory-button--quiet" onClick={() => onRecordMovement(item, allowedMovementActions[0])}><Plus size={15} /> Stock movement</button>}
              {canReadMovements && <button className="inventory-button inventory-button--quiet" onClick={() => onOpenLedger(item)}><History size={15} /> History</button>}
              {canUpdate && item.active && numberValue(item.quantityOnHand) === 0 && <button className="inventory-button inventory-button--quiet inventory-item-card-danger" disabled={saving} onClick={() => onDeactivate(item)}><Archive size={15} /> Deactivate</button>}
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
