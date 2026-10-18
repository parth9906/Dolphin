export interface Assignment {
  id: string;
  institutionId: string;
  sectionId: string;
  createdByStaffId: string;
  title: string;
  instructions: string;
  dueAt: string;
  maxMarks: number;
  status: "DRAFT" | "PUBLISHED" | string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentAdmissionNumber: string;
  studentFirstName: string;
  studentLastName: string;
  submissionText: string;
  status: "SUBMITTED" | "LATE" | "GRADED" | string;
  submittedAt: string;
  updatedAt: string;
  marksObtained: number | null;
  maxMarks: number;
  feedback: string | null;
  gradedByStaffId: string | null;
  gradedAt: string | null;
  version: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}
