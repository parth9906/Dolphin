import { AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";

import type { UserAccount } from "../../users/api/user-administration-types";
import type { LessonAttendanceAuditEntry } from "../api/attendance-types";
import { displayTimestamp, errorText, statusLabels } from "./attendance-page-utils";

interface AttendanceHistoryPanelProps {
  studentName: string;
  entries: LessonAttendanceAuditEntry[];
  loading: boolean;
  hasError: boolean;
  succeeded: boolean;
  error: unknown;
  canReadUsers: boolean;
  actorsLoading: boolean;
  actorsById: Record<string, UserAccount | null> | undefined;
  onClose: () => void;
  onRetry: () => void;
}

export function AttendanceHistoryPanel({
  studentName,
  entries,
  loading,
  hasError,
  succeeded,
  error,
  canReadUsers,
  actorsLoading,
  actorsById,
  onClose,
  onRetry,
}: AttendanceHistoryPanelProps) {
  return (
    <section
      className="attendance-history-panel"
      aria-label={`Attendance history for ${studentName}`}
    >
      <header className="attendance-history-panel__header">
        <div>
          <h3>Attendance history</h3>
          <p>{studentName}</p>
        </div>
        <button
          type="button"
          className="attendance-history-close"
          onClick={onClose}
          aria-label="Close attendance history"
        >
          <X size={17} />
        </button>
      </header>

      {loading && (
        <div className="attendance-history-message" role="status">
          <RefreshCw size={16} className="attendance-spinning" />
          Loading attendance history…
        </div>
      )}

      {hasError && (
        <div className="attendance-history-error" role="alert">
          <AlertCircle size={16} />
          {errorText(error)}
          <button
            type="button"
            className="attendance-secondary-button"
            onClick={onRetry}
          >
            Retry
          </button>
        </div>
      )}

      {succeeded && entries.length === 0 && (
        <div className="attendance-history-message">
          <CheckCircle2 size={17} />
          No changes have been recorded for this attendance entry yet.
        </div>
      )}

      {succeeded && entries.length > 0 && (
        <div className="attendance-history-list">
          {entries.map((entry) => (
            <article className="attendance-history-entry" key={entry.id}>
              <div className="attendance-history-entry__top">
                <strong>
                  {entry.previousStatus
                    ? statusLabels[entry.previousStatus]
                    : "No previous status"}
                  {" → "}
                  {statusLabels[entry.newStatus]}
                </strong>
                <time dateTime={entry.changedAt}>
                  {displayTimestamp(entry.changedAt)}
                </time>
              </div>

              <p className="attendance-history-entry__actor">
                Changed by:{" "}
                {!canReadUsers
                  ? "Actor details unavailable — USER_READ permission required"
                  : actorsLoading
                    ? "Loading user details…"
                    : (() => {
                        const actor = actorsById?.[entry.changedByUserId];
                        if (!actor) return "Actor details unavailable";

                        const name = [actor.firstName, actor.lastName]
                          .filter((part) => Boolean(part?.trim()))
                          .join(" ") || actor.username;

                        return `${name} · ${actor.email}`;
                      })()}
              </p>

              {(entry.previousRemarks || entry.newRemarks) && (
                <div className="attendance-history-entry__remarks">
                  <div>
                    <span>Previous remarks</span>
                    <p>{entry.previousRemarks || "—"}</p>
                  </div>
                  <div>
                    <span>New remarks</span>
                    <p>{entry.newRemarks || "—"}</p>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
