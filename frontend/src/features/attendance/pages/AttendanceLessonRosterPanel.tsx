import { ClipboardCheck, RefreshCw, Save, Users } from "lucide-react";

import type { LessonAttendanceAuditEntry, LessonAttendanceStatus } from "../api/attendance-types";
import type { UserAccount } from "../../users/api/user-administration-types";
import { AttendanceDraftStatus } from "./AttendanceDraftStatus";
import { AttendanceHistoryPanel } from "./AttendanceHistoryPanel";
import { AttendanceRosterTable } from "./AttendanceRosterTable";
import type { AttendanceDraft } from "./attendance-page-utils";

interface AttendanceLessonRosterPanelProps {
  activeOccurrenceId: string;
  rosterCount: number;
  rosterLoading: boolean;
  rosterError: boolean;
  rosterFetching: boolean;
  canMark: boolean;
  canUpdate: boolean;
  canReadAttendance: boolean;
  canReadUsers: boolean;
  saving: boolean;
  isCancelled: boolean;
  hasEditableRows: boolean;
  attendanceCounts: Record<LessonAttendanceStatus, number>;
  staleDraftRows: AttendanceDraft[];
  showDraftSummary: boolean;
  draftRows: AttendanceDraft[];
  newRowsCount: number;
  changedExistingRowsCount: number;
  canSave: boolean;
  selectedAuditRecord: { recordId: string; studentName: string } | null;
  auditEntries: LessonAttendanceAuditEntry[];
  auditLoading: boolean;
  auditError: boolean;
  auditSucceeded: boolean;
  auditErrorDetails: unknown;
  auditActorsLoading: boolean;
  auditActorsById: Record<string, UserAccount | null> | undefined;
  onMarkAllPresent: () => void;
  onRefreshRoster: () => void;
  onDiscardStaleEdits: () => void;
  onUpdateDraft: (studentId: string, change: Partial<Pick<AttendanceDraft, "status" | "remarks">>) => void;
  onSelectAuditRecord: (record: { recordId: string; studentName: string } | null) => void;
  onCloseAudit: () => void;
  onRetryAudit: () => void;
  onSave: () => void;
}

export function AttendanceLessonRosterPanel({
  activeOccurrenceId,
  rosterCount,
  rosterLoading,
  rosterError,
  rosterFetching,
  canMark,
  canUpdate,
  canReadAttendance,
  canReadUsers,
  saving,
  isCancelled,
  hasEditableRows,
  attendanceCounts,
  staleDraftRows,
  showDraftSummary,
  draftRows,
  newRowsCount,
  changedExistingRowsCount,
  canSave,
  selectedAuditRecord,
  auditEntries,
  auditLoading,
  auditError,
  auditSucceeded,
  auditErrorDetails,
  auditActorsLoading,
  auditActorsById,
  onMarkAllPresent,
  onRefreshRoster,
  onDiscardStaleEdits,
  onUpdateDraft,
  onSelectAuditRecord,
  onCloseAudit,
  onRetryAudit,
  onSave,
}: AttendanceLessonRosterPanelProps) {
  return (
    <section className="attendance-panel attendance-roster-panel">
      <div className="attendance-panel__heading attendance-roster-heading">
        <div>
          <h2>Student roster</h2>
          <p>
            {rosterLoading
              ? "Loading student roster…"
              : `${rosterCount} student${rosterCount === 1 ? "" : "s"} in this lesson roster`}
          </p>
        </div>

        <div className="attendance-roster-heading__actions">
          <span className="attendance-count">
            <Users size={16} />
            {rosterCount}
          </span>
          {(canMark || canUpdate) && (
            <button
              type="button"
              className="attendance-secondary-button"
              disabled={
                !activeOccurrenceId ||
                rosterCount === 0 ||
                !hasEditableRows ||
                rosterFetching ||
                saving ||
                isCancelled
              }
              onClick={onMarkAllPresent}
              title="Set attendance rows you can edit to Present. Save attendance to persist the changes."
            >
              Mark all present
            </button>
          )}
          <button
            type="button"
            className="attendance-secondary-button"
            disabled={!activeOccurrenceId || rosterFetching || saving}
            onClick={onRefreshRoster}
          >
            <RefreshCw size={15} className={rosterFetching ? "attendance-spinning" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {(staleDraftRows.length > 0 || showDraftSummary) && (
        <AttendanceDraftStatus
          counts={attendanceCounts}
          staleDraftRows={staleDraftRows}
          showSummary={showDraftSummary}
          onDiscardStaleEdits={onDiscardStaleEdits}
        />
      )}

      {!activeOccurrenceId && (
        <div className="attendance-empty">
          <ClipboardCheck size={27} />
          <strong>Select a lesson occurrence</strong>
          <p>The student roster will appear here when a lesson is selected.</p>
        </div>
      )}

      {activeOccurrenceId && rosterLoading && (
        <div className="attendance-empty">
          <RefreshCw size={24} className="attendance-spinning" />
          <strong>Loading roster</strong>
          <p>Retrieving enrolled students and their attendance records.</p>
        </div>
      )}

      {activeOccurrenceId && !rosterLoading && !rosterError && rosterCount === 0 && (
        <div className="attendance-empty">
          <Users size={27} />
          <strong>No students in this roster</strong>
          <p>Check that the section has active student enrollments.</p>
        </div>
      )}

      {rosterCount > 0 && (
        <>
          <AttendanceRosterTable
            rows={draftRows}
            canMark={canMark}
            canUpdate={canUpdate}
            canReadAttendance={canReadAttendance}
            saving={saving}
            isCancelled={isCancelled}
            onUpdateDraft={onUpdateDraft}
            onSelectAuditRecord={onSelectAuditRecord}
          />

          {selectedAuditRecord && (
            <AttendanceHistoryPanel
              studentName={selectedAuditRecord.studentName}
              entries={auditEntries}
              loading={auditLoading}
              hasError={auditError}
              succeeded={auditSucceeded}
              error={auditErrorDetails}
              canReadUsers={canReadUsers}
              actorsLoading={auditActorsLoading}
              actorsById={auditActorsById}
              onClose={onCloseAudit}
              onRetry={onRetryAudit}
            />
          )}

          <div className="attendance-save-bar">
            <div className="attendance-save-bar__hint">
              {isCancelled
                ? "Attendance cannot be marked for a cancelled lesson."
                : !canMark && !canUpdate
                  ? "Read-only access. You can view attendance but cannot change it."
                  : `${newRowsCount} new · ${changedExistingRowsCount} changed`}
            </div>

            {(canMark || canUpdate) && (
              <button
                type="button"
                className="attendance-primary-button"
                onClick={onSave}
                disabled={!canSave || saving || isCancelled}
              >
                {saving ? (
                  <RefreshCw size={17} className="attendance-spinning" />
                ) : (
                  <Save size={17} />
                )}
                {saving
                  ? "Saving…"
                  : staleDraftRows.length > 0
                    ? "Resolve roster changes"
                    : canSave
                      ? "Save attendance"
                      : "No changes to save"}
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
