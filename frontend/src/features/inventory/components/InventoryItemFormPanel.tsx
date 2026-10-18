import type { FormEventHandler } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import Select from "react-select";
import type { InventoryItem, InventoryItemCategory, InventoryUnit } from "../api/inventory-types";

type Option<T extends string> = { value: T; label: string };

interface InventoryItemFormPanelProps {
  editingItem: InventoryItem | null;
  itemCode: string;
  onItemCodeChange: (value: string) => void;
  itemName: string;
  onItemNameChange: (value: string) => void;
  itemCategory: InventoryItemCategory;
  onItemCategoryChange: (value: InventoryItemCategory) => void;
  itemUnit: InventoryUnit;
  onItemUnitChange: (value: InventoryUnit) => void;
  reorderLevel: string;
  onReorderLevelChange: (value: string) => void;
  categories: Option<InventoryItemCategory>[];
  units: Option<InventoryUnit>[];
  saving: boolean;
  institutionSelected: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
  onCancel: () => void;
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function quantity(value: number | string, unit: string): string {
  return `${numberValue(value).toLocaleString(undefined, { maximumFractionDigits: 3 })} ${unit}`;
}

export function InventoryItemFormPanel({
  editingItem,
  itemCode,
  onItemCodeChange,
  itemName,
  onItemNameChange,
  itemCategory,
  onItemCategoryChange,
  itemUnit,
  onItemUnitChange,
  reorderLevel,
  onReorderLevelChange,
  categories,
  units,
  saving,
  institutionSelected,
  onSubmit,
  onClose,
  onCancel,
}: InventoryItemFormPanelProps) {
  return (
    <section className="inventory-panel">
      <div className="inventory-panel-heading">
        <div>
          <h2>{editingItem ? "Edit inventory item" : "Create inventory item"}</h2>
          <p>
            {editingItem
              ? "Update the details and reorder threshold. The current stock balance is kept."
              : "New items start at zero stock. Use a receipt movement to add stock."}
          </p>
        </div>
        <button className="inventory-icon-button" aria-label="Close item form" onClick={onClose}>
          <X size={18} />
        </button>
      </div>
      <form className="inventory-form" onSubmit={onSubmit}>
        <label>
          Item code
          <input
            value={itemCode}
            onChange={(event) => onItemCodeChange(event.target.value)}
            maxLength={50}
            required={!editingItem}
            readOnly={Boolean(editingItem)}
            placeholder={editingItem ? undefined : "e.g. STN-001"}
          />
          <small>{editingItem ? "Item codes cannot be changed after creation." : "Unique within the institution."}</small>
        </label>
        <label>
          Item name
          <input value={itemName} onChange={(event) => onItemNameChange(event.target.value)} maxLength={200} required placeholder="e.g. A4 notebook" />
        </label>
        <label>
          Category
          <Select
            className="inventory-select"
            classNamePrefix="inventory-select"
            options={categories}
            value={categories.find((option) => option.value === itemCategory) ?? null}
            onChange={(option) => { if (option) onItemCategoryChange(option.value); }}
            isSearchable
            isClearable={false}
          />
        </label>
        <label>
          Unit of measure
          <Select
            className="inventory-select"
            classNamePrefix="inventory-select"
            options={units}
            value={units.find((option) => option.value === itemUnit) ?? null}
            onChange={(option) => { if (option) onItemUnitChange(option.value); }}
            isSearchable
            isClearable={false}
          />
          {editingItem && numberValue(editingItem.quantityOnHand) > 0 && (
            <small>The unit is locked while stock is on hand.</small>
          )}
        </label>
        <label>
          Reorder level
          <input type="number" min="0" step="0.001" value={reorderLevel} onChange={(event) => onReorderLevelChange(event.target.value)} required />
          <small>Low-stock flag is derived from this threshold.</small>
        </label>
        {editingItem && (
          <div className="inventory-current-balance">
            <small>Current stock balance</small>
            <strong>{quantity(editingItem.quantityOnHand, editingItem.unit)}</strong>
          </div>
        )}
        <div className="inventory-form-actions inventory-form-wide">
          <button type="button" className="inventory-button inventory-button--quiet" onClick={onCancel}>Cancel</button>
          <button type="submit" className="inventory-button inventory-button--primary" disabled={saving || !institutionSelected}>
            {saving ? <LoaderCircle className="inventory-spin" size={16} /> : <Check size={16} />}
            {editingItem ? "Save changes" : "Create item"}
          </button>
        </div>
      </form>
    </section>
  );
}
