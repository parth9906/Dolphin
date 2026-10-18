export type StaffAssignmentStatus =
  | "ACTIVE"
  | "ON_LEAVE"
  | "INACTIVE"
  | "TERMINATED";

export interface CampusOption {
  id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface TeacherAssignment {
  staffMemberId: string;
  assignmentId: string;
  institutionId: string;
  campusId: string | null;
  userAccountId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  employeeNumber: string;
  staffType: string;
  jobTitle: string;
  startDate: string;
  endDate: string | null;
  status: StaffAssignmentStatus;
}

export interface TeacherOnboardingRequest {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  institutionId: string;
  campusId?: string;
  employeeNumber: string;
  jobTitle: string;
  startDate: string;
  phone?: string;
}

export interface TeacherOnboardingResponse {
  userAccountId: string | null;
  staffMemberId: string;
  staffAssignmentId: string;
  institutionId: string;
  campusId: string | null;
  username: string;
  email: string;
  roleCode: string;
  staffStatus: string;
  invitationStatus: string;
  invitationExpiresAt: string | null;
  message: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
