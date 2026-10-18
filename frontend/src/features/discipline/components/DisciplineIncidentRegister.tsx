import Select from "react-select";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
} from "lucide-react";
import type {
  DisciplineIncident,
  DisciplinePage,
  DisciplineSeverity,
  DisciplineStatus,
} from "../api/discipline-types";

type Option<T extends string> = { value: T; label: string };
type FilterStatus = DisciplineStatus | "ALL";
type FilterSeverity = DisciplineSeverity | "ALL";

interface StudentOption {
  value: string;
  label: string;
}

interface DisciplineIncidentRegisterProps {
  incidents: DisciplineIncident[];
  pageData: DisciplinePage<DisciplineIncident> | null;
  page: number;
  loading: boolean;
  canUpdate: boolean;
  filterStatus: FilterStatus;
  filterSeverity: FilterSeverity;
  filterStudentId: string;
  fromDate: string;
  toDate: string;
  searchText: string;
  studentsLoading: boolean;
  studentOptions: StudentOption[];
  statusOptions: Option<FilterStatus>[];
  severityOptions: Option<FilterSeverity>[];
  onRefresh: () => void;
  onFilterStatusChange: (value: FilterStatus) => void;
  onFilterSeverityChange: (value: FilterSeverity) => void;
  onFilterStudentChange: (value: string) => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onSearchChange: (value: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onDetails: (incident: DisciplineIncident) => void;
  onUpdateStatus: (incident: DisciplineIncident) => void;
  formatDate: (value?: string | null) => string;
  pretty: (value: string) => string;
}

export function DisciplineIncidentRegister({
  incidents,
  pageData,
  page,
  loading,
  canUpdate,
  filterStatus,
  filterSeverity,
  filterStudentId,
  fromDate,
  toDate,
  searchText,
  studentsLoading,
  studentOptions,
  statusOptions,
  severityOptions,
  onRefresh,
  onFilterStatusChange,
  onFilterSeverityChange,
  onFilterStudentChange,
  onFromDateChange,
  onToDateChange,
  onSearchChange,
  onPrevious,
  onNext,
  onDetails,
  onUpdateStatus,
  formatDate,
  pretty,
}: DisciplineIncidentRegisterProps) {
  const term = searchText.trim().toLowerCase();
  const filteredIncidents = term
    ? incidents.filter((incident) =>
        [
          incident.admissionNumber,
          incident.description,
          incident.category,
          incident.severity,
          incident.status,
        ].some((value) => String(value ?? "").toLowerCase().includes(term)),
      )
    : incidents;

  return (
    <section className="discipline-panel">
      <div className="discipline-toolbar">
        <div>
          <h2>Incident register</h2>
          <p>Filter by student, severity, status, and incident date.</p>
        </div>
        <button
          className="discipline-icon-button"
          aria-label="Refresh incidents"
          title="Refresh incidents"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "discipline-spin" : ""} />
        </button>
      </div>

      <div className="discipline-filters">
        <label>
          <span>Status</span>
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            options={statusOptions}
            value={statusOptions.find((option) => option.value === filterStatus) ?? statusOptions[0]}
            onChange={(option) => onFilterStatusChange(option?.value ?? "ALL")}
            isSearchable={false}
            isClearable={false}
          />
        </label>
        <label>
          <span>Severity</span>
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            options={severityOptions}
            value={severityOptions.find((option) => option.value === filterSeverity) ?? severityOptions[0]}
            onChange={(option) => onFilterSeverityChange(option?.value ?? "ALL")}
            isSearchable={false}
            isClearable={false}
          />
        </label>
        <label>
          <span>Student</span>
          <Select
            className="discipline-select"
            classNamePrefix="discipline-select"
            options={studentOptions}
            value={studentOptions.find((option) => option.value === filterStudentId) ?? null}
            onChange={(option) => onFilterStudentChange(option?.value ?? "")}
            isSearchable
            isClearable
            isLoading={studentsLoading}
            placeholder="All students"
            noOptionsMessage={() => studentsLoading ? "Loading students…" : "No students found"}
          />
        </label>
        <label>
          <span>From date</span>
          <input type="date" value={fromDate} max={toDate || undefined} onChange={(event) => onFromDateChange(event.target.value)} />
        </label>
        <label>
          <span>To date</span>
          <input type="date" value={toDate} min={fromDate || undefined} onChange={(event) => onToDateChange(event.target.value)} />
        </label>
        <label className="discipline-search">
          <span>Search this page</span>
          <div className="discipline-search-input">
            <Search size={16} />
            <input value={searchText} onChange={(event) => onSearchChange(event.target.value)} placeholder="Admission no., category, description…" />
          </div>
        </label>
      </div>

      <div className="discipline-table-wrap">
        <table className="discipline-table">
          <caption className="visually-hidden">Discipline incident register</caption>
          <thead><tr><th scope="col">Student</th><th scope="col">Incident</th><th scope="col">Date</th><th scope="col">Severity</th><th scope="col">Status</th><th scope="col">Actions</th></tr></thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6}><div className="discipline-state" role="status"><LoaderCircle className="discipline-spin" size={22} />Loading incidents…</div></td></tr>
            ) : filteredIncidents.length === 0 ? (
              <tr><td colSpan={6}><div className="discipline-state"><ShieldCheck size={25} /><strong>No incidents found</strong><span>Try changing the filters or record a new incident.</span></div></td></tr>
            ) : filteredIncidents.map((incident) => (
              <tr key={incident.id}>
                <td><strong>{incident.admissionNumber || "—"}</strong><small className="discipline-sub-id">Student ID: {incident.studentId}</small></td>
                <td className="discipline-incident-cell"><strong>{pretty(incident.category)}</strong><small>{incident.description.length > 105 ? `${incident.description.slice(0, 105)}…` : incident.description}</small></td>
                <td>{formatDate(incident.incidentDate)}</td>
                <td><span className={`discipline-severity discipline-severity--${incident.severity.toLowerCase()}`}>{pretty(incident.severity)}</span></td>
                <td><span className={`discipline-status discipline-status--${incident.status.toLowerCase()}`}>{pretty(incident.status)}</span></td>
                <td><div className="discipline-row-actions">
                  <button className="discipline-button discipline-button--small" onClick={() => onDetails(incident)}>Details</button>
                  {canUpdate && incident.status !== "CLOSED" && (
                    <button className="discipline-icon-button" title="Update status" aria-label={`Update status for incident ${incident.admissionNumber || incident.id}`} onClick={() => onUpdateStatus(incident)}><ChevronDown size={16} /></button>
                  )}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="discipline-pagination" aria-label="Incident register pagination">
        <span>{pageData ? `${pageData.totalElements} matching incidents · Page ${pageData.number + 1} of ${Math.max(pageData.totalPages, 1)}` : "No results"}</span>
        <div>
          <button className="discipline-button discipline-button--quiet" disabled={loading || page === 0} onClick={onPrevious}><ArrowLeft size={15} />Previous</button>
          <button className="discipline-button discipline-button--quiet" disabled={loading || !pageData || pageData.last} onClick={onNext}>Next<ArrowRight size={15} /></button>
        </div>
      </div>
    </section>
  );
}
