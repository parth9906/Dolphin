import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import type { ParentLessonAttendanceSummary } from "../api/parent-portal-types";
import { percent } from "./ParentPortalComponents";

function count(value: number | null | undefined): string {
  return Number(value ?? 0).toLocaleString();
}

export function ParentAttendanceSummary({
  summary,
}: {
  summary: ParentLessonAttendanceSummary;
}) {
  return (
    <section className="pp-stats" aria-label="Attendance summary">
      <article className="pp-stat pp-stat--primary">
        <span className="pp-stat__label">Attendance rate</span>
        <strong className="pp-stat__value">{percent(summary.attendancePercentage)}</strong>
        <div className="pp-progress">
          <span style={{ width: `${Math.min(100, Math.max(0, Number(summary.attendancePercentage ?? 0)))}%` }} />
        </div>
        <small>Of eligible lessons in this period</small>
      </article>
      <article className="pp-stat">
        <span className="pp-stat__icon pp-stat__icon--green"><CheckCircle2 size={19} /></span>
        <span className="pp-stat__label">Attended</span>
        <strong className="pp-stat__value">{count(summary.attendedLessons)}</strong>
        <small>Including late arrivals</small>
      </article>
      <article className="pp-stat">
        <span className="pp-stat__icon pp-stat__icon--red"><AlertCircle size={19} /></span>
        <span className="pp-stat__label">Missed</span>
        <strong className="pp-stat__value">{count(summary.missedLessons)}</strong>
        <small>Lessons recorded as absent</small>
      </article>
      <article className="pp-stat">
        <span className="pp-stat__icon pp-stat__icon--amber"><Clock3 size={19} /></span>
        <span className="pp-stat__label">Excused</span>
        <strong className="pp-stat__value">{count(summary.excusedLessons)}</strong>
        <small>Excused lessons</small>
      </article>
    </section>
  );
}
