export type AssessmentScope = "INSTITUTION" | "CLASS" | "SECTION";

export interface Assessment {
  id: string;
  institutionId: string;
  scopeType: AssessmentScope;
  schoolClassId: string | null;
  sectionId: string | null;
  name: string;
  subjectName: string;
  assessmentDate: string;
  maxMarks: number | string;
  active: boolean;
}

export interface AssessmentPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface StudentMark {
  markId: string;
  assessmentId: string;
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  marksObtained: number | string;
  maxMarks: number | string;
  remarks: string | null;
  version: number;
}

export interface AssessmentRosterItem {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  markId: string | null;
  marksObtained: number | string | null;
  maxMarks: number | string | null;
  remarks: string | null;
  version: number | null;
}

export interface UpdateStudentMarkRequest {
  version: number;
  marksObtained: number;
  remarks: string | null;
}

export interface StudentMarkAudit {
  id: string;
  studentMarkId: string;
  previousMarks: number | string | null;
  newMarks: number | string | null;
  previousRemarks: string | null;
  newRemarks: string | null;
  changedByUserId: string;
  changedAt: string;
}

export interface CreateAssessmentRequest {
  institutionId: string;
  scopeType: AssessmentScope;
  schoolClassId: string | null;
  sectionId: string | null;
  name: string;
  subjectName: string;
  assessmentDate: string;
  maxMarks: number;
}

export interface UpdateAssessmentRequest {
  scopeType: AssessmentScope;
  schoolClassId: string | null;
  sectionId: string | null;
  name: string;
  subjectName: string;
  assessmentDate: string;
  maxMarks: number;
}

export interface RecordMarksRequest {
  records: Array<{
    studentId: string;
    marksObtained: number;
    remarks: string;
  }>;
}
