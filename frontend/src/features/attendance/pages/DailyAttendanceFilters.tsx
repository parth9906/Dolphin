import { Search } from "lucide-react";

import type { DailyAttendanceStatus } from "../api/attendance-types";

export type DailyAttendanceFilterValue = "ALL" | "UNMARKED" | DailyAttendanceStatus;

export interface DailyAttendanceStatusFilter {
  value: DailyAttendanceFilterValue;
  label: string;
  count: number;
}

interface DailyAttendanceFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  visibleCount: number;
  totalCount: number;
  statusFilter: DailyAttendanceFilterValue;
  statusFilters: DailyAttendanceStatusFilter[];
  onStatusFilterChange: (value: DailyAttendanceFilterValue) => void;
}

export function DailyAttendanceFilters({
  search,
  onSearchChange,
  visibleCount,
  totalCount,
  statusFilter,
  statusFilters,
  onStatusFilterChange,
}: DailyAttendanceFiltersProps) {
  return (
    <div className="attendance-daily-toolbar">
      <label className="attendance-daily-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search name or admission number"
          aria-label="Search students by name or admission number"
        />
        <span>{visibleCount}/{totalCount}</span>
      </label>

      <div
        className="attendance-daily-filters"
        role="group"
        aria-label="Filter students by attendance status"
      >
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            className={`attendance-daily-filter${statusFilter === filter.value ? " is-active" : ""}`}
            aria-pressed={statusFilter === filter.value}
            onClick={() => onStatusFilterChange(filter.value)}
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
