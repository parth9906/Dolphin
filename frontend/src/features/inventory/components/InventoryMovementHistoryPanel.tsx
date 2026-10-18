import { ArrowLeft, ArrowRight, History, LoaderCircle, X } from "lucide-react";
import Select from "react-select";
import type {
  InventoryItem,
  InventoryMovementType,
  InventoryPage,
  InventoryStockMovement,
} from "../api/inventory-types";

type MovementFilter = InventoryMovementType | "ALL";
type Option<T extends string> = { value: T; label: string };

interface InventoryMovementHistoryPanelProps {
  item: InventoryItem;
  movements: InventoryStockMovement[];
  loading: boolean;
  page: InventoryPage<InventoryStockMovement> | null;
  pageNumber: number;
  filter: MovementFilter;
  filterOptions: Option<MovementFilter>[];
  onFilterChange: (filter: MovementFilter) => void;
  onPageChange: (direction: "previous" | "next") => void;
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
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function InventoryMovementHistoryPanel({
  item,
  movements,
  loading,
  page,
  pageNumber,
  filter,
  filterOptions,
  onFilterChange,
  onPageChange,
  onClose,
}: InventoryMovementHistoryPanelProps) {
  return (
    <div
      className="inventory-overlay inventory-overlay--ledger"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="inventory-dialog inventory-ledger-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inventory-ledger-title"
        aria-describedby="inventory-ledger-description"
      >
        <div className="inventory-panel-heading">
          <div>
            <h2 id="inventory-ledger-title">Stock movement history</h2>
            <p id="inventory-ledger-description">{item.code} · {item.name}</p>
          </div>
          <button className="inventory-icon-button" aria-label="Close movement history" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <div className="inventory-ledger-toolbar">
          <div><small>Current balance</small><strong>{quantity(item.quantityOnHand, item.unit)}</strong></div>
          <label>
            <span>Movement type</span>
            <Select
              className="inventory-select"
              classNamePrefix="inventory-select"
              options={filterOptions}
              value={filterOptions.find((option) => option.value === filter) ?? filterOptions[0]}
              onChange={(option) => onFilterChange(option?.value ?? "ALL")}
              isSearchable={false}
              isClearable={false}
              aria-label="Filter stock movements by type"
            />
          </label>
        </div>
        <div className="inventory-ledger-table-wrap">
          <table className="inventory-table inventory-ledger-table inventory-ledger-desktop">
            <caption className="inventory-sr-only">Stock movement history for {item.name}</caption>
            <thead>
              <tr><th scope="col">Occurred</th><th scope="col">Movement</th><th scope="col">Quantity</th><th scope="col">Balance after</th><th scope="col">Reference</th><th scope="col">Remarks</th></tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6}><div className="inventory-state" role="status"><LoaderCircle className="inventory-spin" size={20} /> Loading movements…</div></td></tr>
              ) : movements.length === 0 ? (
                <tr><td colSpan={6}><div className="inventory-state"><History size={22} /><strong>No movements found</strong><span>Stock movement records appear here after a receipt, issue, wastage, or adjustment.</span></div></td></tr>
              ) : movements.map((movement) => (
                <tr key={movement.id}>
                  <td>{formatDateTime(movement.occurredAt || movement.createdAt)}</td>
                  <td><span className={`inventory-movement-pill inventory-movement-pill--${movement.movementType.toLowerCase()}`}>{labelFor(movement.movementType)}</span></td>
                  <td className={movement.direction === "IN" ? "inventory-quantity-in" : "inventory-quantity-out"}>{movement.direction === "IN" ? "+" : "−"}{numberValue(movement.quantity).toLocaleString(undefined, { maximumFractionDigits: 3 })}</td>
                  <td><strong>{quantity(movement.balanceAfter, item.unit)}</strong></td>
                  <td>{movement.referenceType ? labelFor(movement.referenceType) : "—"}</td>
                  <td className="inventory-ledger-remarks">{movement.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="inventory-ledger-mobile" aria-live="polite">
            {loading ? (
              <div className="inventory-state" role="status"><LoaderCircle className="inventory-spin" size={20} /> Loading movements…</div>
            ) : movements.length === 0 ? (
              <div className="inventory-state"><History size={22} /><strong>No movements found</strong><span>Stock movement records appear here after a receipt, issue, wastage, or adjustment.</span></div>
            ) : movements.map((movement) => (
              <article className="inventory-movement-card" key={movement.id}>
                <div className="inventory-movement-card-heading">
                  <span className={`inventory-movement-pill inventory-movement-pill--${movement.movementType.toLowerCase()}`}>{labelFor(movement.movementType)}</span>
                  <strong className={movement.direction === "IN" ? "inventory-quantity-in" : "inventory-quantity-out"}>
                    {movement.direction === "IN" ? "+" : "−"}{numberValue(movement.quantity).toLocaleString(undefined, { maximumFractionDigits: 3 })} {item.unit}
                  </strong>
                </div>
                <p className="inventory-movement-card-date">{formatDateTime(movement.occurredAt || movement.createdAt)}</p>
                <dl className="inventory-movement-card-details">
                  <div><dt>Balance after</dt><dd>{quantity(movement.balanceAfter, item.unit)}</dd></div>
                  <div><dt>Reference</dt><dd>{movement.referenceType ? labelFor(movement.referenceType) : "—"}</dd></div>
                  <div className="inventory-movement-card-remarks"><dt>Remarks</dt><dd>{movement.remarks || "—"}</dd></div>
                </dl>
              </article>
            ))}
          </div>
        </div>
        <div className="inventory-pagination">
          <span>{page ? `${page.totalElements} movements · Page ${page.number + 1} of ${Math.max(page.totalPages, 1)}` : "No results"}</span>
          <div>
            <button className="inventory-button inventory-button--quiet" disabled={loading || pageNumber === 0} onClick={() => onPageChange("previous")}><ArrowLeft size={15} /> Previous</button>
            <button className="inventory-button inventory-button--quiet" disabled={loading || !page || page.last} onClick={() => onPageChange("next")}>Next <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}
