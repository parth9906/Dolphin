import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RefreshCw, Search, Users } from "lucide-react";

import { attendanceService } from "../api/attendance-service";
import type { StudentEnrollment } from "../../academics/api/academic-types";
import type {
  DailyAttendanceRecord,
  DailyAttendanceStatus,
} from "../api/attendance-types";
import {
  fetchAllDailyAttendance,
  fetchAllSectionEnrollments,
} from "./daily-attendance-query-service";
import { DailyAttendanceRoster } from "./DailyAttendanceRoster";
import type { DailyAttendanceDraft } from "./DailyAttendanceRoster";
import { DailyAttendanceToolbar } from "./DailyAttendanceToolbar";
import { DailyAttendanceFilters } from "./DailyAttendanceFilters";
import { DailyAttendanceSaveBar } from "./DailyAttendanceSaveBar";

interface DailyAttendancePanelProps {
  institutionId: string;
  sectionId: string;
  attendanceDate: string;
  canRead: boolean;
  canMark: boolean;
  canUpdate: boolean;
  onDirtyChange?: (hasUnsavedChanges: boolean) => void;
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

// Keep the empty query fallback referentially stable while enrollment data loads.
const EMPTY_ENROLLMENTS: StudentEnrollment[] = [];

function nextAttendanceStatus(
  current: DailyAttendanceStatus | null,
): DailyAttendanceStatus {
  if (current === null || current === "EXCUSED") return "PRESENT";
  if (current === "PRESENT") return "ABSENT";
  if (current === "ABSENT") return "LATE";
  return "EXCUSED";
}

function errorText(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "The attendance request could not be completed.";
}

function createDraft(
  enrollment: StudentEnrollment,
  existing?: DailyAttendanceRecord,
): DailyAttendanceDraft {
  return {
    studentId: enrollment.studentId,
    studentName: enrollment.studentName,
    admissionNumber: enrollment.admissionNumber,
    attendanceRecordId: existing?.id ?? null,
    status: existing?.status ?? null,
    remarks: existing?.remarks ?? "",
    originalStatus: existing?.status ?? null,
    originalRemarks: existing?.remarks ?? "",
  };
}

export function DailyAttendancePanel({
  institutionId,
  sectionId,
  attendanceDate,
  canRead,
  canMark,
  canUpdate,
  onDirtyChange,
}: DailyAttendancePanelProps) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, DailyAttendanceDraft>>({});
  const [previousDrafts, setPreviousDrafts] = useState<Record<string, DailyAttendanceDraft> | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "UNMARKED" | DailyAttendanceStatus>("ALL");
  const [expandedRemarks, setExpandedRemarks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [refreshingForReview, setRefreshingForReview] = useState(false);
  const [createOutcomeUncertain, setCreateOutcomeUncertain] = useState(false);
  const [createOutcomeError, setCreateOutcomeError] = useState("");
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");

  const draftContextKey = `${institutionId}::${sectionId}::${attendanceDate}`;
  const previousDraftContextKey = useRef(draftContextKey);

  const enrollmentsQuery = useQuery({
    queryKey: ["attendance", "daily", "enrollments", sectionId],
    queryFn: () => fetchAllSectionEnrollments(sectionId),
    enabled: Boolean(sectionId && canRead),
    staleTime: 20_000,
  });

  const dailyRecordsQuery = useQuery({
    queryKey: [
      "attendance",
      "daily",
      "records",
      institutionId,
      attendanceDate,
    ],
    queryFn: () => fetchAllDailyAttendance(institutionId, attendanceDate),
    enabled: Boolean(institutionId && attendanceDate && canRead),
    staleTime: 15_000,
  });

  const allEnrollments = enrollmentsQuery.data ?? EMPTY_ENROLLMENTS;

  // Include students whose enrollment interval covers the selected date.
  const enrolledStudents = useMemo(
    () =>
      allEnrollments.filter(
        (enrollment) =>
          enrollment.startDate <= attendanceDate &&
          (!enrollment.endDate || enrollment.endDate >= attendanceDate),
      ),
    [allEnrollments, attendanceDate],
  );

  const roster = useMemo(() => {
    const recordsByStudent = new Map(
      (dailyRecordsQuery.data ?? [])
        .filter((record) => record.attendanceDate === attendanceDate)
        .map((record) => [record.studentId, record]),
    );

    return enrolledStudents.map((enrollment) =>
      createDraft(enrollment, recordsByStudent.get(enrollment.studentId)),
    );
  }, [enrolledStudents, dailyRecordsQuery.data, attendanceDate]);

  useEffect(() => {
    const contextChanged =
      previousDraftContextKey.current !== draftContextKey;

    previousDraftContextKey.current = draftContextKey;

    setDrafts((current) => {
      if (contextChanged) {
        return Object.fromEntries(roster.map((row) => [row.studentId, row]));
      }

      return Object.fromEntries(
        roster.map((serverRow) => {
          const localRow = current[serverRow.studentId];

          if (!localRow) {
            return [serverRow.studentId, serverRow];
          }

          const localHasChanges =
            localRow.status !== localRow.originalStatus ||
            localRow.remarks !== localRow.originalRemarks;

          const localMatchesServer =
            localRow.status === serverRow.status &&
            localRow.remarks === serverRow.remarks;

          // Adopt the server row when there are no local edits, or when a
          // refreshed record confirms that the draft has been saved.
          if (!localHasChanges || localMatchesServer) {
            return [serverRow.studentId, serverRow];
          }

          // Retain unsaved edits, but refresh the original values and record ID
          // so subsequent saves compare against the latest server record.
          return [
            serverRow.studentId,
            {
              ...serverRow,
              status: localRow.status,
              remarks: localRow.remarks,
            },
          ];
        }),
      );
    });

    if (contextChanged) {
      setPreviousDrafts(null);
      setExpandedRemarks({});
      setStudentSearch("");
      setStatusFilter("ALL");
      setCreateOutcomeUncertain(false);
      setCreateOutcomeError("");
      setRefreshingForReview(false);
      setNotice("");
      setFormError("");
    }
  }, [roster, draftContextKey]);

  const draftRows = useMemo(
    () => roster.map((row) => drafts[row.studentId] ?? row),
    [roster, drafts],
  );

  const hasUnsavedChanges = useMemo(
    () =>
      draftRows.some(
        (row) =>
          row.status !== row.originalStatus ||
          row.remarks !== row.originalRemarks,
      ),
    [draftRows],
  );

  useEffect(() => {
    onDirtyChange?.(hasUnsavedChanges);
  }, [hasUnsavedChanges, onDirtyChange]);

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [hasUnsavedChanges]);

  const visibleDraftRows = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase();

    return draftRows.filter((row) => {
      const matchesSearch =
        !query ||
        row.studentName.toLocaleLowerCase().includes(query) ||
        row.admissionNumber.toLocaleLowerCase().includes(query);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "UNMARKED"
          ? row.status === null
          : row.status === statusFilter);

      return matchesSearch && matchesStatus;
    });
  }, [draftRows, studentSearch, statusFilter]);

  const newRows = draftRows.filter(
    (row): row is DailyAttendanceDraft & { status: DailyAttendanceStatus } =>
      !row.attendanceRecordId && row.status !== null,
  );

  const changedExistingRows = draftRows.filter(
    (row): row is DailyAttendanceDraft & { status: DailyAttendanceStatus } =>
      Boolean(row.attendanceRecordId) &&
      row.status !== null &&
      (row.status !== row.originalStatus ||
        row.remarks !== row.originalRemarks),
  );

  const editableRows = draftRows.filter((row) =>
    row.attendanceRecordId ? canUpdate : canMark,
  );

  const counts = useMemo(
    () => ({
      PRESENT: draftRows.filter((row) => row.status === "PRESENT").length,
      ABSENT: draftRows.filter((row) => row.status === "ABSENT").length,
      LATE: draftRows.filter((row) => row.status === "LATE").length,
      EXCUSED: draftRows.filter((row) => row.status === "EXCUSED").length,
    }),
    [draftRows],
  );

  const unmarkedCount = draftRows.filter((row) => row.status === null).length;

  const statusFilters: Array<{
    value: "ALL" | "UNMARKED" | DailyAttendanceStatus;
    label: string;
    count: number;
  }> = [
    { value: "ALL", label: "All", count: draftRows.length },
    { value: "UNMARKED", label: "Unmarked", count: unmarkedCount },
    ...statusOptions.map((status) => ({
      value: status,
      label: statusLabels[status],
      count: counts[status],
    })),
  ];

  const isFutureDate = attendanceDate > localDateString();

  function localDateString(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function updateDraft(
    studentId: string,
    change: Partial<Pick<DailyAttendanceDraft, "status" | "remarks">>,
    trackUndo = true,
  ) {
    if (trackUndo) {
      setPreviousDrafts(drafts);
    }
    setNotice("");
    setFormError("");
    setDrafts((current) => {
      const existing = current[studentId];
      if (!existing) return current;

      return {
        ...current,
        [studentId]: { ...existing, ...change },
      };
    });
  }

  function markAllPresent() {
    setPreviousDrafts(drafts);
    setNotice("");
    setFormError("");
    setDrafts((current) => {
      const next = { ...current };

      for (const row of draftRows) {
        const canEdit = row.attendanceRecordId ? canUpdate : canMark;
        if (!canEdit) continue;

        const currentRow = next[row.studentId] ?? row;
        next[row.studentId] = { ...currentRow, status: "PRESENT" };
      }

      return next;
    });
  }

  function undoLastChange() {
    if (!previousDrafts || saving) return;

    const restoredDrafts = Object.fromEntries(
      Object.entries(previousDrafts).map(([studentId, previousRow]) => {
        const currentRow = drafts[studentId];
        return [
          studentId,
          currentRow
            ? { ...previousRow, remarks: currentRow.remarks }
            : previousRow,
        ];
      }),
    );

    setDrafts(restoredDrafts);
    setPreviousDrafts(null);
    setNotice("Last attendance status change undone. Remarks were kept.");
    setFormError("");
  }

  async function refreshRoster() {
    if (saving || refreshingForReview) return;

    const requiresReview = createOutcomeUncertain;
    setRefreshingForReview(true);
    setNotice("");
    setFormError("");

    try {
      const [enrollmentsResult, recordsResult] = await Promise.all([
        enrollmentsQuery.refetch(),
        dailyRecordsQuery.refetch(),
      ]);
      const refreshErrors = [
        enrollmentsResult.isError
          ? `Enrollment refresh failed: ${errorText(enrollmentsResult.error)}`
          : null,
        recordsResult.isError
          ? `Attendance-record refresh failed: ${errorText(recordsResult.error)}`
          : null,
      ].filter((message): message is string => message !== null);

      if (refreshErrors.length > 0) {
        const details = refreshErrors.join(" ");
        if (requiresReview) {
          setCreateOutcomeError(
            `${details} Saving remains blocked until both enrollment and attendance records can be refreshed.`,
          );
        } else {
          setFormError(details);
        }
        return;
      }

      if (requiresReview) {
        setCreateOutcomeUncertain(false);
        setCreateOutcomeError("");
        setNotice(
          "Roster refreshed. Review existing attendance records before retrying the save.",
        );
      } else {
        setNotice("Daily attendance roster refreshed.");
      }
    } catch (error) {
      if (requiresReview) {
        setCreateOutcomeError(
          `The roster could not be refreshed: ${errorText(error)} Saving remains blocked until the roster can be reviewed.`,
        );
      } else {
        setFormError(`The roster could not be refreshed: ${errorText(error)}`);
      }
    } finally {
      setRefreshingForReview(false);
    }
  }

  async function handleSave() {
    if (
      !canRead ||
      saving ||
      createOutcomeUncertain ||
      !institutionId ||
      !sectionId ||
      !attendanceDate ||
      isFutureDate
    ) {
      return;
    }

    const rowsToCreate = draftRows.filter(
      (row): row is DailyAttendanceDraft & { status: DailyAttendanceStatus } =>
        !row.attendanceRecordId && row.status !== null,
    );
    const rowsToUpdate = draftRows.filter(
      (row): row is DailyAttendanceDraft & { status: DailyAttendanceStatus } =>
        Boolean(row.attendanceRecordId) &&
        row.status !== null &&
        (row.status !== row.originalStatus ||
          row.remarks !== row.originalRemarks),
    );

    if (rowsToCreate.length > 0 && !canMark) {
      setFormError(
        "Your account does not have ATTENDANCE_MARK permission.",
      );
      return;
    }

    if (rowsToUpdate.length > 0 && !canUpdate) {
      setFormError(
        "Your account does not have ATTENDANCE_UPDATE permission.",
      );
      return;
    }

    if (rowsToCreate.length === 0 && rowsToUpdate.length === 0) {
      setNotice("Attendance is already up to date.");
      return;
    }

    setSaving(true);
    setPreviousDrafts(null);
    setNotice("");
    setFormError("");

    try {
      let createFailure: string | null = null;

      if (rowsToCreate.length > 0) {
        try {
          await attendanceService.markDailyAttendance({
            institutionId,
            attendanceDate,
            records: rowsToCreate.map((row) => ({
              studentId: row.studentId,
              status: row.status,
              remarks: row.remarks.trim() || null,
            })),
          });
        } catch (error) {
          // The server may have processed the batch despite an error response.
          createFailure = errorText(error);
          setCreateOutcomeUncertain(true);
          setCreateOutcomeError(
            `The new-attendance batch request failed and the server may still have processed it. Error: ${createFailure} Refresh and review the roster before retrying.`,
          );
        }
      }

      const updateFailures: Array<{
        studentName: string;
        message: string;
      }> = [];

      for (const row of rowsToUpdate) {
        if (!row.attendanceRecordId) continue;

        try {
          await attendanceService.updateDailyAttendance(
            row.attendanceRecordId,
            {
              status: row.status,
              remarks: row.remarks.trim() || null,
            },
          );
        } catch (error) {
          updateFailures.push({
            studentName: row.studentName,
            message: errorText(error),
          });
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["attendance", "daily", "enrollments", sectionId],
        }),
        queryClient.invalidateQueries({
          queryKey: [
            "attendance",
            "daily",
            "records",
            institutionId,
            attendanceDate,
          ],
        }),
      ]);

      if (updateFailures.length === 0 && !createFailure) {
        setNotice("Daily attendance saved successfully.");
      } else {
        const failureMessages: string[] = [];

        if (updateFailures.length > 0) {
          const failedNames = updateFailures
            .slice(0, 3)
            .map((failure) => failure.studentName)
            .join(", ");
          const remainingCount = updateFailures.length - 3;
          const additionalNames =
            remainingCount > 0 ? ` and ${remainingCount} more` : "";

          failureMessages.push(
            `${updateFailures.length} daily attendance update(s) failed: ` +
              `${failedNames}${additionalNames}. ` +
              `First update error: ${updateFailures[0].message}`,
          );
        }

        setFormError(
          failureMessages.length > 0
            ? `${failureMessages.join(" ")} Review the refreshed roster before retrying.`
            : "",
        );
      }
    } catch (error) {
      setFormError(
        `${errorText(error)} Some changes may already have been saved. Refresh the roster and review existing records before retrying.`,
      );

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: [
            "attendance",
            "daily",
            "records",
            institutionId,
            attendanceDate,
          ],
        }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "daily", "enrollments", sectionId],
        }),
      ]);
    } finally {
      setSaving(false);
    }
  }

  if (!canRead) {
    return (
      <section className="attendance-panel attendance-roster-panel">
        <div className="attendance-empty">
          <Users size={27} />
          <strong>Daily attendance access required</strong>
          <p>
            Your account needs ATTENDANCE_READ permission to view daily
            attendance for this section.
          </p>
        </div>
      </section>
    );
  }

  const loading = enrollmentsQuery.isLoading || dailyRecordsQuery.isLoading;
  const loadError = enrollmentsQuery.error ?? dailyRecordsQuery.error;
  const canSave =
    (canMark && newRows.length > 0) ||
    (canUpdate && changedExistingRows.length > 0);

  return (
    <section className="attendance-panel attendance-roster-panel">
      <DailyAttendanceToolbar
        attendanceDate={attendanceDate}
        studentCount={draftRows.length}
        loading={loading}
        sectionSelected={Boolean(sectionId)}
        canMark={canMark}
        canUpdate={canUpdate}
        editableRowCount={editableRows.length}
        saving={saving}
        isFutureDate={isFutureDate}
        canUndo={Boolean(previousDrafts)}
        onMarkAllPresent={markAllPresent}
        onUndo={undoLastChange}
        onRefresh={() => void refreshRoster()}
      />

      {notice && (
        <div
          className="attendance-alert attendance-alert--success"
          role="status"
        >
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {formError && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <span>{formError}</span>
        </div>
      )}

      {createOutcomeError && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <span>{createOutcomeError}</span>
          {createOutcomeUncertain && (
            <button
              type="button"
              className="attendance-secondary-button"
              disabled={saving || refreshingForReview}
              onClick={() => void refreshRoster()}
            >
              <RefreshCw
                size={16}
                className={refreshingForReview ? "attendance-spinning" : ""}
                aria-hidden="true"
              />
              {refreshingForReview ? "Refreshing roster…" : "Refresh and review roster"}
            </button>
          )}
        </div>
      )}

      {loadError && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <span>{errorText(loadError)}</span>
        </div>
      )}

      {isFutureDate && (
        <div className="attendance-alert attendance-alert--error" role="status">
          Daily attendance cannot be marked for a future date.
        </div>
      )}

      <div className="attendance-live-summary attendance-live-summary--daily">
        {statusOptions.map((status) => (
          <div
            className={`attendance-live-summary__card attendance-live-summary__card--${status.toLowerCase()}`}
            key={status}
          >
            <span>{statusLabels[status]}</span>
            <strong>{counts[status]}</strong>
          </div>
        ))}
      </div>

      {loading && (
        <div className="attendance-empty">
          <RefreshCw size={24} className="attendance-spinning" />
          <strong>Loading daily roster</strong>
          <p>Retrieving section enrollments and existing attendance records.</p>
        </div>
      )}

      {!loading && !loadError && !sectionId && (
        <div className="attendance-empty">
          <Users size={27} />
          <strong>Select a section</strong>
          <p>Choose an academic year, class, and section to load students.</p>
        </div>
      )}

      {!loading && !loadError && sectionId && draftRows.length === 0 && (
        <div className="attendance-empty">
          <Users size={27} />
          <strong>No enrolled students found</strong>
          <p>
            No enrollment overlaps this date. Check the section roster and
            enrollment start and end dates.
          </p>
        </div>
      )}

      {!loading && !loadError && draftRows.length > 0 && (
        <DailyAttendanceFilters
          search={studentSearch}
          onSearchChange={setStudentSearch}
          visibleCount={visibleDraftRows.length}
          totalCount={draftRows.length}
          statusFilter={statusFilter}
          statusFilters={statusFilters}
          onStatusFilterChange={setStatusFilter}
        />
      )}

      {!loading &&
        !loadError &&
        draftRows.length > 0 &&
        visibleDraftRows.length === 0 && (
          <div className="attendance-empty attendance-empty--compact attendance-daily-no-results">
            <Search size={20} />
            <div>
              <strong>No matching students</strong>
              <p>Try another name, admission number, or attendance filter.</p>
            </div>
          </div>
        )}

      {!loading && !loadError && visibleDraftRows.length > 0 && (
        <DailyAttendanceRoster
          rows={visibleDraftRows}
          canMark={canMark}
          canUpdate={canUpdate}
          saving={saving}
          isFutureDate={isFutureDate}
          expandedRemarks={expandedRemarks}
          onUpdateDraft={updateDraft}
          onToggleRemarks={(studentId, open) =>
            setExpandedRemarks((current) => ({ ...current, [studentId]: open }))
          }
          onCycleStatus={(studentId, status) =>
            updateDraft(studentId, { status: nextAttendanceStatus(status) })
          }
        />
      )}

      <DailyAttendanceSaveBar
        isFutureDate={isFutureDate}
        canMark={canMark}
        canUpdate={canUpdate}
        newRowsCount={newRows.length}
        unmarkedCount={unmarkedCount}
        changedExistingRowsCount={changedExistingRows.length}
        canSave={canSave}
        blockedByAmbiguousCreate={createOutcomeUncertain}
        saving={saving}
        loading={loading}
        hasLoadError={Boolean(loadError)}
        rosterCount={draftRows.length}
        onSave={() => void handleSave()}
      />
    </section>
  );
}
