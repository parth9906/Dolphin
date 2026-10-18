import { apiClient } from "../../../lib/api/api-client";
import type {
  ParentAttendanceAlert,
  ParentDailyAttendance,
  ParentLessonAttendanceItem,
  ParentLessonAttendanceSummary,
  ParentPortalStudent,
} from "./parent-portal-types";

const studentPath = (id: string) =>
  `parent-portal/students/${encodeURIComponent(id)}`;

export const parentPortalService = {
  getLinkedStudents(): Promise<ParentPortalStudent[]> {
    return apiClient.get("parent-portal/students");
  },

  getDailyAttendance(id: string, from: string, to: string) {
    const params = new URLSearchParams({ from, to });
    return apiClient.get<ParentDailyAttendance[]>(
      `${studentPath(id)}/attendance?${params.toString()}`,
    );
  },

  getLessonSummary(id: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiClient.get<ParentLessonAttendanceSummary>(
      `${studentPath(id)}/lesson-attendance/summary?${params.toString()}`,
    );
  },

  getLessonHistory(id: string, startDate: string, endDate: string) {
    const params = new URLSearchParams({ startDate, endDate });
    return apiClient.get<ParentLessonAttendanceItem[]>(
      `${studentPath(id)}/lesson-attendance?${params.toString()}`,
    );
  },

  getAttendanceAlerts(id: string) {
    return apiClient.get<ParentAttendanceAlert[]>(
      `${studentPath(id)}/attendance-alerts`,
    );
  },
};
