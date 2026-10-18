import {
  AlertCircle,
  BookOpen,
  BarChart3,
  CheckCircle2,
  ClipboardList,
  RefreshCw,
  TrendingDown,
  Users,
} from "lucide-react";

import type {
  AttendanceGroupAnalytics,
  StudentAttendanceAnalytics,
} from "../api/attendance-analytics-types";

function count(value: number): string {
  return Number(value ?? 0).toLocaleString();
}

function percent(value: number): string {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function safePercent(value: number): number {
  return Math.min(100, Math.max(0, Number(value ?? 0)));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load analytics.";
}

function AnalyticsError({
  error,
  onRetry,
  isRetrying,
}: {
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
}) {
  return (
    <div className="attendance-analytics-error" role="alert">
      <AlertCircle size={17} />
      <span>{errorMessage(error)}</span>
      <button type="button" onClick={onRetry} disabled={isRetrying}>
        <RefreshCw size={14} className={isRetrying ? "attendance-analytics-spin" : undefined} />
        {isRetrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}

export function AttendanceAnalyticsSummary({
  eligible,
  attended,
  missed,
  excused,
  weightedRate,
  isLoading,
}: {
  eligible: number;
  attended: number;
  missed: number;
  excused: number;
  weightedRate: number | null;
  isLoading: boolean;
}) {
  return (
    <section className="attendance-analytics-metrics" aria-label="Attendance summary">
      <article className="attendance-analytics-metric">
        <span className="attendance-analytics-metric__icon"><ClipboardList size={19} /></span>
        <span className="attendance-analytics-metric__label">Eligible lessons</span>
        <strong>{isLoading ? "—" : count(eligible)}</strong>
        <small>Across returned section summaries</small>
      </article>
      <article className="attendance-analytics-metric">
        <span className="attendance-analytics-metric__icon"><CheckCircle2 size={19} /></span>
        <span className="attendance-analytics-metric__label">Attended</span>
        <strong>{isLoading ? "—" : count(attended)}</strong>
        <small>Attended lesson counts</small>
      </article>
      <article className="attendance-analytics-metric">
        <span className="attendance-analytics-metric__icon"><TrendingDown size={19} /></span>
        <span className="attendance-analytics-metric__label">Missed</span>
        <strong>{isLoading ? "—" : count(missed)}</strong>
        <small>Missed lesson counts</small>
      </article>
      <article className="attendance-analytics-metric">
        <span className="attendance-analytics-metric__icon"><BarChart3 size={19} /></span>
        <span className="attendance-analytics-metric__label">Attendance rate</span>
        <strong>{isLoading || weightedRate === null ? "—" : percent(weightedRate)}</strong>
        <small>Weighted by eligible lessons</small>
      </article>
      <article className="attendance-analytics-metric">
        <span className="attendance-analytics-metric__icon"><Users size={19} /></span>
        <span className="attendance-analytics-metric__label">Excused</span>
        <strong>{isLoading ? "—" : count(excused)}</strong>
        <small>Excused lesson counts</small>
      </article>
    </section>
  );
}

export function AttendanceAnalyticsBreakdownTable({
  title,
  description,
  rows,
  isLoading,
  error,
  onRetry,
  isRetrying,
  emptyTitle,
  emptyDescription,
}: {
  title: string;
  description: string;
  rows: AttendanceGroupAnalytics[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <section className="attendance-analytics-panel">
      <header className="attendance-analytics-panel__header">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <span className="attendance-analytics-panel__count">{rows.length}</span>
      </header>

      {isLoading && (
        <div className="attendance-analytics-message">
          <RefreshCw size={17} className="attendance-analytics-spin" />
          Loading analytics…
        </div>
      )}
      {Boolean(error) && <AnalyticsError error={error} onRetry={onRetry} isRetrying={isRetrying} />}
      {!isLoading && !error && rows.length === 0 && (
        <div className="attendance-analytics-message">
          <BookOpen size={19} />
          <div><strong>{emptyTitle}</strong><p>{emptyDescription}</p></div>
        </div>
      )}
      {!isLoading && rows.length > 0 && (
        <div className="attendance-analytics-table-wrap">
          <table className="attendance-analytics-table">
            <thead>
              <tr>
                <th>{title === "Section performance" ? "Section" : "Subject"}</th>
                <th>Attendance</th>
                <th>Attended</th>
                <th>Missed</th>
                <th>Excused</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.groupId}>
                  <td><strong>{row.groupName}</strong></td>
                  <td>
                    <div className="attendance-analytics-rate">
                      <strong>{percent(row.attendancePercentage)}</strong>
                      <span className="attendance-analytics-rate__track">
                        <span style={{ width: `${safePercent(row.attendancePercentage)}%` }} />
                      </span>
                    </div>
                  </td>
                  <td>{count(row.attendedLessons)}</td>
                  <td>{count(row.missedLessons)}</td>
                  <td>{count(row.excusedLessons)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function AttendanceAnalyticsStudentTable({
  title,
  description,
  rows,
  isLoading,
  error,
  onRetry,
  isRetrying,
  emptyDescription,
}: {
  title: string;
  description: string;
  rows: StudentAttendanceAnalytics[];
  isLoading: boolean;
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
  emptyDescription: string;
}) {
  return (
    <section className="attendance-analytics-panel">
      <header className="attendance-analytics-panel__header">
        <div><h2>{title}</h2><p>{description}</p></div>
        <span className="attendance-analytics-panel__count">{rows.length}</span>
      </header>
      {isLoading && (
        <div className="attendance-analytics-message">
          <RefreshCw size={17} className="attendance-analytics-spin" />
          Loading students…
        </div>
      )}
      {Boolean(error) && <AnalyticsError error={error} onRetry={onRetry} isRetrying={isRetrying} />}
      {!isLoading && !error && rows.length === 0 && (
        <div className="attendance-analytics-message">
          <Users size={19} />
          <div><strong>No students to display</strong><p>{emptyDescription}</p></div>
        </div>
      )}
      {!isLoading && rows.length > 0 && (
        <div className="attendance-analytics-table-wrap">
          <table className="attendance-analytics-table">
            <thead><tr><th>Student</th><th>Attendance</th><th>Attended</th><th>Missed</th><th>Excused</th><th>Eligible</th></tr></thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.studentId}>
                  <td><strong>{row.studentName}</strong></td>
                  <td>
                    <div className="attendance-analytics-rate">
                      <strong>{percent(row.attendancePercentage)}</strong>
                      <span className="attendance-analytics-rate__track">
                        <span style={{ width: `${safePercent(row.attendancePercentage)}%` }} />
                      </span>
                    </div>
                  </td>
                  <td>{count(row.attendedLessons)}</td>
                  <td>{count(row.missedLessons)}</td>
                  <td>{count(row.excusedLessons)}</td>
                  <td>{count(row.eligibleLessons)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
