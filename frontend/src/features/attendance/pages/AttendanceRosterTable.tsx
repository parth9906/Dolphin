import Select from "react-select";
import { History } from "lucide-react";

import type { LessonAttendanceStatus } from "../api/attendance-types";
import {
  attendanceSelectStyles,
  attendanceStatusOptions,
  type AttendanceDraft,
} from "./attendance-page-utils";

interface AttendanceRosterTableProps {
  rows: AttendanceDraft[];
  canMark: boolean;
  canUpdate: boolean;
  canReadAttendance: boolean;
  saving: boolean;
  isCancelled: boolean;
  onUpdateDraft: (
    studentId: string,
    update: Partial<Pick<AttendanceDraft, "status" | "remarks">>,
  ) => void;
  onSelectAuditRecord: (record: { recordId: string; studentName: string } | null) => void;
}

export function AttendanceRosterTable({
  rows,
  canMark,
  canUpdate,
  canReadAttendance,
  saving,
  isCancelled,
  onUpdateDraft,
  onSelectAuditRecord,
}: AttendanceRosterTableProps) {
  function renderStatusControl(row: AttendanceDraft, canEditRow: boolean) {
    return (
      <Select
        classNamePrefix="attendance-select"
        className="attendance-status-react-select"
        options={attendanceStatusOptions}
        value={attendanceStatusOptions.find((option) => option.value === row.status) ?? null}
        onChange={(option) => {
          if (option) onUpdateDraft(row.studentId, { status: option.value as LessonAttendanceStatus });
        }}
        isDisabled={!canEditRow || saving || isCancelled}
        isSearchable={false}
        aria-label={`Attendance status for ${row.studentName}`}
        styles={attendanceSelectStyles}
        menuPortalTarget={document.body}
        menuPosition="fixed"
      />
    );
  }

  function renderRemarksInput(row: AttendanceDraft, canEditRow: boolean) {
    return (
      <input
        className="attendance-remarks-input"
        value={row.remarks}
        maxLength={500}
        placeholder="Optional remark"
        disabled={!canEditRow || saving || isCancelled}
        onChange={(event) => onUpdateDraft(row.studentId, { remarks: event.target.value })}
        aria-label={`Remarks for ${row.studentName}`}
      />
    );
  }

  function renderRecordStatus(row: AttendanceDraft, canRead: boolean) {
    const existingRecord = Boolean(row.attendanceRecordId);
    return (
      <div className="attendance-record-actions">
        <span className={`attendance-record-label ${existingRecord ? "attendance-record-label--saved" : "attendance-record-label--new"}`}>
          {existingRecord ? "Recorded" : "Not marked"}
        </span>
        {existingRecord && row.attendanceRecordId && canRead && (
          <button
            type="button"
            className="attendance-secondary-button attendance-history-button"
            onClick={() => onSelectAuditRecord({ recordId: row.attendanceRecordId!, studentName: row.studentName })}
            disabled={saving}
            aria-label={`View attendance history for ${row.studentName}`}
          >
            <History size={14} />
            History
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="attendance-table-wrap attendance-roster-desktop-table">
        <table className="attendance-table">
          <caption className="attendance-table__caption">Lesson attendance roster</caption>
          <thead>
            <tr>
              <th className="attendance-table__number" scope="col">#</th>
              <th scope="col">Student</th>
              <th scope="col">Attendance status</th>
              <th scope="col">Remarks</th>
              <th scope="col">Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const existingRecord = Boolean(row.attendanceRecordId);
              const canEditRow = existingRecord ? canUpdate : canMark;
              return (
                <tr key={row.studentId}>
                  <td className="attendance-table__number">{String(index + 1).padStart(2, "0")}</td>
                  <td><span className="attendance-student-name">{row.studentName}</span></td>
                  <td>{renderStatusControl(row, canEditRow)}</td>
                  <td>{renderRemarksInput(row, canEditRow)}</td>
                  <td>{renderRecordStatus(row, canReadAttendance)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="attendance-roster-mobile-list" aria-label="Lesson attendance roster">
        {rows.map((row, index) => {
          const existingRecord = Boolean(row.attendanceRecordId);
          const canEditRow = existingRecord ? canUpdate : canMark;
          return (
            <article className="attendance-roster-mobile-card" key={row.studentId}>
              <div className="attendance-roster-mobile-card__heading">
                <span className="attendance-roster-mobile-card__number">{String(index + 1).padStart(2, "0")}</span>
                <strong>{row.studentName}</strong>
                {renderRecordStatus(row, canReadAttendance)}
              </div>
              <label className="attendance-roster-mobile-card__field">
                <span>Attendance status</span>
                {renderStatusControl(row, canEditRow)}
              </label>
              <label className="attendance-roster-mobile-card__field">
                <span>Remarks</span>
                {renderRemarksInput(row, canEditRow)}
              </label>
            </article>
          );
        })}
      </div>
    </>
  );
}
