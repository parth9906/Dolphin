import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, CalendarDays } from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import { confirmAction } from "../../../lib/ui/dialogs";
import { attendanceService } from "../api/attendance-service";
import { DailyAttendancePanel } from "./DailyAttendancePanel";
import { AttendancePageHeader } from "./AttendancePageHeader";
import { AttendanceFilters } from "./AttendanceFilters";
import { AttendanceLessonRosterPanel } from "./AttendanceLessonRosterPanel";
import { AttendanceLessonSummary } from "./AttendanceLessonSummary";
import type {
  AcademicYear,
  ClassSection,
  LessonAttendanceStatus,
  SchoolClass,
} from "../api/attendance-types";
import { useAttendanceQueries } from "./use-attendance-queries";
import {
  errorText,
  localDateString,
} from "./attendance-page-utils";
import {
  createDraft,
  findStaleAttendanceDrafts,
  hasAttendanceDraftChanges,
  reconcileAttendanceDrafts,
  type AttendanceDraft,
} from "./attendance-draft-utils";

import "./attendance-page.css";

export function AttendancePage() {
  const { hasPermission } = useAuth();
  const queryClient = useQueryClient();
  const [attendanceMode, setAttendanceMode] = useState<"daily" | "lesson">(
    () => hasPermission("ATTENDANCE_READ") ? "daily" : "lesson",
  );

  const [selectedOrganization] = useOrganizationSelection();
  const organizationSelection = {
    clusterId: selectedOrganization.cluster?.id ?? "",
    institutionId: selectedOrganization.institution?.id ?? "",
  };
  const [institutionId, setInstitutionId] = useState(
    organizationSelection.institutionId,
  );
  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [lessonDate, setLessonDate] = useState(localDateString);
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState("");
  const [drafts, setDrafts] = useState<Record<string, AttendanceDraft>>({});
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [formError, setFormError] = useState("");
  const [dailyHasUnsavedChanges, setDailyHasUnsavedChanges] = useState(false);
  const hasUnsavedLessonChanges = Object.values(drafts).some(
    hasAttendanceDraftChanges,
  );
  const hasUnsavedAttendanceChanges =
    dailyHasUnsavedChanges ||
    (attendanceMode === "lesson" && hasUnsavedLessonChanges);
  const [selectedAuditRecord, setSelectedAuditRecord] = useState<{
    recordId: string;
    studentName: string;
  } | null>(null);

  const canReadInstitutions = hasPermission("INSTITUTION_READ");
  const canReadDailyAttendance = hasPermission("ATTENDANCE_READ");
  const canMarkDailyAttendance = hasPermission("ATTENDANCE_MARK");
  const canUpdateDailyAttendance = hasPermission("ATTENDANCE_UPDATE");
  const canReadAttendance = hasPermission("ATTENDANCE_LESSON_READ");
  const canReadUsers = hasPermission("USER_READ");
  const canMark = hasPermission("ATTENDANCE_LESSON_MARK");
  const canUpdate = hasPermission("ATTENDANCE_LESSON_UPDATE");

  useEffect(() => {
    setInstitutionId(organizationSelection.institutionId);
    setAcademicYearId("");
    setSchoolClassId("");
    setSectionId("");
    setSelectedOccurrenceId("");
    setDrafts({});
    setDailyHasUnsavedChanges(false);
    setSelectedAuditRecord(null);
    setFormError("");
    setNotice("");
  }, [organizationSelection.clusterId, organizationSelection.institutionId]);

  const {
    institutionsQuery,
    fallbackInstitutionQuery,
    institutionOptions,
    selectedInstitution,
    institutionSelectOptions,
    academicYearsQuery,
    academicYears,
    academicYearOptions,
    classesQuery,
    classes,
    classOptions,
    sectionsQuery,
    sections,
    sectionOptions,
    scheduleQuery,
    occurrencesQuery,
    occurrences,
    activeOccurrenceId,
    rosterQuery,
    occurrence,
    occurrenceOptions,
    lesson,
    roster,
    auditQuery,
    auditActorsQuery,
  } = useAttendanceQueries({
    clusterId: organizationSelection.clusterId,
    institutionId,
    academicYearId,
    schoolClassId,
    sectionId,
    lessonDate,
    attendanceMode,
    selectedOccurrenceId,
    hasUnsavedAttendanceChanges,
    selectedAuditRecord,
    canReadInstitutions,
    canReadAttendance,
    canReadUsers,
  });

  useEffect(() => {
    if (hasUnsavedAttendanceChanges) return;
    if (
      academicYears.length > 0 &&
      !academicYears.some((item) => item.id === academicYearId)
    ) {
      const preferred = academicYears.find(
        (item: AcademicYear) => item.status.toUpperCase() === "ACTIVE",
      );
      setAcademicYearId((preferred ?? academicYears[0]).id);
    } else if (academicYears.length === 0 && academicYearId) {
      setAcademicYearId("");
    }
  }, [academicYears, academicYearId, hasUnsavedAttendanceChanges]);

  useEffect(() => {
    if (hasUnsavedAttendanceChanges) return;
    if (
      classes.length > 0 &&
      !classes.some((item: SchoolClass) => item.id === schoolClassId)
    ) {
      setSchoolClassId(classes[0].id);
    } else if (classes.length === 0 && schoolClassId) {
      setSchoolClassId("");
    }
  }, [classes, schoolClassId, hasUnsavedAttendanceChanges]);

  useEffect(() => {
    if (hasUnsavedAttendanceChanges) return;
    if (
      sections.length > 0 &&
      !sections.some((item: ClassSection) => item.id === sectionId)
    ) {
      setSectionId(sections[0].id);
    } else if (sections.length === 0 && sectionId) {
      setSectionId("");
    }
  }, [sections, sectionId, hasUnsavedAttendanceChanges]);

  useEffect(() => {
    if (hasUnsavedAttendanceChanges) return;
    if (activeOccurrenceId && selectedOccurrenceId !== activeOccurrenceId) {
      setSelectedOccurrenceId(activeOccurrenceId);
    }
    if (!activeOccurrenceId && selectedOccurrenceId) {
      setSelectedOccurrenceId("");
    }
  }, [
    activeOccurrenceId,
    selectedOccurrenceId,
    hasUnsavedAttendanceChanges,
  ]);

  useEffect(() => {
    if (!rosterQuery.data) return;

    setSelectedAuditRecord(null);
    setDrafts((current) => reconcileAttendanceDrafts(roster, current));
    setNotice("");
    setFormError("");
  }, [rosterQuery.data]);

  const draftRows = useMemo(
    () => roster.map((item) => drafts[item.studentId] ?? createDraft(item)),
    [roster, drafts],
  );

  const staleDraftRows = findStaleAttendanceDrafts(drafts, roster);


  useEffect(() => {
    if (attendanceMode !== "lesson" || !hasUnsavedLessonChanges) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attendanceMode, hasUnsavedLessonChanges]);

  const attendanceCounts = useMemo<Record<LessonAttendanceStatus, number>>(() => {
    const counts: Record<LessonAttendanceStatus, number> = {
      PRESENT: 0,
      ABSENT: 0,
      LATE: 0,
      EXCUSED: 0,
    };

    for (const row of draftRows) {
      counts[row.status] += 1;
    }

    return counts;
  }, [draftRows]);

  const changedExistingRows = draftRows.filter(
    (row) => Boolean(row.attendanceRecordId) && hasAttendanceDraftChanges(row),
  );

  const newRows = draftRows.filter((row) => !row.attendanceRecordId);

  const canSave =
    staleDraftRows.length === 0 &&
    ((canMark && newRows.length > 0) ||
      (canUpdate && changedExistingRows.length > 0));

  const hasEditableRows = draftRows.some(
    (row) => (row.attendanceRecordId ? canUpdate : canMark),
  );

  const isCancelled = occurrence?.status.toUpperCase() === "CANCELLED";

  function clearMessages() {
    setNotice("");
    setFormError("");
  }

  async function confirmAttendanceDraftDiscard(): Promise<boolean> {
    const hasUnsavedChanges =
      attendanceMode === "daily"
        ? dailyHasUnsavedChanges
        : hasUnsavedLessonChanges;

    if (!hasUnsavedChanges) return true;

    return confirmAction({
      title: "Discard attendance changes?",
      text: "Your unsaved attendance edits will be lost.",
      confirmButtonText: "Discard changes",
      cancelButtonText: "Keep editing",
    });
  }

  async function changeInstitution(nextId: string) {
    if (nextId === institutionId) return;
    if (!(await confirmAttendanceDraftDiscard())) return;
    setDailyHasUnsavedChanges(false);
    setInstitutionId(nextId);
    setAcademicYearId("");
    setSchoolClassId("");
    setSectionId("");
    setSelectedOccurrenceId("");
    setDrafts({});
    clearMessages();
  }

  async function changeAcademicYear(nextId: string) {
    if (nextId === academicYearId) return;
    if (!(await confirmAttendanceDraftDiscard())) return;
    setDailyHasUnsavedChanges(false);
    setAcademicYearId(nextId);
    setSchoolClassId("");
    setSectionId("");
    setSelectedOccurrenceId("");
    setDrafts({});
    clearMessages();
  }

  async function changeClass(nextId: string) {
    if (nextId === schoolClassId) return;
    if (!(await confirmAttendanceDraftDiscard())) return;
    setDailyHasUnsavedChanges(false);
    setSchoolClassId(nextId);
    setSectionId("");
    setSelectedOccurrenceId("");
    setDrafts({});
    clearMessages();
  }

  async function changeSection(nextId: string) {
    if (nextId === sectionId) return;
    if (!(await confirmAttendanceDraftDiscard())) return;
    setDailyHasUnsavedChanges(false);
    setSectionId(nextId);
    setSelectedOccurrenceId("");
    setDrafts({});
    clearMessages();
  }

  function updateDraft(
    studentId: string,
    change: Partial<Pick<AttendanceDraft, "status" | "remarks">>,
  ) {
    clearMessages();
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
    if (
      !activeOccurrenceId ||
      saving ||
      isCancelled ||
      !hasEditableRows
    ) {
      return;
    }

    setNotice("");
    setFormError("");

    setDrafts((current) => {
      const next = { ...current };

      for (const item of roster) {
        const row = current[item.studentId] ?? createDraft(item);
        const rowCanBeEdited = row.attendanceRecordId
          ? canUpdate
          : canMark;

        if (!rowCanBeEdited) continue;

        next[item.studentId] = {
          ...row,
          status: "PRESENT",
        };
      }

      return next;
    });

    setNotice(
      "Editable attendance rows are now set to Present. Review exceptions, then save attendance.",
    );
  }

  async function handleSave() {
    if (!occurrence || !activeOccurrenceId || saving || isCancelled) return;

    if (staleDraftRows.length > 0) {
      setFormError(
        "Some edited students are no longer in the refreshed roster. Review and discard those stale edits before saving.",
      );
      return;
    }

    const rowsToCreate = draftRows.filter(
      (row) => !row.attendanceRecordId,
    );
    const rowsToCorrect = draftRows.filter(
      (row) =>
        Boolean(row.attendanceRecordId) &&
        (row.status !== row.originalStatus ||
          row.remarks !== row.originalRemarks),
    );

    if (rowsToCreate.length > 0 && !canMark) {
      setFormError("Your account does not have ATTENDANCE_LESSON_MARK permission.");
      return;
    }

    if (rowsToCorrect.length > 0 && !canUpdate) {
      setFormError("Your account does not have ATTENDANCE_LESSON_UPDATE permission.");
      return;
    }

    if (rowsToCreate.length === 0 && rowsToCorrect.length === 0) {
      setNotice("Attendance is already up to date.");
      return;
    }

    setSaving(true);
    clearMessages();

    try {
      let createFailure: string | null = null;

      if (rowsToCreate.length > 0) {
        try {
          await attendanceService.markAttendance(activeOccurrenceId, {
            records: rowsToCreate.map((row) => ({
              studentId: row.studentId,
              status: row.status,
              remarks: row.remarks.trim() || null,
            })),
          });
        } catch (error) {
          // The server may have processed the batch despite an error response.
          createFailure = errorText(error);
        }
      }

      const correctionFailures: Array<{
        studentName: string;
        message: string;
      }> = [];

      for (const row of rowsToCorrect) {
        if (!row.attendanceRecordId) continue;

        try {
          await attendanceService.correctAttendance(row.attendanceRecordId, {
            status: row.status,
            remarks: row.remarks.trim() || null,
          });
        } catch (error) {
          correctionFailures.push({
            studentName: row.studentName,
            message: errorText(error),
          });
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["attendance", "roster", activeOccurrenceId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["attendance", "occurrences", sectionId, lessonDate],
        }),
      ]);

      if (correctionFailures.length === 0 && !createFailure) {
        setNotice("Attendance saved successfully.");
      } else {
        const failureMessages: string[] = [];

        if (createFailure) {
          failureMessages.push(
            "The new-attendance batch request failed; the server may still " +
              `have processed it. Error: ${createFailure}`,
          );
        }

        if (correctionFailures.length > 0) {
          const failedNames = correctionFailures
            .slice(0, 3)
            .map((failure) => failure.studentName)
            .join(", ");
          const remainingCount = correctionFailures.length - 3;
          const additionalNames =
            remainingCount > 0 ? ` and ${remainingCount} more` : "";

          failureMessages.push(
            `${correctionFailures.length} attendance correction(s) failed: ` +
              `${failedNames}${additionalNames}. ` +
              `First correction error: ${correctionFailures[0].message}`,
          );
        }

        setFormError(
          `${failureMessages.join(" ")} Review the refreshed roster before retrying.`,
        );
      }
    } catch (error) {
      setFormError(
        `${errorText(error)} Some changes may already have been saved. The latest roster will be reloaded; review it before retrying.`,
      );

      await queryClient.invalidateQueries({
        queryKey: ["attendance", "roster", activeOccurrenceId],
      });
    } finally {
      setSaving(false);
    }
  }

  function retryFailedQueries() {
    const retries: Array<() => Promise<unknown>> = [];
    if (institutionsQuery.isError) retries.push(() => institutionsQuery.refetch());
    if (fallbackInstitutionQuery.isError) retries.push(() => fallbackInstitutionQuery.refetch());
    if (academicYearsQuery.isError) retries.push(() => academicYearsQuery.refetch());
    if (classesQuery.isError) retries.push(() => classesQuery.refetch());
    if (sectionsQuery.isError) retries.push(() => sectionsQuery.refetch());
    if (attendanceMode === "lesson") {
      if (scheduleQuery.isError) retries.push(() => scheduleQuery.refetch());
      if (occurrencesQuery.isError) retries.push(() => occurrencesQuery.refetch());
      if (rosterQuery.isError) retries.push(() => rosterQuery.refetch());
    }
    void Promise.all(retries.map((retry) => retry()));
  }

  const queryErrors = [
    institutionsQuery.isError ? institutionsQuery.error : null,
    fallbackInstitutionQuery.isError ? fallbackInstitutionQuery.error : null,
    academicYearsQuery.isError ? academicYearsQuery.error : null,
    classesQuery.isError ? classesQuery.error : null,
    sectionsQuery.isError ? sectionsQuery.error : null,
    ...(attendanceMode === "lesson"
      ? [
          scheduleQuery.isError ? scheduleQuery.error : null,
          occurrencesQuery.isError ? occurrencesQuery.error : null,
          rosterQuery.isError ? rosterQuery.error : null,
        ]
      : []),
  ].filter(Boolean);

  return (
    <main className="attendance-page">
      <AttendancePageHeader
        attendanceMode={attendanceMode}
        canReadDailyAttendance={canReadDailyAttendance}
        canReadLessonAttendance={canReadAttendance}
        queryError={queryErrors.length > 0 ? errorText(queryErrors[0]) : ""}
        notice={notice}
        formError={formError}
        onModeChange={async (nextMode) => {
          if (nextMode === attendanceMode) return;
          if (!(await confirmAttendanceDraftDiscard())) return;
          setDailyHasUnsavedChanges(false);
          setAttendanceMode(nextMode);
          setSelectedOccurrenceId("");
          setSelectedAuditRecord(null);
          setDrafts({});
          clearMessages();
        }}
        onRetry={retryFailedQueries}
      />

      <section className="attendance-panel">
        <div className="attendance-panel__heading">
          <div>
            <h2>{attendanceMode === "daily" ? "Choose a section and date" : "Choose a class and lesson"}</h2>
            <p>
              {attendanceMode === "daily"
                ? "Choose the section whose enrolled students need daily attendance."
                : "Select the lesson occurrence for which you want to view or mark attendance."}
            </p>
          </div>
        </div>

        {!institutionId && (
          <div className="attendance-empty attendance-empty--compact">
            <AlertCircle size={21} />
            <div>
              <strong>No institution selected</strong>
              <p>
                Open Organization and select your institution first, then return to Attendance.
              </p>
            </div>
          </div>
        )}

        {institutionId && !organizationSelection.clusterId && (
          <p className="attendance-help">
            Institution: <strong>{selectedInstitution?.name ?? "Current institution"}</strong>
          </p>
        )}

        <AttendanceFilters
          attendanceMode={attendanceMode}
          institutionId={institutionId}
          institutionSelectOptions={institutionSelectOptions}
          clusterId={organizationSelection.clusterId}
          canReadInstitutions={canReadInstitutions}
          institutionsLoading={institutionsQuery.isLoading}
          institutionOptionsCount={institutionOptions.length}
          academicYearId={academicYearId}
          academicYearOptions={academicYearOptions}
          academicYearsLoading={academicYearsQuery.isLoading}
          schoolClassId={schoolClassId}
          classOptions={classOptions}
          classesLoading={classesQuery.isLoading}
          sectionId={sectionId}
          sectionOptions={sectionOptions}
          sectionsLoading={sectionsQuery.isLoading}
          lessonDate={lessonDate}
          occurrenceOptions={occurrenceOptions}
          activeOccurrenceId={activeOccurrenceId}
          occurrencesLoading={occurrencesQuery.isLoading}
          occurrencesCount={occurrences.length}
          onInstitutionChange={changeInstitution}
          onAcademicYearChange={changeAcademicYear}
          onClassChange={changeClass}
          onSectionChange={changeSection}
          onDateChange={async (nextDate) => {
            if (nextDate === lessonDate) return;
            if (!(await confirmAttendanceDraftDiscard())) return;
            setDailyHasUnsavedChanges(false);
            setLessonDate(nextDate);
            setSelectedOccurrenceId("");
            setDrafts({});
            clearMessages();
          }}
          onOccurrenceChange={async (nextOccurrenceId) => {
            if (nextOccurrenceId === activeOccurrenceId) return;
            if (!(await confirmAttendanceDraftDiscard())) return;
            setDailyHasUnsavedChanges(false);
            setSelectedOccurrenceId(nextOccurrenceId);
            setDrafts({});
            clearMessages();
          }}
        />

        {academicYearsQuery.isLoading && (
          <p className="attendance-inline-status">Loading academic years…</p>
        )}
        {classesQuery.isLoading && (
          <p className="attendance-inline-status">Loading classes…</p>
        )}
        {sectionsQuery.isLoading && (
          <p className="attendance-inline-status">Loading sections…</p>
        )}
        {occurrencesQuery.isLoading && (
          <p className="attendance-inline-status">Loading lessons for this date…</p>
        )}

        {attendanceMode === "lesson" && sectionId &&
          !occurrencesQuery.isLoading && !occurrencesQuery.isError &&
          occurrences.length === 0 && (
            <div className="attendance-empty attendance-empty--compact">
              <CalendarDays size={21} />
              <div>
                <strong>No lesson occurrences found</strong>
                <p>
                  No scheduled occurrence was returned for this section and date.
                  Check that the timetable occurrences have been generated.
                </p>
              </div>
            </div>
          )}

        {attendanceMode === "lesson" && occurrence && (
          <AttendanceLessonSummary occurrence={occurrence} lesson={lesson} />
        )}
      </section>

      {attendanceMode === "daily" ? (
        <DailyAttendancePanel
          institutionId={institutionId}
          sectionId={sectionId}
          attendanceDate={lessonDate}
          canRead={canReadDailyAttendance}
          canMark={canMarkDailyAttendance}
          canUpdate={canUpdateDailyAttendance}
          onDirtyChange={setDailyHasUnsavedChanges}
        />
      ) : (
        <AttendanceLessonRosterPanel
          activeOccurrenceId={activeOccurrenceId}
          rosterCount={roster.length}
          rosterLoading={rosterQuery.isLoading}
          rosterError={rosterQuery.isError}
          rosterFetching={rosterQuery.isFetching}
          canMark={canMark}
          canUpdate={canUpdate}
          canReadAttendance={canReadAttendance}
          canReadUsers={canReadUsers}
          saving={saving}
          isCancelled={isCancelled}
          hasEditableRows={hasEditableRows}
          attendanceCounts={attendanceCounts}
          staleDraftRows={staleDraftRows}
          showDraftSummary={Boolean(
            activeOccurrenceId &&
            !rosterQuery.isLoading &&
            !rosterQuery.isError &&
            roster.length > 0
          )}
          draftRows={draftRows}
          newRowsCount={newRows.length}
          changedExistingRowsCount={changedExistingRows.length}
          canSave={canSave}
          selectedAuditRecord={selectedAuditRecord}
          auditEntries={auditQuery.data ?? []}
          auditLoading={auditQuery.isLoading}
          auditError={auditQuery.isError}
          auditSucceeded={auditQuery.isSuccess}
          auditErrorDetails={auditQuery.error}
          auditActorsLoading={auditActorsQuery.isLoading}
          auditActorsById={auditActorsQuery.data}
          onMarkAllPresent={markAllPresent}
          onRefreshRoster={() => { void rosterQuery.refetch(); }}
          onDiscardStaleEdits={() => {
            const staleStudentIds = new Set(
              staleDraftRows.map((row) => row.studentId),
            );
            setDrafts((current) =>
              Object.fromEntries(
                Object.entries(current).filter(
                  ([studentId]) => !staleStudentIds.has(studentId),
                ),
              ),
            );
            clearMessages();
          }}
          onUpdateDraft={updateDraft}
          onSelectAuditRecord={setSelectedAuditRecord}
          onCloseAudit={() => setSelectedAuditRecord(null)}
          onRetryAudit={() => { void auditQuery.refetch(); }}
          onSave={() => { void handleSave(); }}
        />
      )}
    </main>
  );
}
