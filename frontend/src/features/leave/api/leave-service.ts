import { apiClient } from "../../../lib/api/api-client";
import type {
  CreateLeaveRequest,
  LeaveAuditEntry,
  LeaveKind,
  LeaveRequest,
  LeaveStatus,
  LeaveTypeOption,
  PageResponse,
  StaffLookup,
  StudentLookup,
} from "./leave-types";

function query(values: Record<string, string | number>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    params.set(key, String(value));
  }
  return params.toString();
}

export const leaveService = {
  list(
    kind: LeaveKind,
    institutionId: string,
    status: LeaveStatus,
    page = 0,
  ): Promise<PageResponse<LeaveRequest>> {
    return apiClient.get<PageResponse<LeaveRequest>>(
      `${kind}-leave?${query({
        institutionId,
        status,
        page,
        size: 50,
        sort: "startDate,desc",
      })}`,
    );
  },

  create(kind: LeaveKind, request: CreateLeaveRequest): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>(`${kind}-leave`, request);
  },

  review(
    kind: LeaveKind,
    id: string,
    action: "approve" | "reject",
    comment: string,
  ): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>(
      `${kind}-leave/${encodeURIComponent(id)}/${action}`,
      { comment },
    );
  },

  cancel(kind: LeaveKind, id: string): Promise<LeaveRequest> {
    return apiClient.post<LeaveRequest>(
      `${kind}-leave/${encodeURIComponent(id)}/cancel`,
      undefined,
    );
  },

  audit(kind: LeaveKind, id: string): Promise<LeaveAuditEntry[]> {
    return apiClient.get<LeaveAuditEntry[]>(
      `${kind}-leave/${encodeURIComponent(id)}/audit`,
    );
  },

  getLeaveTypes(
    kind: LeaveKind,
    institutionId: string,
  ): Promise<LeaveTypeOption[]> {
    return apiClient.get<LeaveTypeOption[]>(
      `${kind}-leave/types?${query({ institutionId })}`,
    );
  },

  staff(institutionId: string): Promise<{ content: StaffLookup[] }> {
    return apiClient.get<{ content: StaffLookup[] }>(
      `staff?${query({
        institutionId,
        status: "ACTIVE",
        page: 0,
        size: 100,
        sort: "employeeNumber,asc",
      })}`,
    );
  },

  students(institutionId: string): Promise<{ content: StudentLookup[] }> {
    return apiClient.get<{ content: StudentLookup[] }>(
      `students?${query({
        institutionId,
        page: 0,
        size: 100,
        sort: "firstName,asc",
      })}`,
    );
  },
};
