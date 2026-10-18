import type { FormEvent } from "react";
import { CalendarDays, LoaderCircle, Plus, RefreshCw } from "lucide-react";

import type { AcademicYear } from "../api/academic-types";
import { AcademicQueryError } from "./AcademicQueryError";

interface AcademicYearsPanelProps {
  institutionId: string;
  years: AcademicYear[];
  yearId: string;
  canCreateYear: boolean;
  canReadYears: boolean;
  canActivateYear: boolean;
  canCloseYear: boolean;
  loading: boolean;
  queryError: string;
  retrying: boolean;
  onRetry: () => void;
  saving: boolean;
  yearName: string;
  onYearNameChange: (value: string) => void;
  yearStart: string;
  onYearStartChange: (value: string) => void;
  yearEnd: string;
  onYearEndChange: (value: string) => void;
  onCreateYear: (event: FormEvent<HTMLFormElement>) => void;
  onSelectYear: (yearId: string) => void;
  onYearAction: (year: AcademicYear, action: "activate" | "close") => void;
  formatDate: (value: string | null | undefined) => string;
}

export function AcademicYearsPanel({
  institutionId,
  years,
  yearId,
  canCreateYear,
  canReadYears,
  canActivateYear,
  canCloseYear,
  loading,
  queryError,
  retrying,
  onRetry,
  saving,
  yearName,
  onYearNameChange,
  yearStart,
  onYearStartChange,
  yearEnd,
  onYearEndChange,
  onCreateYear,
  onSelectYear,
  onYearAction,
  formatDate,
}: AcademicYearsPanelProps) {
  const invalidDateRange = Boolean(yearStart && yearEnd && yearEnd <= yearStart);

  return (
    <div className="academic-workspace">
      <div className="academic-section-heading">
        <div>
          <h2>Academic years</h2>
          <p>Create years and manage their lifecycle.</p>
        </div>
        <span className="academic-result-count">
          {years.length} year{years.length === 1 ? "" : "s"}
        </span>
      </div>

      {canCreateYear && institutionId && (
        <form className="academic-form" onSubmit={onCreateYear}>
          <h3><Plus size={17} /> Create academic year</h3>
          <div className="academic-form-grid academic-form-grid--three">
            <label className="academic-field">
              <span>Academic year name</span>
              <input
                required
                maxLength={50}
                value={yearName}
                onChange={(event) => onYearNameChange(event.target.value)}
                placeholder="e.g. 2027-2028"
              />
            </label>
            <label className="academic-field">
              <span>Start date</span>
              <input
                required
                type="date"
                value={yearStart}
                onChange={(event) => onYearStartChange(event.target.value)}
              />
            </label>
            <label className="academic-field">
              <span>End date</span>
              <input
                required
                type="date"
                min={yearStart}
                value={yearEnd}
                onChange={(event) => onYearEndChange(event.target.value)}
                aria-invalid={invalidDateRange}
                aria-describedby={invalidDateRange ? "academic-year-date-range-error" : undefined}
              />
              {invalidDateRange && (
                <span
                  id="academic-year-date-range-error"
                  className="academic-field__error"
                  role="alert"
                >
                  End date must be after the start date.
                </span>
              )}
            </label>
          </div>
          <div className="academic-form-actions">
            <button
              className="academic-primary-button"
              type="submit"
              disabled={saving || !institutionId || invalidDateRange}
            >
              {saving ? <LoaderCircle size={16} className="academic-spin" /> : <Plus size={16} />}
              Create year
            </button>
          </div>
        </form>
      )}

      {!canReadYears && (
        <div className="academic-inline-message">
          ACADEMIC_YEAR_READ permission is required to list years.
        </div>
      )}

      {loading && (
        <div className="academic-loading" role="status" aria-live="polite">
          <RefreshCw size={19} className="academic-spin" /> Loading academic years…
        </div>
      )}

      {canReadYears && institutionId && !loading && queryError && (
        <AcademicQueryError
          message={queryError}
          retrying={retrying}
          onRetry={onRetry}
          retryLabel="academic years"
        />
      )}

      {canReadYears && !loading && !queryError && years.length === 0 && institutionId && (
        <div className="academic-empty">
          <CalendarDays size={27} />
          <strong>No academic years yet</strong>
          <p>Create an academic year above to begin configuring classes and sections.</p>
        </div>
      )}

      {canReadYears && years.length > 0 && (
        <div className="academic-table-wrap">
          <table className="academic-table">
            <caption className="academic-sr-only">Academic years and available lifecycle actions</caption>
            <thead>
              <tr>
                <th scope="col">Academic year</th>
                <th scope="col">Dates</th>
                <th scope="col">Status</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {years.map((year) => (
                <tr key={year.id}>
                  <td>
                    <strong>{year.name}</strong>
                    {year.id === yearId && (
                      <span className="academic-current-label">Selected</span>
                    )}
                  </td>
                  <td>{formatDate(year.startDate)} – {formatDate(year.endDate)}</td>
                  <td>
                    <span className={`academic-status academic-status--${year.status.toLowerCase()}`}>
                      {year.status}
                    </span>
                  </td>
                  <td>
                    <div className="academic-row-actions">
                      <button
                        type="button"
                        className="academic-secondary-button"
                        onClick={() => onSelectYear(year.id)}
                      >
                        View classes
                      </button>
                      {canActivateYear && year.status === "PLANNED" && (
                        <button
                          type="button"
                          className="academic-secondary-button"
                          disabled={saving}
                          onClick={() => onYearAction(year, "activate")}
                        >
                          Activate
                        </button>
                      )}
                      {canCloseYear && year.status !== "CLOSED" && (
                        <button
                          type="button"
                          className="academic-danger-button"
                          disabled={saving}
                          onClick={() => onYearAction(year, "close")}
                        >
                          Close
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
