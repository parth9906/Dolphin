import type { FormEvent } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { ParentPortalStudent } from "../api/parent-portal-types";
import { ErrorMessage } from "./ParentPortalComponents";

interface ParentPortalFiltersProps {
  students: ParentPortalStudent[];
  studentId: string;
  draftStart: string;
  draftEnd: string;
  rangeError: string;
  studentsLoading: boolean;
  studentsError: unknown;
  onStudentChange: (studentId: string) => void;
  onDraftStartChange: (value: string) => void;
  onDraftEndChange: (value: string) => void;
  onApplyRange: (event: FormEvent<HTMLFormElement>) => void;
  onQuickRange: (days: number) => void;
}

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function ParentPortalFilters({
  students,
  studentId,
  draftStart,
  draftEnd,
  rangeError,
  studentsLoading,
  studentsError,
  onStudentChange,
  onDraftStartChange,
  onDraftEndChange,
  onApplyRange,
  onQuickRange,
}: ParentPortalFiltersProps) {
  return (
    <section className="pp-controls">
      <div>
        <label htmlFor="pp-student">Linked student</label>
        {studentsLoading ? (
          <div className="pp-placeholder"><RefreshCw size={15} className="pp-spin" /> Loading linked students…</div>
        ) : studentsError ? (
          <ErrorMessage error={studentsError} />
        ) : students.length === 0 ? (
          <div className="pp-placeholder">No linked students are available for this account.</div>
        ) : (
          <select id="pp-student" value={studentId} onChange={(event) => onStudentChange(event.target.value)}>
            {students.map((item) => (
              <option key={item.studentId} value={item.studentId}>
                {`${item.firstName} ${item.lastName}`.trim()} · {item.admissionNumber}
              </option>
            ))}
          </select>
        )}
      </div>

      <form className="pp-date-form" onSubmit={onApplyRange}>
        <div>
          <label htmlFor="pp-start">From</label>
          <input
            id="pp-start"
            type="date"
            value={draftStart}
            max={draftEnd || undefined}
            onChange={(event) => onDraftStartChange(event.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="pp-end">To</label>
          <input
            id="pp-end"
            type="date"
            value={draftEnd}
            min={draftStart || undefined}
            max={localDate(new Date())}
            onChange={(event) => onDraftEndChange(event.target.value)}
            required
          />
        </div>
        <button className="pp-apply" type="submit">Apply dates</button>
      </form>
      <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8 }}>
        <span style={{ color: "#748297", fontSize: 11, fontWeight: 700 }}>Quick range</span>
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            className="pp-refresh"
            onClick={() => onQuickRange(days)}
            aria-label={`Show last ${days} days of attendance`}
          >
            Last {days} days
          </button>
        ))}
      </div>
      {rangeError && <div className="pp-range-error" role="alert"><AlertCircle size={15} /> {rangeError}</div>}
    </section>
  );
}
