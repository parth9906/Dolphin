import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSelectedInstitutionId } from "../../organization/hooks/organization-selection";
import { confirmAction } from "../../../lib/ui/dialogs";
import Select from "react-select";
import {
  AlertCircle,
  Archive,
  ArrowLeft,
  ArrowRight,
  Check,
  Package,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/use-auth";
import { inventoryService } from "../api/inventory-service";
import { InventoryItemsList } from "../components/InventoryItemsList";
import { InventoryItemFormPanel } from "../components/InventoryItemFormPanel";
import { InventoryStockMovementForm } from "../components/InventoryStockMovementForm";
import type { InventoryMovementAction } from "../components/InventoryStockMovementForm";
import { InventoryItemDetailsDialog } from "../components/InventoryItemDetailsDialog";
import { InventoryMovementHistoryPanel } from "../components/InventoryMovementHistoryPanel";
import type {
  AdjustStockRequest,
  CreateInventoryItemRequest,
  InventoryItem,
  InventoryItemCategory,
  InventoryMovementDirection,
  InventoryMovementType,
  InventoryPage as PageResult,
  InventoryReferenceType,
  InventoryStockMovement,
  InventoryUnit,
  RecordStockMovementRequest,
  UpdateInventoryItemRequest,
} from "../api/inventory-types";
import "./inventory-page.css";

type Option<T extends string> = { value: T; label: string };
type CategoryFilter = InventoryItemCategory | "ALL";
type ActiveFilter = "ALL" | "ACTIVE" | "INACTIVE";
type MovementFilter = InventoryMovementType | "ALL";
type MovementAction = InventoryMovementAction;

const CATEGORIES: Option<InventoryItemCategory>[] = [
  { value: "STATIONERY", label: "Stationery" },
  { value: "FOOD", label: "Food" },
  { value: "CLEANING", label: "Cleaning supplies" },
  { value: "UNIFORM", label: "Uniforms" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "MEDICAL", label: "Medical supplies" },
  { value: "OTHER", label: "Other" },
];

const UNITS: Option<InventoryUnit>[] = [
  { value: "PIECE", label: "Piece" },
  { value: "KG", label: "Kilogram (kg)" },
  { value: "GRAM", label: "Gram (g)" },
  { value: "LITRE", label: "Litre (L)" },
  { value: "MILLILITRE", label: "Millilitre (mL)" },
  { value: "PACKET", label: "Packet" },
  { value: "BOX", label: "Box" },
  { value: "DOZEN", label: "Dozen" },
];

const CATEGORY_FILTERS: Option<CategoryFilter>[] = [
  { value: "ALL", label: "All categories" },
  ...CATEGORIES,
];

const ACTIVE_FILTERS: Option<ActiveFilter>[] = [
  { value: "ACTIVE", label: "Active items" },
  { value: "ALL", label: "All items" },
  { value: "INACTIVE", label: "Inactive items" },
];

const MOVEMENT_TYPES: Option<MovementFilter>[] = [
  { value: "ALL", label: "All movements" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "ISSUE", label: "Issue" },
  { value: "WASTAGE", label: "Wastage" },
  { value: "ADJUSTMENT", label: "Adjustment" },
];

const MOVEMENT_ACTIONS: Option<MovementAction>[] = [
  { value: "RECEIPT", label: "Receive stock" },
  { value: "ISSUE", label: "Issue stock" },
  { value: "WASTAGE", label: "Record wastage" },
  { value: "ADJUSTMENT", label: "Adjust stock" },
];

const REFERENCE_TYPES: Option<InventoryReferenceType>[] = [
  { value: "MANUAL", label: "Manual entry" },
  { value: "PURCHASE", label: "Purchase" },
  { value: "STOCKTAKE", label: "Stocktake" },
];

const DIRECTIONS: Option<InventoryMovementDirection>[] = [
  { value: "IN", label: "Increase stock (IN)" },
  { value: "OUT", label: "Decrease stock (OUT)" },
];


function errorMessage(error: unknown): string {
  return error instanceof Error && error.message
    ? error.message
    : "The request could not be completed. Check permissions and try again.";
}

function numberValue(value: number | string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function labelFor(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function validateQuantity(value: string): string {
  if (!value.trim()) return "Quantity is required.";
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "Quantity must be greater than zero.";
  if (!/^\d{1,11}(\.\d{1,3})?$/.test(value.trim())) {
    return "Enter up to 11 integer digits and 3 decimal places.";
  }
  return "";
}

export function InventoryPage() {
  const { hasPermission } = useAuth();
  const institutionId = useSelectedInstitutionId();

  const canRead = hasPermission("INVENTORY_ITEM_READ");
  const canCreate = hasPermission("INVENTORY_ITEM_CREATE");
  const canUpdate = hasPermission("INVENTORY_ITEM_UPDATE");
  const canReadMovements = hasPermission("INVENTORY_STOCK_READ");
  const canReceive = hasPermission("INVENTORY_STOCK_RECEIVE");
  const canIssue = hasPermission("INVENTORY_STOCK_ISSUE");
  const canAdjust = hasPermission("INVENTORY_STOCK_ADJUST");

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [itemPage, setItemPage] = useState<PageResult<InventoryItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("ACTIVE");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);

  const [itemFormOpen, setItemFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [itemCode, setItemCode] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemCategory, setItemCategory] = useState<InventoryItemCategory>("STATIONERY");
  const [itemUnit, setItemUnit] = useState<InventoryUnit>("PIECE");
  const [reorderLevel, setReorderLevel] = useState("0");

  const [detailItem, setDetailItem] = useState<InventoryItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [movementItem, setMovementItem] = useState<InventoryItem | null>(null);
  const [movementAction, setMovementAction] = useState<MovementAction>("RECEIPT");
  const [movementQuantity, setMovementQuantity] = useState("");
  const [movementReference, setMovementReference] =
    useState<InventoryReferenceType>("MANUAL");
  const [movementRemarks, setMovementRemarks] = useState("");
  const [adjustmentDirection, setAdjustmentDirection] =
    useState<InventoryMovementDirection>("IN");

  const [ledgerItem, setLedgerItem] = useState<InventoryItem | null>(null);
  const [movementFilter, setMovementFilter] = useState<MovementFilter>("ALL");
  const [movementPageNumber, setMovementPageNumber] = useState(0);
  const [movements, setMovements] = useState<InventoryStockMovement[]>([]);
  const [movementPage, setMovementPage] =
    useState<PageResult<InventoryStockMovement> | null>(null);
  const [movementsLoading, setMovementsLoading] = useState(false);

  const loadItems = useCallback(async () => {
    if (!institutionId || !canRead) {
      setItems([]);
      setItemPage(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await inventoryService.searchItems({
        institutionId,
        ...(categoryFilter !== "ALL" ? { category: categoryFilter } : {}),
        ...(activeFilter !== "ALL" ? { active: activeFilter === "ACTIVE" } : {}),
        lowStockOnly,
        page,
        size: 20,
      });
      setItemPage(result);
      setItems(result.content ?? []);
    } catch (cause) {
      setError(errorMessage(cause));
      setItems([]);
      setItemPage(null);
    } finally {
      setLoading(false);
    }
  }, [institutionId, canRead, categoryFilter, activeFilter, lowStockOnly, page]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const filteredItems = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.code, item.name, item.category, item.unit]
        .some((value) => String(value ?? "").toLowerCase().includes(term)),
    );
  }, [items, searchText]);

  const activeCount = items.filter((item) => item.active).length;
  const lowStockCount = items.filter((item) => item.lowStock).length;
  const stockTotal = items.reduce((sum, item) => sum + numberValue(item.quantityOnHand), 0);

  const resetItemForm = () => {
    setEditingItem(null);
    setItemCode("");
    setItemName("");
    setItemCategory("STATIONERY");
    setItemUnit("PIECE");
    setReorderLevel("0");
  };

  const openCreateItem = () => {
    resetItemForm();
    setError("");
    setItemFormOpen(true);
  };

  const openEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setItemCode(item.code);
    setItemName(item.name);
    setItemCategory(item.category);
    setItemUnit(item.unit);
    setReorderLevel(String(item.reorderLevel));
    setError("");
    setItemFormOpen(true);
  };

  const submitItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!institutionId) {
      setError("Select an institution in the organization selector first.");
      return;
    }
    if (!itemName.trim()) {
      setError("Item name is required.");
      return;
    }
    if (!editingItem && !itemCode.trim()) {
      setError("Item code is required.");
      return;
    }
    if (itemCode.trim().length > 50 || itemName.trim().length > 200) {
      setError("Code must be at most 50 characters and name at most 200 characters.");
      return;
    }
    const reorder = Number(reorderLevel);
    if (!Number.isFinite(reorder) || reorder < 0 || !/^\d{1,11}(\.\d{1,3})?$/.test(reorderLevel.trim())) {
      setError("Reorder level must be zero or greater, with up to 3 decimals.");
      return;
    }
    if (editingItem && numberValue(editingItem.quantityOnHand) > 0 && itemUnit !== editingItem.unit) {
      setError("The unit cannot be changed while stock is on hand.");
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (editingItem) {
        const request: UpdateInventoryItemRequest = {
          name: itemName.trim(),
          category: itemCategory,
          unit: itemUnit,
          reorderLevel: reorder,
          version: editingItem.version,
        };
        await inventoryService.updateItem(editingItem.id, request);
        setNotice("Inventory item updated.");
      } else {
        const request: CreateInventoryItemRequest = {
          institutionId,
          campusId: null,
          code: itemCode.trim(),
          name: itemName.trim(),
          category: itemCategory,
          unit: itemUnit,
          reorderLevel: reorder,
        };
        await inventoryService.createItem(request);
        setNotice("Inventory item created. Record a receipt to add stock.");
      }

      setItemFormOpen(false);
      resetItemForm();
      if (page !== 0) setPage(0);
      else await loadItems();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const openMovementForm = (item: InventoryItem, action: MovementAction) => {
    setMovementItem(item);
    setMovementAction(action);
    setMovementQuantity("");
    setMovementReference("MANUAL");
    setMovementRemarks("");
    setAdjustmentDirection("IN");
    setError("");
  };

  const submitMovement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!movementItem) return;

    const quantityError = validateQuantity(movementQuantity);
    if (quantityError) {
      setError(quantityError);
      return;
    }

    if (!movementItem.active) {
      setError("Stock movements are not allowed for inactive items.");
      return;
    }

    const common: RecordStockMovementRequest = {
      quantity: Number(movementQuantity),
      referenceType: movementReference,
      remarks: movementRemarks.trim() || null,
    };

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (movementAction === "RECEIPT") {
        await inventoryService.recordReceipt(movementItem.id, common);
      } else if (movementAction === "ISSUE") {
        await inventoryService.recordIssue(movementItem.id, common);
      } else if (movementAction === "WASTAGE") {
        await inventoryService.recordWastage(movementItem.id, common);
      } else {
        const request: AdjustStockRequest = {
          ...common,
          direction: adjustmentDirection,
        };
        await inventoryService.adjustStock(movementItem.id, request);
      }

      setNotice(`${labelFor(movementAction)} recorded for ${movementItem.name}.`);
      setMovementItem(null);
      await loadItems();

      if (ledgerItem?.id === movementItem.id) {
        const result = await inventoryService.listMovements(movementItem.id, {
          ...(movementFilter !== "ALL" ? { movementType: movementFilter } : {}),
          page: 0,
          size: 20,
        });
        setMovementPageNumber(0);
        setMovementPage(result);
        setMovements(result.content ?? []);
      }
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const deactivateItem = async (item: InventoryItem) => {
    if (numberValue(item.quantityOnHand) > 0) {
      setError("Issue or write off the remaining stock before deactivating this item.");
      return;
    }
    if (!(await confirmAction({
      title: "Deactivate inventory item?",
      text: `${item.code} — ${item.name}`,
      confirmButtonText: "Deactivate item",
      cancelButtonText: "Keep active",
    }))) return;

    setSaving(true);
    setError("");
    setNotice("");
    try {
      await inventoryService.deactivateItem(item.id);
      setNotice(`Item ${item.code} deactivated.`);
      await loadItems();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setSaving(false);
    }
  };

  const openDetails = async (item: InventoryItem) => {
    setDetailItem(item);
    setDetailLoading(true);
    setError("");
    try {
      setDetailItem(await inventoryService.getItem(item.id));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setDetailLoading(false);
    }
  };

  const loadMovements = useCallback(async () => {
    if (!ledgerItem || !canReadMovements) {
      setMovements([]);
      setMovementPage(null);
      return;
    }
    setMovementsLoading(true);
    setError("");
    try {
      const result = await inventoryService.listMovements(ledgerItem.id, {
        ...(movementFilter !== "ALL" ? { movementType: movementFilter } : {}),
        page: movementPageNumber,
        size: 20,
      });
      setMovementPage(result);
      setMovements(result.content ?? []);
    } catch (cause) {
      setError(errorMessage(cause));
      setMovements([]);
      setMovementPage(null);
    } finally {
      setMovementsLoading(false);
    }
  }, [ledgerItem, canReadMovements, movementFilter, movementPageNumber]);

  useEffect(() => {
    void loadMovements();
  }, [loadMovements]);

  const openLedger = (item: InventoryItem) => {
    setLedgerItem(item);
    setMovementFilter("ALL");
    setMovementPageNumber(0);
  };

  const allowedMovementActions = [
    ...(canReceive ? ["RECEIPT" as const] : []),
    ...(canIssue ? ["ISSUE" as const, "WASTAGE" as const] : []),
    ...(canAdjust ? ["ADJUSTMENT" as const] : []),
  ];

  return (
    <main className="inventory-page">
      <header className="inventory-header">
        <div>
          <div className="inventory-eyebrow"><Package size={15} /> OPERATIONS</div>
          <h1>Inventory Management</h1>
          <p>Manage items, monitor stock levels, and maintain a movement ledger.</p>
        </div>
        {canCreate && (
          <button className="inventory-button inventory-button--primary" onClick={openCreateItem}>
            <Plus size={17} /> New item
          </button>
        )}
      </header>

      {!institutionId && (
        <div className="inventory-alert inventory-alert--warning">
          <AlertCircle size={18} /> Select an institution in the organization selector first.
        </div>
      )}

      {!canRead && !canCreate && !canUpdate && !canReceive && !canIssue && !canAdjust && (
        <div className="inventory-alert inventory-alert--warning">
          <AlertCircle size={18} /> Your account does not have inventory permissions.
        </div>
      )}

      {error && (
        <div className="inventory-alert inventory-alert--error">
          <AlertCircle size={18} /><span>{error}</span>
          <button aria-label="Dismiss error" onClick={() => setError("")}><X size={16} /></button>
        </div>
      )}

      {notice && (
        <div className="inventory-alert inventory-alert--success">
          <Check size={18} /><span>{notice}</span>
          <button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16} /></button>
        </div>
      )}

      <section className="inventory-metrics">
        <div className="inventory-metric">
          <span className="inventory-metric-icon inventory-metric-icon--blue"><Package size={18} /></span>
          <div><small>Items on this page</small><strong>{canRead ? items.length : "—"}</strong></div>
        </div>
        <div className="inventory-metric">
          <span className="inventory-metric-icon inventory-metric-icon--green"><Check size={18} /></span>
          <div><small>Active on this page</small><strong>{canRead ? activeCount : "—"}</strong></div>
        </div>
        <div className="inventory-metric">
          <span className="inventory-metric-icon inventory-metric-icon--amber"><AlertCircle size={18} /></span>
          <div><small>Low stock on this page</small><strong>{canRead ? lowStockCount : "—"}</strong></div>
        </div>
        <div className="inventory-metric">
          <span className="inventory-metric-icon inventory-metric-icon--violet"><Archive size={18} /></span>
          <div><small>Total units on page</small><strong>{canRead ? stockTotal.toLocaleString(undefined, { maximumFractionDigits: 3 }) : "—"}</strong></div>
        </div>
      </section>

      {itemFormOpen && (
        <InventoryItemFormPanel
          editingItem={editingItem}
          itemCode={itemCode}
          onItemCodeChange={setItemCode}
          itemName={itemName}
          onItemNameChange={setItemName}
          itemCategory={itemCategory}
          onItemCategoryChange={setItemCategory}
          itemUnit={itemUnit}
          onItemUnitChange={setItemUnit}
          reorderLevel={reorderLevel}
          onReorderLevelChange={setReorderLevel}
          categories={CATEGORIES}
          units={UNITS}
          saving={saving}
          institutionSelected={Boolean(institutionId)}
          onSubmit={submitItem}
          onClose={() => setItemFormOpen(false)}
          onCancel={() => {
            setItemFormOpen(false);
            resetItemForm();
          }}
        />
      )}

      <section className="inventory-panel">
        <div className="inventory-toolbar">
          <div>
            <h2>Inventory register</h2>
            <p>Search items, check reorder flags, and manage stock movements.</p>
          </div>
          <button className="inventory-icon-button" aria-label="Refresh inventory" title="Refresh inventory" onClick={() => void loadItems()} disabled={loading}>
            <RefreshCw size={16} className={loading ? "inventory-spin" : ""} />
          </button>
        </div>

        <div className="inventory-filters">
          <label>
            <span>Category</span>
            <Select
              className="inventory-select"
              classNamePrefix="inventory-select"
              options={CATEGORY_FILTERS}
              value={CATEGORY_FILTERS.find((option) => option.value === categoryFilter) ?? CATEGORY_FILTERS[0]}
              onChange={(option) => { setCategoryFilter(option?.value ?? "ALL"); setPage(0); }}
              isSearchable
              isClearable={false}
            />
          </label>
          <label>
            <span>Item status</span>
            <Select
              className="inventory-select"
              classNamePrefix="inventory-select"
              options={ACTIVE_FILTERS}
              value={ACTIVE_FILTERS.find((option) => option.value === activeFilter) ?? ACTIVE_FILTERS[0]}
              onChange={(option) => { setActiveFilter(option?.value ?? "ALL"); setPage(0); }}
              isSearchable={false}
              isClearable={false}
            />
          </label>
          <label className="inventory-search-label">
            <span>Search this page</span>
            <div className="inventory-search">
              <Search size={16} />
              <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Code, name, category…" />
            </div>
          </label>
          <label className="inventory-low-stock-toggle">
            <input type="checkbox" checked={lowStockOnly} onChange={(event) => { setLowStockOnly(event.target.checked); setPage(0); }} />
            <span>Low stock only</span>
          </label>
        </div>

        <InventoryItemsList
          items={filteredItems}
          loading={loading}
          canRead={canRead}
          canUpdate={canUpdate}
          canReadMovements={canReadMovements}
          allowedMovementActions={allowedMovementActions}
          saving={saving}
          onOpenDetails={(item) => void openDetails(item)}
          onEdit={openEditItem}
          onRecordMovement={openMovementForm}
          onOpenLedger={openLedger}
          onDeactivate={(item) => void deactivateItem(item)}
        />

        <div className="inventory-pagination">
          <span>{itemPage ? `${itemPage.totalElements} matching items · Page ${itemPage.number + 1} of ${Math.max(itemPage.totalPages, 1)}` : "No results"}</span>
          <div>
            <button className="inventory-button inventory-button--quiet" disabled={loading || page === 0} onClick={() => setPage((current) => Math.max(0, current - 1))}><ArrowLeft size={15} /> Previous</button>
            <button className="inventory-button inventory-button--quiet" disabled={loading || !itemPage || itemPage.last} onClick={() => setPage((current) => current + 1)}>Next <ArrowRight size={15} /></button>
          </div>
        </div>
      </section>

      {movementItem && (
        <InventoryStockMovementForm
          item={movementItem}
          action={movementAction}
          onActionChange={setMovementAction}
          allowedActions={MOVEMENT_ACTIONS.filter((option) => allowedMovementActions.includes(option.value))}
          adjustmentDirection={adjustmentDirection}
          onAdjustmentDirectionChange={setAdjustmentDirection}
          quantity={movementQuantity}
          onQuantityChange={setMovementQuantity}
          referenceType={movementReference}
          onReferenceTypeChange={setMovementReference}
          remarks={movementRemarks}
          onRemarksChange={setMovementRemarks}
          directionOptions={DIRECTIONS}
          referenceOptions={REFERENCE_TYPES}
          saving={saving}
          onSubmit={submitMovement}
          onClose={() => setMovementItem(null)}
        />
      )}

      {detailItem && (
        <InventoryItemDetailsDialog
          item={detailItem}
          loading={detailLoading}
          onClose={() => setDetailItem(null)}
        />
      )}

      {ledgerItem && (
        <InventoryMovementHistoryPanel
          item={ledgerItem}
          movements={movements}
          loading={movementsLoading}
          page={movementPage}
          pageNumber={movementPageNumber}
          filter={movementFilter}
          filterOptions={MOVEMENT_TYPES}
          onFilterChange={(filter) => {
            setMovementFilter(filter);
            setMovementPageNumber(0);
          }}
          onPageChange={(direction) => {
            setMovementPageNumber((current) =>
              direction === "previous" ? Math.max(0, current - 1) : current + 1,
            );
          }}
          onClose={() => setLedgerItem(null)}
        />
      )}
    </main>
  );
}
