import { apiClient } from "../../../lib/api/api-client";
import type {
  AttendanceGroupAnalytics,
  StudentAttendanceAnalytics,
} from "./attendance-analytics-types";

function dateRangeParams(
  institutionId: string,
  startDate: string,
  endDate: string,
): URLSearchParams {
  return new URLSearchParams({ institutionId, startDate, endDate });
}

export const attendanceAnalyticsService = {
  getSectionAnalytics(
    institutionId: string,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceGroupAnalytics[]> {
    const params = dateRangeParams(institutionId, startDate, endDate);
    return apiClient.get(`lesson-attendance/analytics/sections?${params.toString()}`);
  },

  getSubjectAnalytics(
    institutionId: string,
    startDate: string,
    endDate: string,
  ): Promise<AttendanceGroupAnalytics[]> {
    const params = dateRangeParams(institutionId, startDate, endDate);
    return apiClient.get(`lesson-attendance/analytics/subjects?${params.toString()}`);
  },

  getStudentAnalytics(
    institutionId: string,
    sectionId: string,
    startDate: string,
    endDate: string,
  ): Promise<StudentAttendanceAnalytics[]> {
    const params = dateRangeParams(institutionId, startDate, endDate);
    params.set("sectionId", sectionId);
    return apiClient.get(`lesson-attendance/analytics/students?${params.toString()}`);
  },

  getLowAttendanceStudents(
    institutionId: string,
    sectionId: string,
    startDate: string,
    endDate: string,
    threshold: number,
  ): Promise<StudentAttendanceAnalytics[]> {
    const params = dateRangeParams(institutionId, startDate, endDate);
    params.set("sectionId", sectionId);
    params.set("threshold", String(threshold));
    return apiClient.get(`lesson-attendance/analytics/low-attendance?${params.toString()}`);
  },
};
