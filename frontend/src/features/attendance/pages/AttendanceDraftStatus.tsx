import { AlertCircle } from "lucide-react";

import type { LessonAttendanceStatus } from "../api/attendance-types";
import type { AttendanceDraft } from "./attendance-page-utils";

interface AttendanceDraftStatusProps {
  counts: Record<LessonAttendanceStatus, number>;
  staleDraftRows: AttendanceDraft[];
  showSummary: boolean;
  onDiscardStaleEdits: () => void;
}

export function AttendanceDraftStatus({
  counts,
  staleDraftRows,
  showSummary,
  onDiscardStaleEdits,
}: AttendanceDraftStatusProps) {
  return (
    <>
      {staleDraftRows.length > 0 && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <AlertCircle size={18} />
          <div>
            <strong>
              Unsaved edits belong to students no longer in this roster.
            </strong>
            <p>
              {staleDraftRows
                .slice(0, 5)
                .map((row) => row.studentName)
                .join(", ")}
              {staleDraftRows.length > 5
                ? ` and ${staleDraftRows.length - 5} more`
                : ""}
              . Their edits are preserved locally but will not be submitted
              with this roster. Discard these stale edits to continue saving.
            </p>
            <button
              type="button"
              className="attendance-text-button"
              onClick={onDiscardStaleEdits}
            >
              Discard stale edits
            </button>
          </div>
        </div>
      )}

      {showSummary && (
        <section
          className="attendance-live-summary"
          aria-label="Current attendance draft summary"
        >
        <div className="attendance-live-summary__heading">
          <strong>Current draft summary</strong>
          <span>
            Updates as you edit. Changes are saved only when you click Save
            attendance.
          </span>
        </div>
        <div className="attendance-live-summary__grid">
          <div className="attendance-live-summary__card attendance-live-summary__card--present">
            <span>Present</span>
            <strong>{counts.PRESENT}</strong>
          </div>
          <div className="attendance-live-summary__card attendance-live-summary__card--absent">
            <span>Absent</span>
            <strong>{counts.ABSENT}</strong>
          </div>
          <div className="attendance-live-summary__card attendance-live-summary__card--late">
            <span>Late</span>
            <strong>{counts.LATE}</strong>
          </div>
          <div className="attendance-live-summary__card attendance-live-summary__card--excused">
            <span>Excused</span>
            <strong>{counts.EXCUSED}</strong>
          </div>
          </div>
        </section>
      )}
    </>
  );
}
