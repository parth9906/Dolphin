import { AlertCircle, CalendarDays } from "lucide-react";

import type { Institution } from "../../organization/api/organization-types";
import type { AcademicYear, ClassSection, SchoolClass } from "../api/attendance-types";

interface AttendanceAnalyticsFiltersProps {
  institutionId: string;
  institutions: Institution[];
  canReadInstitutions: boolean;
  academicYearId: string;
  academicYears: AcademicYear[];
  schoolClassId: string;
  classes: SchoolClass[];
  sectionId: string;
  sections: ClassSection[];
  startDate: string;
  endDate: string;
  threshold: string;
  activeError: unknown;
  activeErrorRetrying: boolean;
  onRetryActiveError: () => void;
  academicYearsError: unknown;
  academicYearsRetrying: boolean;
  onRetryAcademicYears: () => void;
  classesError: unknown;
  classesRetrying: boolean;
  onRetryClasses: () => void;
  sectionsError: unknown;
  sectionsRetrying: boolean;
  onRetrySections: () => void;
  validDateRange: boolean;
  onInstitutionChange: (value: string) => void;
  onYearChange: (value: string) => void;
  onClassChange: (value: string) => void;
  onSectionChange: (value: string) => void;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  onThresholdChange: (value: string) => void;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load analytics.";
}

function FilterQueryError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  if (!error) return null;

  return (
    <span className="attendance-analytics-filter-error" role="alert">
      <span>{errorMessage(error)}</span>
      <button type="button" onClick={onRetry} disabled={isRetrying}>
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
    </span>
  );
}

export function AttendanceAnalyticsFilters({
  institutionId,
  institutions,
  canReadInstitutions,
  academicYearId,
  academicYears,
  schoolClassId,
  classes,
  sectionId,
  sections,
  startDate,
  endDate,
  threshold,
  activeError,
  activeErrorRetrying,
  onRetryActiveError,
  academicYearsError,
  academicYearsRetrying,
  onRetryAcademicYears,
  classesError,
  classesRetrying,
  onRetryClasses,
  sectionsError,
  sectionsRetrying,
  onRetrySections,
  validDateRange,
  onInstitutionChange,
  onYearChange,
  onClassChange,
  onSectionChange,
  onStartDateChange,
  onEndDateChange,
  onThresholdChange,
}: AttendanceAnalyticsFiltersProps) {
  return (
    <section className="attendance-analytics-filter-panel">
      <div className="attendance-analytics-filter-heading">
        <div><h2>Report filters</h2><p>Choose the institution and reporting period.</p></div>
        <CalendarDays size={20} />
      </div>
      {Boolean(activeError) && (
        <div className="attendance-analytics-error" role="alert">
          <AlertCircle size={17} />
          <span>{errorMessage(activeError)}</span>
          <button type="button" onClick={onRetryActiveError} disabled={activeErrorRetrying}>
            {activeErrorRetrying ? "Retrying…" : "Retry"}
          </button>
        </div>
      )}
      <div className="attendance-analytics-filters">
        <label>
          <span>Institution</span>
          <select
            value={institutionId}
            onChange={(event) => onInstitutionChange(event.target.value)}
            disabled={!canReadInstitutions || institutions.length === 0}
          >
            {institutionId && !institutions.some((item) => item.id === institutionId) && (
              <option value={institutionId}>Current institution</option>
            )}
            {institutions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <div className="attendance-analytics-filter-field">
          <label htmlFor="attendance-analytics-academic-year">Academic year</label>
          <select id="attendance-analytics-academic-year" value={academicYearId} onChange={(event) => onYearChange(event.target.value)} disabled={!institutionId || academicYears.length === 0}>
            <option value="">Select academic year</option>
            {academicYears.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.status}</option>)}
          </select>
          <FilterQueryError error={academicYearsError} onRetry={onRetryAcademicYears} isRetrying={academicYearsRetrying} />
        </div>
        <div className="attendance-analytics-filter-field">
          <label htmlFor="attendance-analytics-class">Class</label>
          <select id="attendance-analytics-class" value={schoolClassId} onChange={(event) => onClassChange(event.target.value)} disabled={!academicYearId || classes.length === 0}>
            <option value="">Select class</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}{item.code ? ` · ${item.code}` : ""}</option>)}
          </select>
          <FilterQueryError error={classesError} onRetry={onRetryClasses} isRetrying={classesRetrying} />
        </div>
        <div className="attendance-analytics-filter-field">
          <label htmlFor="attendance-analytics-section">Section for student details</label>
          <select id="attendance-analytics-section" value={sectionId} onChange={(event) => onSectionChange(event.target.value)} disabled={!schoolClassId || sections.length === 0}>
            <option value="">Select section</option>
            {sections.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <FilterQueryError error={sectionsError} onRetry={onRetrySections} isRetrying={sectionsRetrying} />
        </div>
        <label>
          <span>Start date</span>
          <input type="date" value={startDate} max={endDate || undefined} onChange={(event) => onStartDateChange(event.target.value)} />
        </label>
        <label>
          <span>End date</span>
          <input type="date" value={endDate} min={startDate || undefined} onChange={(event) => onEndDateChange(event.target.value)} />
        </label>
        <label>
          <span>Low-attendance threshold</span>
          <select value={threshold} onChange={(event) => onThresholdChange(event.target.value)}>
            <option value="50">Below 50%</option>
            <option value="60">Below 60%</option>
            <option value="75">Below 75%</option>
            <option value="80">Below 80%</option>
            <option value="90">Below 90%</option>
          </select>
        </label>
      </div>
      {!validDateRange && <p className="attendance-analytics-validation">End date must be on or after start date.</p>}
      <p className="attendance-analytics-filter-note">
        Section and subject performance covers the selected institution. Student details and low-attendance results use the selected section.
      </p>
    </section>
  );
}
