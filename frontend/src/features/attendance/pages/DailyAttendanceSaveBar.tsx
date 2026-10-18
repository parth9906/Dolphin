import { RefreshCw, Save } from "lucide-react";

interface DailyAttendanceSaveBarProps {
  isFutureDate: boolean;
  canMark: boolean;
  canUpdate: boolean;
  newRowsCount: number;
  unmarkedCount: number;
  changedExistingRowsCount: number;
  canSave: boolean;
  blockedByAmbiguousCreate: boolean;
  saving: boolean;
  loading: boolean;
  hasLoadError: boolean;
  rosterCount: number;
  onSave: () => void;
}

export function DailyAttendanceSaveBar({
  isFutureDate,
  canMark,
  canUpdate,
  newRowsCount,
  unmarkedCount,
  changedExistingRowsCount,
  canSave,
  blockedByAmbiguousCreate,
  saving,
  loading,
  hasLoadError,
  rosterCount,
  onSave,
}: DailyAttendanceSaveBarProps) {
  return (
    <div className="attendance-save-bar">
      <div className="attendance-save-bar__hint">
        {isFutureDate
          ? "Future attendance is disabled."
          : !canMark && !canUpdate
            ? "Read-only access. You can view daily attendance but cannot change it."
            : `${newRowsCount} marked new · ${unmarkedCount} unmarked · ${changedExistingRowsCount} changed`}
      </div>

      {(canMark || canUpdate) && (
        <button
          type="button"
          className="attendance-primary-button"
          onClick={onSave}
          disabled={
            !canSave ||
            blockedByAmbiguousCreate ||
            saving ||
            loading ||
            hasLoadError ||
            rosterCount === 0 ||
            isFutureDate
          }
        >
          {saving ? (
            <RefreshCw size={17} className="attendance-spinning" />
          ) : (
            <Save size={17} />
          )}
          {saving
            ? "Saving…"
            : blockedByAmbiguousCreate
              ? "Review roster before retrying"
              : canSave
                ? "Save daily attendance"
                : "No changes to save"}
        </button>
      )}
    </div>
  );
}
