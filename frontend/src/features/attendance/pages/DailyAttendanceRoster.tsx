import {
  CalendarCheck2,
  Check,
  Circle,
  Clock3,
  MessageSquare,
  X,
} from "lucide-react";

import type { DailyAttendanceStatus } from "../api/attendance-types";

export interface DailyAttendanceDraft {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  attendanceRecordId: string | null;
  status: DailyAttendanceStatus | null;
  remarks: string;
  originalStatus: DailyAttendanceStatus | null;
  originalRemarks: string;
}

const statusLabels: Record<DailyAttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
};

const statusOptions: DailyAttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
];

interface DailyAttendanceRosterProps {
  rows: DailyAttendanceDraft[];
  canMark: boolean;
  canUpdate: boolean;
  saving: boolean;
  isFutureDate: boolean;
  expandedRemarks: Record<string, boolean>;
  onUpdateDraft: (
    studentId: string,
    change: Partial<Pick<DailyAttendanceDraft, "status" | "remarks">>,
    trackUndo?: boolean,
  ) => void;
  onToggleRemarks: (studentId: string, open: boolean) => void;
  onCycleStatus: (studentId: string, status: DailyAttendanceStatus | null) => void;
}

export function DailyAttendanceRoster({
  rows,
  canMark,
  canUpdate,
  saving,
  isFutureDate,
  expandedRemarks,
  onUpdateDraft,
  onToggleRemarks,
  onCycleStatus,
}: DailyAttendanceRosterProps) {
  function canEditRow(row: DailyAttendanceDraft): boolean {
    return row.attendanceRecordId ? canUpdate : canMark;
  }

  function remarksAreOpen(row: DailyAttendanceDraft): boolean {
    return expandedRemarks[row.studentId] ?? Boolean(row.remarks.trim());
  }

  function statusIcon(status: DailyAttendanceStatus, size = 17) {
    if (status === "PRESENT") return <Check size={size} aria-hidden="true" />;
    if (status === "ABSENT") return <X size={size} aria-hidden="true" />;
    if (status === "LATE") return <Clock3 size={size} aria-hidden="true" />;
    return <CalendarCheck2 size={size} aria-hidden="true" />;
  }

  return (
    <>
      <div className="attendance-daily-mobile-list" aria-label="Mobile student attendance roster">
        {rows.map((row) => {
          const editable = canEditRow(row) && !saving && !isFutureDate;
          const remarksOpen = remarksAreOpen(row);

          return (
            <div
              key={row.studentId}
              className={`attendance-daily-mobile-row attendance-daily-mobile-row--${row.status?.toLowerCase() ?? "unmarked"}`}
            >
              <button
                type="button"
                className="attendance-daily-mobile-main"
                disabled={!editable}
                aria-label={`${row.studentName}, currently ${row.status ? statusLabels[row.status] : "not marked"}. Tap to change attendance status.`}
                onClick={() => onCycleStatus(row.studentId, row.status)}
              >
                <span className="attendance-daily-mobile-identity">
                  <span className="attendance-daily-mobile-name">
                    <strong>{row.studentName}</strong>
                    <small>Adm. {row.admissionNumber}</small>
                  </span>
                </span>
                <span className="attendance-daily-mobile-status">
                  {row.status ? statusIcon(row.status, 16) : <Circle size={16} aria-hidden="true" />}
                  <span>{row.status ? statusLabels[row.status] : "Unmarked"}</span>
                </span>
              </button>

              <button
                type="button"
                className={`attendance-daily-mobile-note${row.remarks.trim() ? " has-note" : ""}`}
                aria-label={`${remarksOpen ? "Hide" : "Add or edit"} note for ${row.studentName}`}
                aria-expanded={remarksOpen}
                disabled={!editable}
                onClick={() => onToggleRemarks(row.studentId, !remarksOpen)}
              >
                <MessageSquare size={17} aria-hidden="true" />
              </button>

              <div
                className={`attendance-daily-mobile-note-panel${remarksOpen ? " is-open" : ""}`}
                aria-hidden={!remarksOpen}
              >
                <input
                  className="attendance-daily-remarks"
                  type="text"
                  maxLength={500}
                  value={row.remarks}
                  disabled={!editable}
                  tabIndex={remarksOpen ? 0 : -1}
                  aria-label={`Remarks for ${row.studentName}`}
                  placeholder="Add a note…"
                  onKeyDown={(event) => {
                    if (event.key === "Escape") onToggleRemarks(row.studentId, false);
                  }}
                  onChange={(event) =>
                    onUpdateDraft(row.studentId, { remarks: event.target.value }, false)
                  }
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="attendance-table-wrap">
        <table className="attendance-table attendance-daily-table">
          <caption className="attendance-table__caption">Daily student attendance roster</caption>
          <thead>
            <tr>
              <th className="attendance-table__number" scope="col">No.</th>
              <th scope="col">Student</th>
              <th scope="col">Attendance status</th>
              <th scope="col">Remarks</th>
              <th scope="col">Record</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const hasRecord = Boolean(row.attendanceRecordId);
              const editable = canEditRow(row) && !saving && !isFutureDate;
              const remarksOpen = remarksAreOpen(row);
              const rowClassName = [
                "attendance-daily-row",
                hasRecord ? "attendance-daily-row--saved" : "",
                remarksOpen ? "attendance-daily-row--remarks-open" : "",
              ].filter(Boolean).join(" ");

              return (
                <tr className={rowClassName} key={row.studentId}>
                  <td className="attendance-table__number" data-label="No.">
                    {String(index + 1).padStart(2, "0")}
                  </td>
                  <td data-label="Student">
                    <span className="attendance-student-name">{row.studentName}</span>
                    <small className="attendance-daily-admission">Admission No. {row.admissionNumber}</small>
                  </td>
                  <td data-label="Attendance status">
                    <div className="attendance-daily-choice-group" role="group" aria-label={`Choose attendance status for ${row.studentName}`}>
                      {statusOptions.map((status) => (
                        <button
                          key={status}
                          type="button"
                          className={`attendance-daily-choice attendance-daily-choice--${status.toLowerCase()}${row.status === status ? " is-selected" : ""}`}
                          aria-label={`Mark ${row.studentName} ${statusLabels[status]}`}
                          aria-pressed={row.status === status}
                          title={statusLabels[status]}
                          disabled={!editable}
                          onClick={() => onUpdateDraft(row.studentId, { status })}
                        >
                          {statusIcon(status)}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td data-label="Remarks">
                    <button
                      type="button"
                      className="attendance-daily-note-toggle"
                      disabled={!editable}
                      aria-expanded={remarksOpen}
                      onClick={() => onToggleRemarks(row.studentId, !remarksOpen)}
                    >
                      <MessageSquare size={14} aria-hidden="true" />
                      {remarksOpen ? "Hide note" : row.remarks.trim() ? "Edit note" : "Add note"}
                    </button>
                    {remarksOpen && (
                      <input
                        className="attendance-daily-remarks"
                        type="text"
                        maxLength={500}
                        value={row.remarks}
                        disabled={!editable}
                        aria-label={`Remarks for ${row.studentName}`}
                        placeholder="Optional remarks"
                        onChange={(event) => onUpdateDraft(row.studentId, { remarks: event.target.value }, false)}
                      />
                    )}
                  </td>
                  <td data-label="Record">
                    <span className={hasRecord ? "attendance-daily-record attendance-daily-record--saved" : "attendance-daily-record"}>
                      {hasRecord ? "Saved" : "New"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
