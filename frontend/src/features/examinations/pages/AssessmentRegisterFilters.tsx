import { RefreshCw } from "lucide-react";

type AssessmentRegisterFiltersProps = {
  loading: boolean;
  canRefresh: boolean;
  fromDate: string;
  toDate: string;
  onRefresh: () => void;
  onFromDateChange: (value: string) => void;
  onToDateChange: (value: string) => void;
  onClear: () => void;
};

export function AssessmentRegisterFilters({
  loading,
  canRefresh,
  fromDate,
  toDate,
  onRefresh,
  onFromDateChange,
  onToDateChange,
  onClear,
}: AssessmentRegisterFiltersProps) {
  return (
    <>
      <div className="asm-panel__heading">
        <div>
          <h2>Assessment register</h2>
          <p>Search assessments by date range.</p>
        </div>
        <button
          type="button"
          className="asm-button asm-button--secondary"
          disabled={loading || !canRefresh}
          onClick={onRefresh}
        >
          <RefreshCw size={15} className={loading ? "asm-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="asm-filters">
        <label className="asm-field">
          <span>From date</span>
          <input
            type="date"
            value={fromDate}
            max={toDate || undefined}
            onChange={(event) => onFromDateChange(event.target.value)}
          />
        </label>
        <label className="asm-field">
          <span>To date</span>
          <input
            type="date"
            value={toDate}
            min={fromDate || undefined}
            onChange={(event) => onToDateChange(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="asm-button asm-button--quiet"
          disabled={!fromDate && !toDate}
          onClick={onClear}
        >
          Clear filters
        </button>
      </div>
    </>
  );
}
