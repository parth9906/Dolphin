export type LeaveKind = "staff" | "student";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeaveAction = "approve" | "reject";

export interface LeaveTypeOption {
  id: string;
  code: string;
  name: string;
}


export interface LeaveRequest {
  id: string;
  staffMemberId?: string;
  studentId?: string;
  institutionId: string;
  leaveTypeId: string;
  leaveTypeCode?: string | null;
  leaveTypeName?: string | null;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  decisionComment: string | null;
  createdAt: string;
}

export interface LeaveAuditEntry {
  id: string;
  previousStatus: LeaveStatus | null;
  newStatus: LeaveStatus;
  changedByUserId: string;
  comment: string | null;
  changedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface StaffLookup {
  staffMemberId: string;
  assignmentId: string;
  institutionId: string;
  firstName: string;
  lastName: string | null;
  employeeNumber: string;
  staffType: string;
  jobTitle: string | null;
  status: string;
}

export interface StudentLookup {
  id: string;
  institutionId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
}

export interface CreateLeaveRequest {
  institutionId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
  staffMemberId?: string;
  studentId?: string;
}
