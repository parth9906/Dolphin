export type AdmissionApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WAITLISTED"
  | "ENROLLED";

export interface AdmissionApplication {
  id: string;
  institutionId: string;
  campusId: string | null;
  applyingClassId: string;
  className: string;
  classCode: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantDateOfBirth: string;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  notes: string | null;
  applicationDate: string;
  status: AdmissionApplicationStatus;
  enrolledStudentId: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdmissionApplicationSummary {
  appliedCount: number;
  underReviewCount: number;
  acceptedCount: number;
  rejectedCount: number;
  waitlistedCount: number;
  enrolledCount: number;
}

export interface AdmissionApplicationsPage {
  content: AdmissionApplication[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface CreateAdmissionApplicationRequest {
  institutionId: string;
  campusId: string | null;
  applyingClassId: string;
  applicantFirstName: string;
  applicantLastName: string;
  applicantDateOfBirth: string;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  notes: string | null;
  applicationDate: string;
}

export interface UpdateAdmissionApplicationRequest {
  campusId: string | null;
  applyingClassId: string;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  notes: string | null;
}

export interface EnrollAdmissionApplicationRequest {
  sectionId: string;
  admissionNumber: string;
  startDate: string;
}

export interface AdmissionCampus {
  id: string;
  institutionId?: string;
  code?: string;
  name: string;
  active?: boolean;
}

export interface AdmissionAcademicYear {
  id: string;
  institutionId: string;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface AdmissionSchoolClass {
  id: string;
  academicYearId: string;
  name: string;
  code: string;
  sortOrder: number;
  active: boolean;
}

export interface AdmissionSection {
  id: string;
  schoolClassId: string;
  campusId: string | null;
  name: string;
  activeEnrollmentCount: number;
  active: boolean;
}
