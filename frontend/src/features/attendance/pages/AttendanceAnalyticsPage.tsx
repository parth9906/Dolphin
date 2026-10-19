import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BarChart3, Download } from "lucide-react";

import { useAuth } from "../../../lib/auth/use-auth";
import { apiClient } from "../../../lib/api/api-client";
import { organizationService } from "../../organization/api/organization-service";
import type { Institution } from "../../organization/api/organization-types";
import { useOrganizationSelection } from "../../organization/hooks/organization-selection";
import type {
  AcademicYear,
  ClassSection,
  SchoolClass,
} from "../api/attendance-types";
import { attendanceAnalyticsService } from "../api/attendance-analytics-service";
import { AttendanceAnalyticsFilters } from "./AttendanceAnalyticsFilters";
import {
  AttendanceAnalyticsBreakdownTable,
  AttendanceAnalyticsStudentTable,
  AttendanceAnalyticsSummary,
} from "./AttendanceAnalyticsResults";

import "./attendance-analytics-page.css";

function csvCell(value: unknown): string {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStart(): string {
  const date = new Date();
  date.setDate(1);
  return localDate(date);
}

export function AttendanceAnalyticsPage() {
  const { hasPermission } = useAuth();
  const [selectedOrganization] = useOrganizationSelection();
  const organizationSelection = {
    clusterId: selectedOrganization.cluster?.id ?? "",
    institutionId: selectedOrganization.institution?.id ?? "",
  };

  const [institutionId, setInstitutionId] = useState(organizationSelection.institutionId);
  const [academicYearId, setAcademicYearId] = useState("");
  const [schoolClassId, setSchoolClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [startDate, setStartDate] = useState(monthStart);
  const [endDate, setEndDate] = useState(localDate);
  const [threshold, setThreshold] = useState("75");

  const canReadInstitutions = hasPermission("INSTITUTION_READ");
  const canReadAttendance = hasPermission("ATTENDANCE_LESSON_READ");
  const validDateRange = Boolean(startDate && endDate && startDate <= endDate);

  useEffect(() => {
    setInstitutionId(organizationSelection.institutionId);
    setAcademicYearId("");
    setSchoolClassId("");
    setSectionId("");
  }, [organizationSelection.clusterId, organizationSelection.institutionId]);

  const institutionsQuery = useQuery({
    queryKey: ["organization", "institutions", organizationSelection.clusterId],
    queryFn: () => organizationService.getInstitutions(organizationSelection.clusterId),
    enabled: Boolean(organizationSelection.clusterId && canReadInstitutions),
    staleTime: 60_000,
  });

  const fallbackInstitutionQuery = useQuery({
    queryKey: ["organization", "institution", institutionId],
    queryFn: () => organizationService.getInstitution(institutionId),
    enabled: Boolean(institutionId && !organizationSelection.clusterId && canReadInstitutions),
    staleTime: 60_000,
  });

  const institutions: Institution[] =
    institutionsQuery.data ??
    (fallbackInstitutionQuery.data ? [fallbackInstitutionQuery.data] : []);

  useEffect(() => {
    if (institutions.length > 0 && !institutions.some((item) => item.id === institutionId)) {
      setInstitutionId(institutions[0].id);
    }
  }, [institutions, institutionId]);

  const academicYearsQuery = useQuery({
    queryKey: ["attendance-analytics", "academic-years", institutionId],
    queryFn: () =>
      apiClient.get<AcademicYear[]>(
        `academic/years?institutionId=${encodeURIComponent(institutionId)}`,
      ),
    enabled: Boolean(institutionId),
    staleTime: 60_000,
  });
  const academicYears = academicYearsQuery.data ?? [];

  const classesQuery = useQuery({
    queryKey: ["attendance-analytics", "classes", academicYearId],
    queryFn: () =>
      apiClient.get<SchoolClass[]>(
        `academic/years/${encodeURIComponent(academicYearId)}/classes`,
      ),
    enabled: Boolean(academicYearId),
    staleTime: 30_000,
  });
  const classes = classesQuery.data ?? [];

  const sectionsQuery = useQuery({
    queryKey: ["attendance-analytics", "sections", schoolClassId],
    queryFn: () =>
      apiClient.get<ClassSection[]>(
        `academic/classes/${encodeURIComponent(schoolClassId)}/sections`,
      ),
    enabled: Boolean(schoolClassId),
    staleTime: 30_000,
  });
  const sections = sectionsQuery.data ?? [];

  useEffect(() => {
    if (academicYears.length > 0 && !academicYears.some((item) => item.id === academicYearId)) {
      const preferred = academicYears.find((item) => item.status.toUpperCase() === "ACTIVE");
      setAcademicYearId((preferred ?? academicYears[0]).id);
    } else if (academicYears.length === 0 && academicYearId) {
      setAcademicYearId("");
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    if (classes.length > 0 && !classes.some((item) => item.id === schoolClassId)) {
      setSchoolClassId(classes[0].id);
    } else if (classes.length === 0 && schoolClassId) {
      setSchoolClassId("");
    }
  }, [classes, schoolClassId]);

  useEffect(() => {
    if (sections.length > 0 && !sections.some((item) => item.id === sectionId)) {
      setSectionId(sections[0].id);
    } else if (sections.length === 0 && sectionId) {
      setSectionId("");
    }
  }, [sections, sectionId]);

  const sectionAnalyticsQuery = useQuery({
    queryKey: ["attendance-analytics", "section-performance", institutionId, startDate, endDate],
    queryFn: () => attendanceAnalyticsService.getSectionAnalytics(institutionId, startDate, endDate),
    enabled: Boolean(institutionId && canReadAttendance && validDateRange),
    staleTime: 20_000,
  });

  const subjectAnalyticsQuery = useQuery({
    queryKey: ["attendance-analytics", "subject-performance", institutionId, startDate, endDate],
    queryFn: () => attendanceAnalyticsService.getSubjectAnalytics(institutionId, startDate, endDate),
    enabled: Boolean(institutionId && canReadAttendance && validDateRange),
    staleTime: 20_000,
  });

  const studentAnalyticsQuery = useQuery({
    queryKey: ["attendance-analytics", "students", institutionId, sectionId, startDate, endDate],
    queryFn: () => attendanceAnalyticsService.getStudentAnalytics(institutionId, sectionId, startDate, endDate),
    enabled: Boolean(institutionId && sectionId && canReadAttendance && validDateRange),
    staleTime: 20_000,
  });

  const lowAttendanceQuery = useQuery({
    queryKey: ["attendance-analytics", "low-attendance", institutionId, sectionId, startDate, endDate, threshold],
    queryFn: () => attendanceAnalyticsService.getLowAttendanceStudents(
      institutionId, sectionId, startDate, endDate, Number(threshold),
    ),
    enabled: Boolean(institutionId && sectionId && canReadAttendance && validDateRange),
    staleTime: 20_000,
  });

  const sectionRows = sectionAnalyticsQuery.data ?? [];
  const subjectRows = subjectAnalyticsQuery.data ?? [];
  const studentRows = studentAnalyticsQuery.data ?? [];
  const lowAttendanceRows = lowAttendanceQuery.data ?? [];

  const analyticsLoading =
    sectionAnalyticsQuery.isLoading ||
    subjectAnalyticsQuery.isLoading ||
    studentAnalyticsQuery.isLoading ||
    lowAttendanceQuery.isLoading;

  const hasExportRows =
    sectionRows.length +
      subjectRows.length +
      studentRows.length +
      lowAttendanceRows.length >
    0;

  const summary = useMemo(() => {
    const eligible = sectionRows.reduce((sum, row) => sum + Number(row.eligibleLessons ?? 0), 0);
    const attended = sectionRows.reduce((sum, row) => sum + Number(row.attendedLessons ?? 0), 0);
    const missed = sectionRows.reduce((sum, row) => sum + Number(row.missedLessons ?? 0), 0);
    const excused = sectionRows.reduce((sum, row) => sum + Number(row.excusedLessons ?? 0), 0);
    const weightedRate = eligible > 0
      ? sectionRows.reduce(
          (sum, row) => sum + Number(row.attendancePercentage ?? 0) * Number(row.eligibleLessons ?? 0),
          0,
        ) / eligible
      : null;
    return { eligible, attended, missed, excused, weightedRate };
  }, [sectionRows]);

  function changeInstitution(nextId: string) {
    setInstitutionId(nextId);
    setAcademicYearId("");
    setSchoolClassId("");
    setSectionId("");
  }

  function changeYear(nextId: string) {
    setAcademicYearId(nextId);
    setSchoolClassId("");
    setSectionId("");
  }

  function changeClass(nextId: string) {
    setSchoolClassId(nextId);
    setSectionId("");
  }

  function exportAnalyticsCsv() {
    const selectedInstitutionName =
      institutions.find((item) => item.id === institutionId)?.name ??
      institutionId;
    const selectedSectionName =
      sections.find((item) => item.id === sectionId)?.name ?? "";

    const csvRows: Array<Array<string | number | null | undefined>> = [
      [
        "Report",
        "Data scope",
        "Record ID",
        "Record name",
        "Attended lessons",
        "Missed lessons",
        "Excused lessons",
        "Eligible lessons",
        "Attendance percentage",
        "Low-attendance threshold (%)",
        "Institution",
        "Section",
        "Start date",
        "End date",
      ],
      ...sectionRows.map((row) => [
        "Section performance",
        "Institution",
        row.groupId,
        row.groupName,
        row.attendedLessons,
        row.missedLessons,
        row.excusedLessons,
        row.eligibleLessons,
        Number(row.attendancePercentage ?? 0).toFixed(1),
        "",
        selectedInstitutionName,
        "",
        startDate,
        endDate,
      ]),
      ...subjectRows.map((row) => [
        "Subject performance",
        "Institution",
        row.groupId,
        row.groupName,
        row.attendedLessons,
        row.missedLessons,
        row.excusedLessons,
        row.eligibleLessons,
        Number(row.attendancePercentage ?? 0).toFixed(1),
        "",
        selectedInstitutionName,
        "",
        startDate,
        endDate,
      ]),
      ...studentRows.map((row) => [
        "Student attendance",
        "Section",
        row.studentId,
        row.studentName,
        row.attendedLessons,
        row.missedLessons,
        row.excusedLessons,
        row.eligibleLessons,
        Number(row.attendancePercentage ?? 0).toFixed(1),
        "",
        selectedInstitutionName,
        selectedSectionName,
        startDate,
        endDate,
      ]),
      ...lowAttendanceRows.map((row) => [
        "Low attendance",
        "Section",
        row.studentId,
        row.studentName,
        row.attendedLessons,
        row.missedLessons,
        row.excusedLessons,
        row.eligibleLessons,
        Number(row.attendancePercentage ?? 0).toFixed(1),
        Number(threshold),
        selectedInstitutionName,
        selectedSectionName,
        startDate,
        endDate,
      ]),
    ];

    const csv = csvRows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-analytics-${startDate || "all-dates"}-to-${endDate || "all-dates"}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
  }

  const activeError =
    (institutionsQuery.isError && institutionsQuery.error) ||
    (fallbackInstitutionQuery.isError && fallbackInstitutionQuery.error);

  return (
    <main className="attendance-analytics-page">
      <header className="attendance-analytics-hero">
        <div>
          <p className="attendance-analytics-eyebrow">ACADEMIC INSIGHTS</p>
          <h1>Attendance Analytics</h1>
          <p>Track attendance performance across sections, subjects, and students.</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={exportAnalyticsCsv}
            disabled={!canReadAttendance || analyticsLoading || !hasExportRows}
            aria-label="Export attendance analytics as CSV"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "10px 14px",
              border: "1px solid var(--border-color, #d1d5db)",
              borderRadius: "10px",
              background: "var(--card-background, #ffffff)",
              color: "var(--text-color, #111827)",
              fontWeight: 600,
              cursor:
                !canReadAttendance || analyticsLoading || !hasExportRows
                  ? "not-allowed"
                  : "pointer",
              opacity:
                !canReadAttendance || analyticsLoading || !hasExportRows
                  ? 0.55
                  : 1,
            }}
          >
            <Download size={17} />
            Export CSV
          </button>
          <span className="attendance-analytics-hero__icon"><BarChart3 size={26} /></span>
        </div>
      </header>

      {!canReadAttendance && (
        <div className="attendance-analytics-error" role="alert">
          <AlertCircle size={17} />
          Your account does not have ATTENDANCE_LESSON_READ permission.
        </div>
      )}

      <AttendanceAnalyticsFilters
        institutionId={institutionId}
        institutions={institutions}
        canReadInstitutions={canReadInstitutions}
        academicYearId={academicYearId}
        academicYears={academicYears}
        schoolClassId={schoolClassId}
        classes={classes}
        sectionId={sectionId}
        sections={sections}
        startDate={startDate}
        endDate={endDate}
        threshold={threshold}
        activeError={activeError}
        activeErrorRetrying={organizationSelection.clusterId ? institutionsQuery.isFetching : fallbackInstitutionQuery.isFetching}
        onRetryActiveError={() => void (organizationSelection.clusterId ? institutionsQuery.refetch() : fallbackInstitutionQuery.refetch())}
        academicYearsError={academicYearsQuery.isError ? academicYearsQuery.error : null}
        academicYearsRetrying={academicYearsQuery.isFetching}
        onRetryAcademicYears={() => void academicYearsQuery.refetch()}
        classesError={classesQuery.isError ? classesQuery.error : null}
        classesRetrying={classesQuery.isFetching}
        onRetryClasses={() => void classesQuery.refetch()}
        sectionsError={sectionsQuery.isError ? sectionsQuery.error : null}
        sectionsRetrying={sectionsQuery.isFetching}
        onRetrySections={() => void sectionsQuery.refetch()}
        validDateRange={validDateRange}
        onInstitutionChange={changeInstitution}
        onYearChange={changeYear}
        onClassChange={changeClass}
        onSectionChange={setSectionId}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onThresholdChange={setThreshold}
      />

      <AttendanceAnalyticsSummary
        eligible={summary.eligible}
        attended={summary.attended}
        missed={summary.missed}
        excused={summary.excused}
        weightedRate={summary.weightedRate}
        isLoading={sectionAnalyticsQuery.isLoading}
      />

      <div className="attendance-analytics-grid">
        <AttendanceAnalyticsBreakdownTable
          title="Section performance"
          description="Compare attendance across sections."
          rows={sectionRows}
          isLoading={sectionAnalyticsQuery.isLoading}
          error={sectionAnalyticsQuery.isError ? sectionAnalyticsQuery.error : null}
          onRetry={() => void sectionAnalyticsQuery.refetch()}
          isRetrying={sectionAnalyticsQuery.isFetching}
          emptyTitle="No section analytics available"
          emptyDescription="No attendance data was returned for this period."
        />
        <AttendanceAnalyticsBreakdownTable
          title="Subject performance"
          description="Compare attendance across subjects."
          rows={subjectRows}
          isLoading={subjectAnalyticsQuery.isLoading}
          error={subjectAnalyticsQuery.isError ? subjectAnalyticsQuery.error : null}
          onRetry={() => void subjectAnalyticsQuery.refetch()}
          isRetrying={subjectAnalyticsQuery.isFetching}
          emptyTitle="No subject analytics available"
          emptyDescription="No subject attendance data was returned for this period."
        />
      </div>

      <AttendanceAnalyticsStudentTable
        title="Student attendance"
        description="Attendance summary for the selected section."
        rows={studentRows}
        isLoading={studentAnalyticsQuery.isLoading}
        error={studentAnalyticsQuery.isError ? studentAnalyticsQuery.error : null}
          onRetry={() => void studentAnalyticsQuery.refetch()}
          isRetrying={studentAnalyticsQuery.isFetching}
        emptyDescription={sectionId ? "No attendance data was returned for this section and date range." : "Select an academic year, class, and section to see student summaries."}
      />

      <AttendanceAnalyticsStudentTable
        title={`Low attendance · below ${threshold}%`}
        description="Students who may need follow-up."
        rows={lowAttendanceRows}
        isLoading={lowAttendanceQuery.isLoading}
        error={lowAttendanceQuery.isError ? lowAttendanceQuery.error : null}
          onRetry={() => void lowAttendanceQuery.refetch()}
          isRetrying={lowAttendanceQuery.isFetching}
        emptyDescription={sectionId ? "No students below this threshold for the selected period." : "Select a section to check low attendance."}
      />
    </main>
  );
}
