import { apiClient } from "../../../lib/api/api-client";
import type {
  AcademicYear,
  ClassSection,
  CorrectLessonAttendanceRequest,
  DailyAttendancePage,
  DailyAttendanceRecord,
  LessonAttendanceAuditEntry,
  LessonAttendanceRecord,
  LessonAttendanceRosterItem,
  LessonOccurrence,
  MarkDailyAttendanceRequest,
  MarkLessonAttendanceRequest,
  ScheduledLesson,
  SchoolClass,
  UpdateDailyAttendanceRequest,
} from "./attendance-types";

export const attendanceService = {
  getDailyAttendance(
    institutionId: string,
    attendanceDate: string,
    page = 0,
    size = 100,
  ): Promise<DailyAttendancePage> {
    const params = new URLSearchParams({
      institutionId,
      attendanceDate,
      page: String(page),
      size: String(size),
    });

    return apiClient.get(`attendance?${params.toString()}`);
  },

  markDailyAttendance(
    request: MarkDailyAttendanceRequest,
  ): Promise<DailyAttendanceRecord[]> {
    return apiClient.post("attendance", request);
  },

  updateDailyAttendance(
    recordId: string,
    request: UpdateDailyAttendanceRequest,
  ): Promise<DailyAttendanceRecord> {
    return apiClient.put(
      `attendance/${encodeURIComponent(recordId)}`,
      request,
    );
  },
  getAcademicYears(institutionId: string): Promise<AcademicYear[]> {
    return apiClient.get(
      `academic/years?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  getClasses(academicYearId: string): Promise<SchoolClass[]> {
    return apiClient.get(
      `academic/years/${encodeURIComponent(academicYearId)}/classes`,
    );
  },

  getSections(schoolClassId: string): Promise<ClassSection[]> {
    return apiClient.get(
      `academic/classes/${encodeURIComponent(schoolClassId)}/sections`,
    );
  },

  getSectionTimetable(sectionId: string): Promise<ScheduledLesson[]> {
    return apiClient.get(
      `timetable/sections/${encodeURIComponent(sectionId)}`,
    );
  },

  getOccurrences(
    sectionId: string,
    startDate: string,
    endDate: string,
  ): Promise<LessonOccurrence[]> {
    const params = new URLSearchParams({
      sectionId,
      startDate,
      endDate,
    });

    return apiClient.get(`timetable/occurrences?${params.toString()}`);
  },

  getRoster(occurrenceId: string): Promise<LessonAttendanceRosterItem[]> {
    return apiClient.get(
      `lesson-attendance/occurrences/${encodeURIComponent(occurrenceId)}/roster`,
    );
  },

  getAttendance(
    occurrenceId: string,
  ): Promise<LessonAttendanceRecord[]> {
    return apiClient.get(
      `lesson-attendance/occurrences/${encodeURIComponent(occurrenceId)}`,
    );
  },

  getAuditHistory(
    recordId: string,
  ): Promise<LessonAttendanceAuditEntry[]> {
    return apiClient.get(
      `lesson-attendance/records/${encodeURIComponent(recordId)}/audit`,
    );
  },

  markAttendance(
    occurrenceId: string,
    request: MarkLessonAttendanceRequest,
  ): Promise<LessonAttendanceRecord[]> {
    return apiClient.post(
      `lesson-attendance/occurrences/${encodeURIComponent(occurrenceId)}`,
      request,
    );
  },

  correctAttendance(
    recordId: string,
    request: CorrectLessonAttendanceRequest,
  ): Promise<LessonAttendanceRecord> {
    return apiClient.put(
      `lesson-attendance/records/${encodeURIComponent(recordId)}`,
      request,
    );
  },
};
