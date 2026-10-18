import { useEffect, useState, type FormEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  Download,
  RefreshCw,
  UsersRound,
} from "lucide-react";
import { parentPortalService } from "../api/parent-portal-service";
import {
  Alerts,
  Empty,
  ErrorMessage,
  Loading,
  StudentCard,
  dateLabel,
  labelStatus,
  percent,
  timeLabel,
} from "../components/ParentPortalComponents";
import { DailyAttendance, LessonHistory } from "../components/ParentAttendanceHistory";
import { ParentPortalFilters } from "../components/ParentPortalFilters";
import { ParentAttendanceSummary } from "../components/ParentAttendanceSummary";
import "./parent-portal-page.css";

function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function shiftedDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDate(date);
}

export function ParentPortalPage() {
  const [studentId, setStudentId] = useState("");
  const [draftStart, setDraftStart] = useState(() => shiftedDate(-29));
  const [draftEnd, setDraftEnd] = useState(() => localDate(new Date()));
  const [startDate, setStartDate] = useState(() => shiftedDate(-29));
  const [endDate, setEndDate] = useState(() => localDate(new Date()));
  const [rangeError, setRangeError] = useState("");

  const studentsQuery = useQuery({
    queryKey: ["parent-portal", "students"],
    queryFn: () => parentPortalService.getLinkedStudents(),
  });
  const students = studentsQuery.data ?? [];
  const student = students.find((item) => item.studentId === studentId);

  useEffect(() => {
    if (students.length === 0) {
      if (studentId) setStudentId("");
    } else if (!students.some((item) => item.studentId === studentId)) {
      setStudentId(students[0].studentId);
    }
  }, [students, studentId]);

  const enabled = Boolean(student && startDate && endDate && startDate <= endDate);

  const summaryQuery = useQuery({
    queryKey: ["parent-portal", studentId, "summary", startDate, endDate],
    queryFn: () => parentPortalService.getLessonSummary(studentId, startDate, endDate),
    enabled,
  });
  const dailyQuery = useQuery({
    queryKey: ["parent-portal", studentId, "daily", startDate, endDate],
    queryFn: () => parentPortalService.getDailyAttendance(studentId, startDate, endDate),
    enabled,
  });
  const historyQuery = useQuery({
    queryKey: ["parent-portal", studentId, "history", startDate, endDate],
    queryFn: () => parentPortalService.getLessonHistory(studentId, startDate, endDate),
    enabled,
  });
  const alertsQuery = useQuery({
    queryKey: ["parent-portal", studentId, "alerts"],
    queryFn: () => parentPortalService.getAttendanceAlerts(studentId),
    enabled: Boolean(student),
  });

  function applyRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRangeError("");
    if (!draftStart || !draftEnd || draftStart > draftEnd) {
      setRangeError("Choose a valid start date and end date.");
      return;
    }
    const start = new Date(`${draftStart}T00:00:00Z`).getTime();
    const end = new Date(`${draftEnd}T00:00:00Z`).getTime();
    const days = Math.floor((end - start) / 86400000) + 1;
    if (days > 90) {
      setRangeError("Choose a date range of no more than 90 days.");
      return;
    }
    setStartDate(draftStart);
    setEndDate(draftEnd);
  }

  const isRefreshing =
    studentsQuery.isFetching ||
    summaryQuery.isFetching ||
    dailyQuery.isFetching ||
    historyQuery.isFetching ||
    alertsQuery.isFetching;

  function applyQuickRange(days: number) {
    const end = localDate(new Date());
    const start = shiftedDate(-(days - 1));
    setDraftStart(start);
    setDraftEnd(end);
    setStartDate(start);
    setEndDate(end);
    setRangeError("");
  }

  function refresh() {
    void studentsQuery.refetch();
    if (studentId) {
      void summaryQuery.refetch();
      void dailyQuery.refetch();
      void historyQuery.refetch();
      void alertsQuery.refetch();
    }
  }

  const summary = summaryQuery.data;

  function exportAttendanceCsv() {
    if (!student || !historyQuery.data) return;

    const records: (string | number)[][] = [
      ["Parent Portal Attendance Report"],
      ["Student", `${student.firstName} ${student.lastName}`.trim()],
      ["Admission number", student.admissionNumber || ""],
      ["From", startDate],
      ["To", endDate],
      ["Attendance rate", summary ? percent(summary.attendancePercentage) : "Not available"],
      ["Eligible lessons", summary?.eligibleLessons ?? ""],
      ["Attended lessons", summary?.attendedLessons ?? ""],
      ["Missed lessons", summary?.missedLessons ?? ""],
      ["Excused lessons", summary?.excusedLessons ?? ""],
      [],
      ["Date", "Subject", "Start time", "End time", "Status", "Remarks"],
      ...historyQuery.data.map((row) => [
        row.lessonDate,
        row.subjectName || "",
        timeLabel(row.startTime),
        timeLabel(row.endTime),
        labelStatus(row.status),
        row.remarks || "",
      ]),
      [],
      ["Daily Attendance"],
      ["Date", "Status", "Remarks"],
      ...(dailyQuery.data ?? []).map((row) => [
        row.attendanceDate,
        labelStatus(row.status),
        row.remarks || "",
      ]),
      [],
      ["Attendance Alerts"],
      ["Period start", "Period end", "Attendance rate", "Threshold", "Status", "Generated at", "Acknowledged at"],
      ...(alertsQuery.data ?? []).map((row) => [
        row.periodStart,
        row.periodEnd,
        percent(row.attendancePercent),
        percent(row.thresholdPercent),
        labelStatus(row.status),
        row.generatedAt,
        row.acknowledgedAt ?? "",
      ]),
    ];

    const csv = records
      .map((record) =>
        record.map((value) => {
          let cell = String(value ?? "");
          if (/^[\t\r\n ]*[=+\-@]/.test(cell)) {
            cell = "'" + cell;
          }
          return `"${cell.replace(/"/g, '""')}"`;
        }).join(",")
      )
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeAdmission = (student.admissionNumber || "student")
      .replace(/[^a-zA-Z0-9_-]+/g, "-");

    link.href = url;
    link.download = `attendance-${safeAdmission}-${startDate}-to-${endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return (
    <main className="parent-portal-page">
      <header className="pp-hero">
        <div>
          <span className="pp-eyebrow">DOLPHIN · FAMILY SPACE</span>
          <h1>Parent Portal</h1>
          <p>Track your child’s attendance, review lesson records, and stay informed about attendance alerts.</p>
        </div>
        <button type="button" className="pp-refresh" onClick={refresh} disabled={isRefreshing}>
          <RefreshCw size={16} className={isRefreshing ? "pp-spin" : ""} /> Refresh
        </button>
      </header>

      <ParentPortalFilters
        students={students}
        studentId={studentId}
        draftStart={draftStart}
        draftEnd={draftEnd}
        rangeError={rangeError}
        studentsLoading={studentsQuery.isLoading}
        studentsError={studentsQuery.error}
        onStudentChange={setStudentId}
        onDraftStartChange={setDraftStart}
        onDraftEndChange={setDraftEnd}
        onApplyRange={applyRange}
        onQuickRange={applyQuickRange}
      />

      {studentsQuery.isLoading && <Loading label="Finding your linked students…" />}
      {studentsQuery.isError && <ErrorMessage error={studentsQuery.error} />}

      {!studentsQuery.isLoading && !studentsQuery.isError && students.length === 0 && (
        <Empty
          title="No linked students yet"
          description="Your account has no active student relationship. Contact the school administrator if this is unexpected."
          icon={<UsersRound size={22} />}
        />
      )}

      {student && (
        <>
          <StudentCard student={student} />

          <div className="pp-section-heading" style={{ flexWrap: "wrap" }}>
            <div>
              <span className="pp-eyebrow">ATTENDANCE OVERVIEW</span>
              <h2>Your child’s attendance</h2>
              <p>{dateLabel(startDate)} – {dateLabel(endDate)}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
              <span className="pp-readonly"><Activity size={15} /> Read only</span>
              <button
                type="button"
                className="pp-refresh"
                onClick={exportAttendanceCsv}
                disabled={historyQuery.isFetching || dailyQuery.isFetching || summaryQuery.isFetching || alertsQuery.isFetching || !historyQuery.data}
              >
                <Download size={16} /> Export CSV
              </button>
            </div>
          </div>

          {summaryQuery.isLoading && <Loading label="Calculating attendance summary…" />}
          {summaryQuery.isError && <ErrorMessage error={summaryQuery.error} />}

          {summary && !summaryQuery.isError && <ParentAttendanceSummary summary={summary} />}

          <div className="pp-grid">
            <Alerts rows={alertsQuery.data ?? []} loading={alertsQuery.isLoading} error={alertsQuery.error} />
            <DailyAttendance key={`${studentId}-${startDate}-${endDate}`} rows={dailyQuery.data ?? []} loading={dailyQuery.isLoading} error={dailyQuery.error} />
          </div>
          <LessonHistory key={studentId} rows={historyQuery.data ?? []} loading={historyQuery.isLoading} error={historyQuery.error} />
        </>
      )}

      <footer className="pp-footer">
        <UsersRound size={15} />
        Information is limited to students linked to your authenticated account.
      </footer>
    </main>
  );
}
