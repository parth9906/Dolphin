import type { ReactNode } from "react";
import {
  AlertCircle,
  Bell,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import type {
  ParentAttendanceAlert,
  ParentPortalStudent,
} from "../api/parent-portal-types";

export function dateLabel(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric", month: "short", year: "numeric",
      }).format(date);
}

export function dateTimeLabel(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, {
        day: "numeric", month: "short", year: "numeric",
        hour: "numeric", minute: "2-digit",
      }).format(date);
}

export function timeLabel(value: string | null | undefined): string {
  return value ? value.slice(0, 5) : "—";
}

export function percent(value: number | null | undefined): string {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

export function classStatus(value: string | null | undefined): string {
  return (value ?? "unknown").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export function labelStatus(value: string | null | undefined): string {
  return value
    ? value.toLowerCase().replace(/_/g, " ").replace(/\b\w/g, (s) => s.toUpperCase())
    : "Unknown";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unable to load this information.";
}

export function ErrorMessage({ error }: { error: unknown }) {
  return (
    <div className="pp-error" role="alert">
      <AlertCircle size={17} />
      <span>{errorMessage(error)}</span>
    </div>
  );
}

export function Loading({ label = "Loading information…" }: { label?: string }) {
  return (
    <div className="pp-loading" role="status">
      <RefreshCw size={17} className="pp-spin" />
      <span>{label}</span>
    </div>
  );
}

export function Empty({
  title, description, icon,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <div className="pp-empty">
      <div className="pp-empty__icon">{icon ?? <CalendarDays size={22} />}</div>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function Panel({
  title, description, icon, children,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="pp-panel">
      <header className="pp-panel__header">
        <div className="pp-panel__icon">{icon}</div>
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

export function StudentCard({ student }: { student: ParentPortalStudent }) {
  const name = `${student.firstName} ${student.lastName}`.trim();
  return (
    <section className="pp-student">
      <div className="pp-student__identity">
        <div className="pp-student__avatar"><GraduationCap size={27} /></div>
        <div>
          <span className="pp-eyebrow">SELECTED STUDENT</span>
          <h2>{name || "Student"}</h2>
          <p>Admission number · {student.admissionNumber || "Not available"}</p>
        </div>
      </div>
      <div className="pp-student__detail">
        <span>Date of birth</span>
        <strong>{dateLabel(student.dateOfBirth)}</strong>
      </div>
      <div className="pp-student__detail">
        <span>Relationship</span>
        <strong className="pp-linked"><CheckCircle2 size={15} /> Linked student</strong>
      </div>
    </section>
  );
}

export function Alerts({
  rows, loading, error,
}: {
  rows: ParentAttendanceAlert[];
  loading: boolean;
  error: unknown;
}) {
  return (
    <Panel title="Attendance alerts" description="Alerts associated with your linked student." icon={<Bell size={19} />}>
      {loading && <Loading label="Loading attendance alerts…" />}
      {!loading && error != null && <ErrorMessage error={error} />}
      {!loading && !error && rows.length === 0 && (
        <Empty title="No attendance alerts" description="There are no attendance alerts to show at the moment." icon={<CheckCircle2 size={22} />} />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="pp-list">
          {rows.map((row) => (
            <article className="pp-alert" key={row.id}>
              <div className="pp-row-icon pp-row-icon--amber"><ShieldAlert size={19} /></div>
              <div className="pp-alert__body">
                <div className="pp-alert__headline">
                  <strong>Attendance {percent(row.attendancePercent)}</strong>
                  <span className={`pp-status pp-status--${classStatus(row.status)}`}>{labelStatus(row.status)}</span>
                </div>
                <p>Threshold: {percent(row.thresholdPercent)}</p>
                <p>Period: {dateLabel(row.periodStart)} – {dateLabel(row.periodEnd)}</p>
                <small>Generated {dateTimeLabel(row.generatedAt)}</small>
                {row.acknowledgedAt && <small>Acknowledged {dateTimeLabel(row.acknowledgedAt)}</small>}
              </div>
            </article>
          ))}
        </div>
      )}
    </Panel>
  );
}

