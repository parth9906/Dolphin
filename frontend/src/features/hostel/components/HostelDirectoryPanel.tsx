import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  LoaderCircle,
  Pencil,
  RefreshCw,
  X,
} from "lucide-react";
import Select from "react-select";
import type { Hostel, HostelPage as PageResult } from "../api/hostel-types";
import type { EntityFilter } from "./hostel-directory-types";

type Option<T extends string> = { value: T; label: string };

const ENTITY_FILTERS: Option<EntityFilter>[] = [
  { value: "ACTIVE", label: "Active hostels" },
  { value: "ALL", label: "All hostels" },
  { value: "INACTIVE", label: "Inactive hostels" },
];

interface HostelDirectoryPanelProps {
  hostels: Hostel[];
  page: PageResult<Hostel> | null;
  pageIndex: number;
  filter: EntityFilter;
  selectedHostelId: string;
  loading: boolean;
  error: string;
  hasInstitution: boolean;
  canRead: boolean;
  canUpdate: boolean;
  saving: boolean;
  onFilterChange: (filter: EntityFilter) => void;
  onRefresh: () => void;
  onSelect: (hostel: Hostel) => void;
  onEdit: (hostel: Hostel) => void;
  onDeactivate: (hostel: Hostel) => void;
  onPrevious: () => void;
  onNext: () => void;
}

function display(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

export function HostelDirectoryPanel({
  hostels,
  page,
  pageIndex,
  filter,
  selectedHostelId,
  loading,
  error,
  hasInstitution,
  canRead,
  canUpdate,
  saving,
  onFilterChange,
  onRefresh,
  onSelect,
  onEdit,
  onDeactivate,
  onPrevious,
  onNext,
}: HostelDirectoryPanelProps) {
  return (
    <section className="hostel-panel">
      <div className="hostel-toolbar">
        <div>
          <h2>Hostels</h2>
          <p>Select a hostel to manage its rooms and student allocations.</p>
        </div>
        <div className="hostel-toolbar-actions">
          <div className="hostel-filter-select">
            <Select
              className="hostel-select"
              classNamePrefix="hostel-select"
              options={ENTITY_FILTERS}
              value={ENTITY_FILTERS.find((option) => option.value === filter) ?? ENTITY_FILTERS[0]}
              onChange={(option) => onFilterChange(option?.value ?? "ACTIVE")}
              isSearchable={false}
              isClearable={false}
              aria-label="Filter hostels by status"
            />
          </div>
          <button className="hostel-icon-button" aria-label="Refresh hostels" onClick={onRefresh} disabled={loading}>
            <RefreshCw size={16} className={loading ? "hostel-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="hostel-table-wrap">
        <table className="hostel-table">
          <caption className="sr-only">Hostels available in the selected institution</caption>
          <thead>
            <tr>
              <th scope="col">Hostel</th>
              <th scope="col">Type</th>
              <th scope="col">Warden</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5}><div className="hostel-state" role="status"><LoaderCircle className="hostel-spin" size={22} /> Loading hostels…</div></td></tr>
            ) : !canRead ? (
              <tr><td colSpan={5}><div className="hostel-state"><AlertCircle size={22} /><strong>Hostel read permission required</strong></div></td></tr>
            ) : !hasInstitution ? (
              <tr><td colSpan={5}><div className="hostel-state"><BedDouble size={24} /><strong>Select an institution</strong><span>Choose an institution to load its hostels.</span></div></td></tr>
            ) : error ? (
              <tr>
                <td colSpan={5}>
                  <div className="hostel-state hostel-state--error" role="alert">
                    <AlertCircle size={22} />
                    <strong>Unable to load hostels</strong>
                    <span>{error}</span>
                    <button
                      type="button"
                      className="hostel-button hostel-button--quiet"
                      onClick={onRefresh}
                      disabled={loading}
                    >
                      <RefreshCw size={15} /> Retry
                    </button>
                  </div>
                </td>
              </tr>
            ) : hostels.length === 0 ? (
              <tr><td colSpan={5}><div className="hostel-state"><BedDouble size={24} /><strong>No hostels found</strong><span>Create your first hostel to set up rooms and allocations.</span></div></td></tr>
            ) : hostels.map((hostel) => (
              <tr key={hostel.id} className={selectedHostelId === hostel.id ? "hostel-row-selected" : ""}>
                <td>
                  <strong>{hostel.name}</strong>
                  <small>{hostel.code}</small>
                </td>
                <td><span className="hostel-type-pill">{display(hostel.hostelType)}</span></td>
                <td>{hostel.wardenName || "—"}</td>
                <td><span className={"hostel-active-pill " + (hostel.active ? "hostel-active-pill--yes" : "hostel-active-pill--no")}>{hostel.active ? "Active" : "Inactive"}</span></td>
                <td>
                  <div className="hostel-row-actions">
                    <button className={"hostel-button hostel-button--small " + (selectedHostelId === hostel.id ? "hostel-button--selected" : "")} onClick={() => onSelect(hostel)}>
                      {selectedHostelId === hostel.id ? "Selected" : "Manage"}
                    </button>
                    {canUpdate && hostel.active && (
                      <button className="hostel-icon-button" title="Edit hostel" aria-label={`Edit hostel ${hostel.name}`} onClick={() => onEdit(hostel)}><Pencil size={15} /></button>
                    )}
                    {canUpdate && hostel.active && (
                      <button className="hostel-icon-button hostel-icon-button--danger" title="Deactivate hostel" aria-label={`Deactivate hostel ${hostel.name}`} disabled={saving} onClick={() => onDeactivate(hostel)}><X size={15} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hostel-pagination">
        <span>{page ? `${page.totalElements} hostels · Page ${page.number + 1} of ${Math.max(page.totalPages, 1)}` : "No results"}</span>
        <div>
          <button className="hostel-button hostel-button--quiet" disabled={loading || pageIndex === 0} onClick={onPrevious}><ArrowLeft size={15} /> Previous</button>
          <button className="hostel-button hostel-button--quiet" disabled={loading || !page || page.last} onClick={onNext}>Next <ArrowRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}
