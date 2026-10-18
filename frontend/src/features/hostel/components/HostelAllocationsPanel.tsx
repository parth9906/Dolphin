import { AlertCircle, ArrowLeft, ArrowRight, LoaderCircle, Users } from "lucide-react";
import Select from "react-select";
import type { HostelAllocation, HostelAllocationStatus, HostelPage } from "../api/hostel-types";

type AllocationFilter = "ALL" | HostelAllocationStatus;

interface HostelAllocationsPanelProps {
  allocations: HostelAllocation[];
  page: HostelPage<HostelAllocation> | null;
  pageIndex: number;
  filter: AllocationFilter;
  loading: boolean;
  error: string;
  onRetry: () => void;
  canRead: boolean;
  canUpdate: boolean;
  onFilterChange: (filter: AllocationFilter) => void;
  onVacate: (allocation: HostelAllocation) => void;
  onPrevious: () => void;
  onNext: () => void;
}

const FILTERS: { value: AllocationFilter; label: string }[] = [
  { value: "ACTIVE", label: "Active allocations" },
  { value: "ALL", label: "All allocations" },
  { value: "VACATED", label: "Vacated allocations" },
];

function display(value: string): string {
  return value.split("_").map((part) => part.charAt(0) + part.slice(1).toLowerCase()).join(" ");
}

function dateLabel(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function HostelAllocationsPanel({
  allocations,
  page,
  pageIndex,
  filter,
  loading,
  error,
  onRetry,
  canRead,
  canUpdate,
  onFilterChange,
  onVacate,
  onPrevious,
  onNext,
}: HostelAllocationsPanelProps) {
  return (
    <>
      <div className="hostel-allocation-toolbar">
        <p>Allocations are scoped to this hostel. Active allocations can be vacated once the student leaves.</p>
        <div className="hostel-allocation-filter">
          <Select
            aria-label="Filter student allocations"
            className="hostel-select"
            classNamePrefix="hostel-select"
            options={FILTERS}
            value={FILTERS.find((option) => option.value === filter) ?? FILTERS[0]}
            onChange={(option) => onFilterChange(option?.value ?? "ACTIVE")}
            isSearchable={false}
            isClearable={false}
          />
        </div>
      </div>
      {loading || !canRead || error || allocations.length === 0 ? (
        <div className={`hostel-state${error && !loading ? " hostel-state--error" : ""}`} role={loading ? "status" : error ? "alert" : undefined} aria-live="polite">
          {loading ? <LoaderCircle className="hostel-spin" size={22} /> : !canRead || error ? <AlertCircle size={22} /> : <Users size={24} />}
          <strong>{loading ? "Loading allocations…" : !canRead ? "Allocation read permission required" : error ? "Couldn't load allocations" : "No allocations found"}</strong>
          {!loading && canRead && error && <span>{error}</span>}
          {!loading && canRead && !error && <span>Allocate a student to a room with available capacity.</span>}
          {error && !loading && canRead && <button type="button" className="hostel-button hostel-button--quiet" onClick={onRetry}>Retry loading allocations</button>}
        </div>
      ) : (
        <>
          <div className="hostel-table-wrap hostel-allocations-desktop">
            <table className="hostel-table hostel-allocation-table">
              <caption className="hostel-visually-hidden">Student allocations in the selected hostel</caption>
              <thead><tr><th scope="col">Student</th><th scope="col">Room</th><th scope="col">Start date</th><th scope="col">End date</th><th scope="col">Status</th><th scope="col">Notes</th><th scope="col">Actions</th></tr></thead>
              <tbody>{allocations.map((allocation) => (
                <tr key={allocation.id}>
                  <td><strong>{allocation.studentName}</strong><small>{allocation.admissionNumber}</small></td>
                  <td><strong>{allocation.roomNumber}</strong></td>
                  <td>{dateLabel(allocation.startDate)}</td>
                  <td>{dateLabel(allocation.endDate)}</td>
                  <td><span className={`hostel-active-pill ${allocation.status === "ACTIVE" ? "hostel-active-pill--yes" : "hostel-active-pill--no"}`}>{display(allocation.status)}</span></td>
                  <td className="hostel-notes-cell">{allocation.notes || "—"}</td>
                  <td>{canUpdate && allocation.status === "ACTIVE" && <button type="button" className="hostel-button hostel-button--small" onClick={() => onVacate(allocation)}>Vacate</button>}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="hostel-mobile-records" aria-label="Student allocations">
            {allocations.map((allocation) => (
              <article className="hostel-mobile-record" key={allocation.id}>
                <div className="hostel-mobile-record-heading"><div><span className="hostel-mobile-record-label">Student</span><h3>{allocation.studentName}</h3><p>{allocation.admissionNumber}</p></div><span className={`hostel-active-pill ${allocation.status === "ACTIVE" ? "hostel-active-pill--yes" : "hostel-active-pill--no"}`}>{display(allocation.status)}</span></div>
                <dl className="hostel-mobile-record-details">
                  <div><dt>Room</dt><dd>{allocation.roomNumber}</dd></div>
                  <div><dt>Start date</dt><dd>{dateLabel(allocation.startDate)}</dd></div>
                  <div><dt>End date</dt><dd>{dateLabel(allocation.endDate)}</dd></div>
                  <div className="hostel-mobile-record-notes"><dt>Notes</dt><dd>{allocation.notes || "—"}</dd></div>
                </dl>
                {canUpdate && allocation.status === "ACTIVE" && <div className="hostel-mobile-record-actions"><button type="button" className="hostel-button hostel-button--quiet" onClick={() => onVacate(allocation)}>Vacate allocation</button></div>}
              </article>
            ))}
          </div>
        </>
      )}
      <div className="hostel-pagination">
        <span>{page ? `${page.totalElements} allocations · Page ${page.number + 1} of ${Math.max(page.totalPages, 1)}` : "No results"}</span>
        <div>
          <button type="button" className="hostel-button hostel-button--quiet" disabled={loading || pageIndex === 0} onClick={onPrevious}><ArrowLeft size={15} /> Previous</button>
          <button type="button" className="hostel-button hostel-button--quiet" disabled={loading || !page || page.last} onClick={onNext}>Next <ArrowRight size={15} /></button>
        </div>
      </div>
    </>
  );
}
