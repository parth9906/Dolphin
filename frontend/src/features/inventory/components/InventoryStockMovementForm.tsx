import type { FormEventHandler } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import Select from "react-select";
import type {
  InventoryItem,
  InventoryMovementDirection,
  InventoryReferenceType,
} from "../api/inventory-types";

export type InventoryMovementAction = "RECEIPT" | "ISSUE" | "WASTAGE" | "ADJUSTMENT";
type Option<T extends string> = { value: T; label: string };

type InventoryStockMovementFormProps = {
  item: InventoryItem;
  action: InventoryMovementAction;
  onActionChange: (action: InventoryMovementAction) => void;
  allowedActions: Option<InventoryMovementAction>[];
  adjustmentDirection: InventoryMovementDirection;
  onAdjustmentDirectionChange: (direction: InventoryMovementDirection) => void;
  quantity: string;
  onQuantityChange: (quantity: string) => void;
  referenceType: InventoryReferenceType;
  onReferenceTypeChange: (referenceType: InventoryReferenceType) => void;
  remarks: string;
  onRemarksChange: (remarks: string) => void;
  directionOptions: Option<InventoryMovementDirection>[];
  referenceOptions: Option<InventoryReferenceType>[];
  saving: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onClose: () => void;
};

function formatQuantity(value: number | string, unit: string): string {
  const parsed = Number(value ?? 0);
  const formatted = Number.isFinite(parsed)
    ? parsed.toLocaleString(undefined, { maximumFractionDigits: 3 })
    : "0";
  return `${formatted} ${unit}`;
}

export function InventoryStockMovementForm({
  item,
  action,
  onActionChange,
  allowedActions,
  adjustmentDirection,
  onAdjustmentDirectionChange,
  quantity,
  onQuantityChange,
  referenceType,
  onReferenceTypeChange,
  remarks,
  onRemarksChange,
  directionOptions,
  referenceOptions,
  saving,
  onSubmit,
  onClose,
}: InventoryStockMovementFormProps) {
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
        aria-labelledby="inventory-movement-title"
      >
        <div className="inventory-panel-heading">
          <div>
            <h2 id="inventory-movement-title">Record stock movement</h2>
            <p>{item.code} · {item.name}</p>
          </div>
          <button className="inventory-icon-button" aria-label="Close movement form" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="inventory-movement-current">
          <small>Current balance</small>
          <strong>{formatQuantity(item.quantityOnHand, item.unit)}</strong>
        </div>
        <form className="inventory-dialog-form" onSubmit={onSubmit}>
          <label>
            Movement type
            <Select
              className="inventory-select"
              classNamePrefix="inventory-select"
              options={allowedActions}
              value={allowedActions.find((option) => option.value === action) ?? null}
              onChange={(option) => { if (option) onActionChange(option.value); }}
              isSearchable={false}
              isClearable={false}
            />
          </label>
          {action === "ADJUSTMENT" && (
            <label>
              Adjustment direction
              <Select
                className="inventory-select"
                classNamePrefix="inventory-select"
                options={directionOptions}
                value={directionOptions.find((option) => option.value === adjustmentDirection) ?? null}
                onChange={(option) => { if (option) onAdjustmentDirectionChange(option.value); }}
                isSearchable={false}
                isClearable={false}
              />
            </label>
          )}
          <label>
            Quantity ({item.unit})
            <input
              type="number"
              inputMode="decimal"
              min="0.001"
              max="99999999999.999"
              step="0.001"
              value={quantity}
              onChange={(event) => onQuantityChange(event.target.value)}
              required
              placeholder="Enter quantity"
            />
          </label>
          <label>
            Reference type
            <Select
              className="inventory-select"
              classNamePrefix="inventory-select"
              options={referenceOptions}
              value={referenceOptions.find((option) => option.value === referenceType) ?? null}
              onChange={(option) => { if (option) onReferenceTypeChange(option.value); }}
              isSearchable={false}
              isClearable={false}
            />
          </label>
          <label className="inventory-dialog-wide">
            Remarks <span className="inventory-muted">(optional, up to 500 characters)</span>
            <textarea
              value={remarks}
              onChange={(event) => onRemarksChange(event.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a note for the stock ledger…"
            />
          </label>
          <p className="inventory-help">
            Issues and wastage cannot exceed available stock. Movements are append-only and update the item balance.
          </p>
          <div className="inventory-form-actions inventory-dialog-wide">
            <button type="button" className="inventory-button inventory-button--quiet" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="inventory-button inventory-button--primary" disabled={saving || !quantity}>
              {saving ? <LoaderCircle className="inventory-spin" size={16} /> : <Check size={16} />}
              Save movement
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
