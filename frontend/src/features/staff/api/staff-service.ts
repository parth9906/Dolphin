import { apiClient } from "../../../lib/api/api-client";

import type {
  CampusOption,
  PageResponse,
  StaffAssignmentStatus,
  TeacherAssignment,
  TeacherOnboardingRequest,
  TeacherOnboardingResponse,
} from "./staff-types";

export const staffService = {
  getAssignments(
    institutionId: string,
    status: StaffAssignmentStatus,
    page: number,
    size: number,
  ) {
    const params = new URLSearchParams({
      institutionId,
      status,
      page: String(page),
      size: String(size),
    });

    return apiClient.get<PageResponse<TeacherAssignment>>(
      `staff?${params.toString()}`,
    );
  },

  getCampuses(institutionId: string) {
    return apiClient.get<CampusOption[]>(
      `campuses/by-institution/${encodeURIComponent(institutionId)}`,
    );
  },

  onboardTeacher(request: TeacherOnboardingRequest) {
    return apiClient.post<TeacherOnboardingResponse>(
      "staff/onboard-teacher",
      request,
    );
  },

  updateAssignmentStatus(
    assignmentId: string,
    status: StaffAssignmentStatus,
  ) {
    return apiClient.patch<TeacherAssignment>(
      `staff/assignments/${encodeURIComponent(assignmentId)}/status`,
      { status },
    );
  },
};
