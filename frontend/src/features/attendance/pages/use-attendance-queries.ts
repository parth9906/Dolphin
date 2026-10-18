import { useQuery } from "@tanstack/react-query";

import { organizationService } from "../../organization/api/organization-service";
import type { Institution } from "../../organization/api/organization-types";
import { attendanceService } from "../api/attendance-service";
import type {
  ClassSection,
  LessonOccurrence,
} from "../api/attendance-types";
import { displayTime, type SelectOption } from "./attendance-page-utils";
import { userAdministrationService } from "../../users/api/user-administration-service";
import type { UserAccount } from "../../users/api/user-administration-types";

type AttendanceMode = "daily" | "lesson";
type SelectedAuditRecord = { recordId: string; studentName: string } | null;

type UseAttendanceQueriesArgs = {
  clusterId: string;
  institutionId: string;
  academicYearId: string;
  schoolClassId: string;
  sectionId: string;
  lessonDate: string;
  attendanceMode: AttendanceMode;
  selectedOccurrenceId: string;
  hasUnsavedAttendanceChanges: boolean;
  selectedAuditRecord: SelectedAuditRecord;
  canReadInstitutions: boolean;
  canReadAttendance: boolean;
  canReadUsers: boolean;
};

export function useAttendanceQueries({
  clusterId,
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
}: UseAttendanceQueriesArgs) {
  const institutionsQuery = useQuery({
    queryKey: ["organization", "institutions", clusterId],
    queryFn: () =>
      organizationService.getInstitutions(clusterId),
    enabled: Boolean(
      clusterId && canReadInstitutions,
    ),
    staleTime: 60_000,
  });

  const fallbackInstitutionQuery = useQuery({
    queryKey: ["organization", "institution", institutionId],
    queryFn: () => organizationService.getInstitution(institutionId),
    enabled: Boolean(institutionId && !clusterId && canReadInstitutions),
    staleTime: 60_000,
  });

  const institutionOptions: Institution[] =
    institutionsQuery.data ??
    (fallbackInstitutionQuery.data ? [fallbackInstitutionQuery.data] : []);

  const selectedInstitution = institutionOptions.find(
    (item) => item.id === institutionId,
  );
  const institutionSelectOptions: SelectOption[] = [
    ...institutionOptions.map((item) => ({
      value: item.id,
      label: item.name,
    })),
    ...(institutionId && !institutionOptions.some((item) => item.id === institutionId)
      ? [{ value: institutionId, label: selectedInstitution?.name ?? "Current institution" }]
      : []),
  ];

  const academicYearsQuery = useQuery({
    queryKey: ["attendance", "academic-years", institutionId],
    queryFn: () => attendanceService.getAcademicYears(institutionId),
    enabled: Boolean(institutionId),
    staleTime: 60_000,
  });

  const academicYears = academicYearsQuery.data ?? [];
  const academicYearOptions: SelectOption[] = academicYears.map((item) => ({
    value: item.id,
    label: `${item.name}${item.status ? ` (${item.status})` : ""}`,
  }));

  const classesQuery = useQuery({
    queryKey: ["attendance", "classes", academicYearId],
    queryFn: () => attendanceService.getClasses(academicYearId),
    enabled: Boolean(academicYearId),
    staleTime: 60_000,
  });

  const classes = classesQuery.data ?? [];
  const classOptions: SelectOption[] = classes.map((item) => ({
    value: item.id,
    label: item.code ? `${item.name} · ${item.code}` : item.name,
  }));

  const sectionsQuery = useQuery({
    queryKey: ["attendance", "sections", schoolClassId],
    queryFn: () => attendanceService.getSections(schoolClassId),
    enabled: Boolean(schoolClassId),
    staleTime: 30_000,
  });

  const sections: ClassSection[] = sectionsQuery.data ?? [];
  const sectionOptions: SelectOption[] = sections.map((item) => ({
    value: item.id,
    label: `${item.name} · ${item.activeEnrollmentCount} students`,
  }));

  const scheduleQuery = useQuery({
    queryKey: ["attendance", "section-timetable", sectionId],
    queryFn: () => attendanceService.getSectionTimetable(sectionId),
    enabled: Boolean(
      sectionId && attendanceMode === "lesson" && canReadAttendance,
    ),
    staleTime: 30_000,
  });

  const occurrencesQuery = useQuery({
    queryKey: ["attendance", "occurrences", sectionId, lessonDate],
    queryFn: () =>
      attendanceService.getOccurrences(sectionId, lessonDate, lessonDate),
    enabled: Boolean(
      sectionId && lessonDate &&
      attendanceMode === "lesson" && canReadAttendance,
    ),
    staleTime: 15_000,
  });

  const occurrences: LessonOccurrence[] = occurrencesQuery.data ?? [];

  const activeOccurrenceId = occurrences.some(
    (item) => item.id === selectedOccurrenceId,
  )
    ? selectedOccurrenceId
    : hasUnsavedAttendanceChanges && selectedOccurrenceId
      ? selectedOccurrenceId
      : (occurrences[0]?.id ?? "");

  const rosterQuery = useQuery({
    queryKey: ["attendance", "roster", activeOccurrenceId],
    queryFn: () => attendanceService.getRoster(activeOccurrenceId),
    enabled: Boolean(
      activeOccurrenceId && attendanceMode === "lesson" && canReadAttendance,
    ),
    staleTime: 10_000,
  });

  const occurrence = occurrences.find(
    (item) => item.id === activeOccurrenceId,
  );

  const scheduledLessons = scheduleQuery.data ?? [];
  const occurrenceOptions: SelectOption[] = occurrences.map((item) => {
    const scheduledLesson = scheduledLessons.find(
      (entry) => entry.id === item.scheduledLessonId,
    );
    return {
      value: item.id,
      label: `${displayTime(item.startTime)}–${displayTime(item.endTime)} · ${scheduledLesson?.subjectName ?? "Scheduled lesson"}`,
    };
  });
  const lesson = scheduledLessons.find(
    (item) => item.id === occurrence?.scheduledLessonId,
  );

  const roster = rosterQuery.data ?? [];

  const auditQuery = useQuery({
    queryKey: [
      "attendance",
      "audit",
      selectedAuditRecord?.recordId ?? "",
    ],
    queryFn: () =>
      attendanceService.getAuditHistory(selectedAuditRecord!.recordId),
    enabled: Boolean(
      selectedAuditRecord?.recordId &&
      canReadAttendance &&
      attendanceMode === "lesson",
    ),
    staleTime: 0,
  });

  const auditActorsQuery = useQuery({
    queryKey: [
      "attendance",
      "audit-actors",
      selectedAuditRecord?.recordId ?? "",
      (auditQuery.data ?? []).map((entry) => entry.changedByUserId),
      canReadUsers,
    ],
    queryFn: async (): Promise<Record<string, UserAccount | null>> => {
      const actorIds = [
        ...new Set((auditQuery.data ?? []).map((entry) => entry.changedByUserId)),
      ];

      const actorResults = await Promise.all(
        actorIds.map(async (userId): Promise<[string, UserAccount | null]> => {
          try {
            return [
              userId,
              await userAdministrationService.getUserById(userId),
            ];
          } catch {
            // The user may not be visible under the current server-side scope.
            return [userId, null];
          }
        }),
      );

      return Object.fromEntries(actorResults);
    },
    enabled: Boolean(
      selectedAuditRecord?.recordId &&
      attendanceMode === "lesson" &&
      canReadUsers &&
      auditQuery.data &&
      auditQuery.data.length > 0,
    ),
    staleTime: 60_000,
  });


  return {
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
    scheduledLessons,
    occurrenceOptions,
    lesson,
    roster,
    auditQuery,
    auditActorsQuery,
  };
}
