import { RefreshCw, Undo2 } from "lucide-react";

interface DailyAttendanceToolbarProps {
  attendanceDate: string;
  studentCount: number;
  loading: boolean;
  sectionSelected: boolean;
  canMark: boolean;
  canUpdate: boolean;
  editableRowCount: number;
  saving: boolean;
  isFutureDate: boolean;
  canUndo: boolean;
  onMarkAllPresent: () => void;
  onUndo: () => void;
  onRefresh: () => void;
}

export function DailyAttendanceToolbar({
  attendanceDate,
  studentCount,
  loading,
  sectionSelected,
  canMark,
  canUpdate,
  editableRowCount,
  saving,
  isFutureDate,
  canUndo,
  onMarkAllPresent,
  onUndo,
  onRefresh,
}: DailyAttendanceToolbarProps) {
  return (
    <div className="attendance-panel__heading attendance-roster-heading">
      <div>
        <h2>Daily student roster</h2>
        <p>
          {loading
            ? "Loading enrolled students and daily records…"
            : `${studentCount} student${studentCount === 1 ? "" : "s"} enrolled on ${attendanceDate}`}
        </p>
      </div>

      <div className="attendance-roster-heading__actions">
        {(canMark || canUpdate) && (
          <button
            type="button"
            className="attendance-secondary-button"
            disabled={loading || editableRowCount === 0 || saving || isFutureDate}
            onClick={onMarkAllPresent}
          >
            Mark all present
          </button>
        )}

        <button
          type="button"
          className="attendance-secondary-button attendance-icon-button"
          disabled={!canUndo || saving}
          onClick={onUndo}
          aria-label="Undo last status change"
          title="Undo last status change"
        >
          <Undo2 size={17} aria-hidden="true" />
        </button>

        <button
          type="button"
          className="attendance-secondary-button attendance-icon-button"
          disabled={loading || saving}
          aria-label="Refresh daily attendance"
          title="Refresh daily attendance"
          onClick={onRefresh}
        >
          <RefreshCw
            size={17}
            className={loading ? "attendance-spinning" : ""}
            aria-hidden="true"
          />
        </button>
      </div>
    </div>
  );
}
