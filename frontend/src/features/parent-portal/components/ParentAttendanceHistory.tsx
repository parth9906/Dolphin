import { useEffect, useState } from "react";
import { CalendarDays, Clock3 } from "lucide-react";
import type {
  ParentDailyAttendance,
  ParentLessonAttendanceItem,
} from "../api/parent-portal-types";
import {
  Empty,
  ErrorMessage,
  Loading,
  Panel,
  classStatus,
  dateLabel,
  labelStatus,
  timeLabel,
} from "./ParentPortalComponents";

export function DailyAttendance({
  rows, loading, error,
}: {
  rows: ParentDailyAttendance[];
  loading: boolean;
  error: unknown;
}) {
  const [dailyStatusFilter, setDailyStatusFilter] = useState("ALL");
  const [dailySearch, setDailySearch] = useState("");
  const [dailyPage, setDailyPage] = useState(0);
  const [dailyDateOrder, setDailyDateOrder] = useState("DEFAULT");
  const dailyStatuses = [...new Set(rows.map((row) => row.status).filter(Boolean))].sort();
  const filteredDailyRows = rows.filter((row) =>
    (dailyStatusFilter === "ALL" || row.status === dailyStatusFilter) &&
    (
      !dailySearch.trim() ||
      [row.attendanceDate, row.status, row.remarks]
        .some((value) =>
          String(value ?? "").toLocaleLowerCase()
            .includes(dailySearch.trim().toLocaleLowerCase())
        )
    )
  );

  const sortedDailyRows = dailyDateOrder === "DEFAULT"
    ? filteredDailyRows
    : [...filteredDailyRows].sort((a, b) => {
        const comparison = a.attendanceDate.localeCompare(b.attendanceDate);
        return dailyDateOrder === "NEWEST" ? -comparison : comparison;
      });

  const dailyPageSize = 10;
  const dailyPageCount = Math.max(1, Math.ceil(sortedDailyRows.length / dailyPageSize));
  const visibleDailyRows = sortedDailyRows.slice(
    dailyPage * dailyPageSize,
    (dailyPage + 1) * dailyPageSize,
  );

  useEffect(() => {
    setDailyPage(0);
  }, [dailySearch, dailyStatusFilter, dailyDateOrder, rows.length]);

  return (
    <Panel title="Daily attendance" description="Daily records within the selected dates." icon={<Clock3 size={19} />}>
      {loading && <Loading label="Loading daily attendance…" />}
      {!loading && error != null && <ErrorMessage error={error} />}
      {!loading && !error && rows.length === 0 && (
        <Empty title="No daily records found" description="No daily attendance was returned for these dates." />
      )}
      {!loading && !error && rows.length > 0 && (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 12, padding: "12px 17px", borderBottom: "1px solid #edf0f5" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Search daily records
              <input
                type="search"
                placeholder="Date, status, remark…"
                value={dailySearch}
                onChange={(event) => setDailySearch(event.target.value)}
                aria-label="Search daily attendance by date, status, or remark"
                style={{ width: 220, maxWidth: "100%", height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Status
              <select
                value={dailyStatusFilter}
                onChange={(event) => setDailyStatusFilter(event.target.value)}
                style={{ minWidth: 145, height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              >
                <option value="ALL">All statuses</option>
                {dailyStatuses.map((status) => (
                  <option key={status} value={status}>{labelStatus(status)}</option>
                ))}
              </select>
            </label>
            <span style={{ color: "#748297", fontSize: 11, paddingBottom: 9 }} aria-live="polite">
              Showing {filteredDailyRows.length} of {rows.length} days
            </span>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Sort by date
              <select
                value={dailyDateOrder}
                onChange={(event) => setDailyDateOrder(event.target.value)}
                style={{ minWidth: 145, height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              >
                <option value="DEFAULT">Default order</option>
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
              </select>
            </label>
            {(dailySearch || dailyStatusFilter !== "ALL" || dailyDateOrder !== "DEFAULT") && (
              <button
                type="button"
                className="pp-refresh"
                onClick={() => {
                  setDailySearch("");
                  setDailyStatusFilter("ALL");
                  setDailyDateOrder("DEFAULT");
                }}
              >
                Clear filters
              </button>
            )}
          </div>
          {filteredDailyRows.length === 0 ? (
            <Empty title="No matching daily records" description="Try changing the search text or status filter." />
          ) : (
            <div className="pp-list">
              {visibleDailyRows.map((row, index) => (
                <div className="pp-daily-row" key={`${row.attendanceDate}-${index}`}>
                  <div className="pp-row-icon"><CalendarDays size={17} /></div>
                  <div className="pp-daily-row__body">
                    <strong>{dateLabel(row.attendanceDate)}</strong>
                    <span>{row.remarks || "Daily attendance"}</span>
                  </div>
                  <span className={`pp-status pp-status--${classStatus(row.status)}`}>{labelStatus(row.status)}</span>
                </div>
              ))}
            </div>
          )}
          {filteredDailyRows.length > dailyPageSize && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 17px", borderTop: "1px solid #edf0f5" }}>
              <span style={{ color: "#748297", fontSize: 11 }} aria-live="polite">
                Page {dailyPage + 1} of {dailyPageCount}
              </span>
              <button
                type="button"
                className="pp-refresh"
                disabled={dailyPage === 0}
                onClick={() => setDailyPage((page) => Math.max(0, page - 1))}
                aria-label="Previous daily attendance page"
              >
                Previous
              </button>
              <button
                type="button"
                className="pp-refresh"
                disabled={dailyPage >= dailyPageCount - 1}
                onClick={() => setDailyPage((page) => Math.min(dailyPageCount - 1, page + 1))}
                aria-label="Next daily attendance page"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </Panel>
  );
}

export function LessonHistory({
  rows, loading, error,
}: {
  rows: ParentLessonAttendanceItem[];
  loading: boolean;
  error: unknown;
}) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [subjectFilter, setSubjectFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [dateOrder, setDateOrder] = useState("DEFAULT");
  const statusOptions = [...new Set(rows.map((row) => row.status).filter(Boolean))].sort();
  const subjectOptions = [...new Set(
    rows.map((row) => row.subjectName).filter((value): value is string => Boolean(value?.trim()))
  )].sort((a, b) => a.localeCompare(b));
  const filteredRows = rows.filter((row) =>
    (statusFilter === "ALL" || row.status === statusFilter) &&
    (subjectFilter === "ALL" || row.subjectName === subjectFilter) &&
    (
      !searchTerm.trim() ||
      [row.lessonDate, row.subjectName, row.status, row.remarks]
        .some((value) =>
          String(value ?? "").toLocaleLowerCase()
            .includes(searchTerm.trim().toLocaleLowerCase())
        )
    )
  );

  const sortedRows = dateOrder === "DEFAULT"
    ? filteredRows
    : [...filteredRows].sort((a, b) => {
        const comparison = a.lessonDate.localeCompare(b.lessonDate);
        return dateOrder === "NEWEST" ? -comparison : comparison;
      });

  const pageSize = 10;
  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const visibleRows = sortedRows.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  useEffect(() => {
    setCurrentPage(0);
  }, [statusFilter, subjectFilter, searchTerm, dateOrder, rows.length]);

  return (
    <Panel title="Lesson attendance" description="Attendance by subject and scheduled lesson." icon={<CalendarDays size={19} />}>
      {loading && <Loading label="Loading lesson history…" />}
      {!loading && error != null && <ErrorMessage error={error} />}
      {!loading && !error && rows.length === 0 && (
        <Empty title="No lesson records found" description="There are no lesson records for this date range." />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="pp-table-wrap">
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "end", gap: 12, padding: "12px 15px", borderBottom: "1px solid #edf0f5" }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Search lessons
              <input
                type="search"
                aria-label="Search lesson date, subject, status, or remarks"
                placeholder="Subject, date, remark…"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                style={{ width: 210, maxWidth: "100%", height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                style={{ minWidth: 140, height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              >
                <option value="ALL">All statuses</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{labelStatus(status)}</option>
                ))}
              </select>
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Subject
              <select
                value={subjectFilter}
                onChange={(event) => setSubjectFilter(event.target.value)}
                style={{ minWidth: 160, maxWidth: "100%", height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              >
                <option value="ALL">All subjects</option>
                {subjectOptions.map((subject) => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </label>
            <span style={{ color: "#748297", fontSize: 11, paddingBottom: 9 }}>
              Showing {sortedRows.length === 0 ? 0 : currentPage * pageSize + 1}–{Math.min((currentPage + 1) * pageSize, sortedRows.length)} of {sortedRows.length} matching lessons ({rows.length} total)
            </span>
            <label style={{ display: "flex", flexDirection: "column", gap: 6, color: "#53647a", fontSize: 11, fontWeight: 750 }}>
              Sort by date
              <select
                value={dateOrder}
                onChange={(event) => setDateOrder(event.target.value)}
                style={{ minWidth: 145, height: 36, border: "1px solid #dce3ed", borderRadius: 8, padding: "0 9px", background: "#fff", color: "#23344b" }}
              >
                <option value="DEFAULT">Default order</option>
                <option value="NEWEST">Newest first</option>
                <option value="OLDEST">Oldest first</option>
              </select>
            </label>
              {(searchTerm || statusFilter !== "ALL" || subjectFilter !== "ALL" || dateOrder !== "DEFAULT") && (
                <button
                  type="button"
                  className="pp-refresh"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("ALL");
                    setSubjectFilter("ALL");
                    setDateOrder("DEFAULT");
                    setCurrentPage(0);
                  }}
                >
                  Clear filters
                </button>
              )}
          </div>
          <table className="pp-table">
            <thead>
              <tr><th>Date</th><th>Subject</th><th>Scheduled time</th><th>Status</th><th>Remarks</th></tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                    No lessons match these filters.
                  </td>
                </tr>
              ) : visibleRows.map((row) => (
                <tr key={row.attendanceRecordId}>
                  <td data-label="Date">{dateLabel(row.lessonDate)}</td>
                  <td data-label="Subject"><strong>{row.subjectName || "Subject"}</strong></td>
                  <td data-label="Scheduled time">{timeLabel(row.startTime)}–{timeLabel(row.endTime)}</td>
                  <td data-label="Status">
                    <span className={`pp-status pp-status--${classStatus(row.status)}`}>{labelStatus(row.status)}</span>
                  </td>
                  <td data-label="Remarks">{row.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length > pageSize && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, padding: "12px 15px", borderTop: "1px solid #edf0f5" }}>
              <span style={{ color: "#748297", fontSize: 11 }} aria-live="polite">
                Page {currentPage + 1} of {pageCount}
              </span>
              <button
                type="button"
                className="pp-refresh"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage((page) => Math.max(0, page - 1))}
                aria-label="Previous lesson page"
              >
                Previous
              </button>
              <button
                type="button"
                className="pp-refresh"
                disabled={currentPage >= pageCount - 1}
                onClick={() => setCurrentPage((page) => Math.min(pageCount - 1, page + 1))}
                aria-label="Next lesson page"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </Panel>
  );
}

