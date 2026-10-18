import { CircleUserRound, Search, ShieldCheck, Users, X } from "lucide-react";
import Select from "react-select";

import type { SelectOption } from "./user-management-utils";

interface UserDirectoryControlsProps {
  totalElements: number;
  activeOnPage: number;
  scopeLabel: string;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  activeFilter: string;
  onActiveFilterChange: (value: string) => void;
  selectedDirectoryScope: SelectOption | null;
  directoryScopeOptions: SelectOption[];
  onDirectoryScopeChange: (value: string) => void;
}

const STATUS_OPTIONS: SelectOption[] = [
  { value: "true", label: "Active accounts" },
  { value: "false", label: "Inactive accounts" },
  { value: "ALL", label: "All statuses" },
];

export function UserDirectoryControls({
  totalElements,
  activeOnPage,
  scopeLabel,
  searchInput,
  onSearchInputChange,
  activeFilter,
  onActiveFilterChange,
  selectedDirectoryScope,
  directoryScopeOptions,
  onDirectoryScopeChange,
}: UserDirectoryControlsProps) {
  return (
    <>
      <section className="ua-metrics" aria-label="User directory summary">
        <div className="ua-metric-card">
          <span className="ua-metric-icon">
            <Users size={19} />
          </span>
          <div>
            <span className="ua-metric-label">Matching accounts</span>
            <strong>{totalElements}</strong>
          </div>
        </div>

        <div className="ua-metric-card">
          <span className="ua-metric-icon ua-metric-icon--green">
            <CircleUserRound size={19} />
          </span>
          <div>
            <span className="ua-metric-label">Active on this page</span>
            <strong>{activeOnPage}</strong>
          </div>
        </div>

        <div className="ua-metric-card">
          <span className="ua-metric-icon ua-metric-icon--purple">
            <ShieldCheck size={19} />
          </span>
          <div>
            <span className="ua-metric-label">Current scope</span>
            <strong className="ua-metric-scope">{scopeLabel}</strong>
          </div>
        </div>
      </section>

      <section className="ua-filter-panel" aria-label="Filter user directory">
        <div className="ua-search-box">
          <Search size={17} aria-hidden="true" />
          <input
            value={searchInput}
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search username, name, or email"
            aria-label="Search users"
          />
          {searchInput && (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => onSearchInputChange("")}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="ua-filter-select">
          <label htmlFor="ua-user-status-filter">Status</label>
          <Select<SelectOption, false>
            inputId="ua-user-status-filter"
            value={STATUS_OPTIONS.find((option) => option.value === activeFilter) ?? null}
            options={STATUS_OPTIONS}
            onChange={(option) => onActiveFilterChange(option?.value ?? "true")}
            isSearchable={false}
            classNamePrefix="ua-select"
          />
        </div>

        <div className="ua-filter-select ua-filter-select--scope">
          <label htmlFor="ua-user-scope-filter">Organization scope</label>
          <Select<SelectOption, false>
            inputId="ua-user-scope-filter"
            value={selectedDirectoryScope}
            options={directoryScopeOptions}
            onChange={(option) => onDirectoryScopeChange(option?.value ?? "ALL")}
            isSearchable={directoryScopeOptions.length > 5}
            classNamePrefix="ua-select"
            placeholder="Choose scope"
          />
        </div>
      </section>
    </>
  );
}
