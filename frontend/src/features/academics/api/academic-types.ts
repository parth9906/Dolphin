export interface AcademicYear {
  id: string;
  institutionId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface SchoolClass {
  id: string;
  academicYearId: string;
  name: string;
  code: string;
  sortOrder: number;
  active: boolean;
}

export interface ClassSection {
  id: string;
  schoolClassId: string;
  campusId: string | null;
  name: string;
  capacity: number | null;
  activeEnrollmentCount: number;
  active: boolean;
}

export interface StudentEnrollment {
  id: string;
  studentId: string;
  admissionNumber: string;
  studentName: string;
  sectionId: string;
  sectionName: string;
  classId: string;
  className: string;
  academicYearId: string;
  academicYearName: string;
  startDate: string;
  endDate: string | null;
  status: string;
}

export interface StudentForEnrollment {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string | null;
  active: boolean;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface StudentSearchPage {
  content: StudentForEnrollment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateAcademicYearRequest {
  institutionId: string;
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreateSchoolClassRequest {
  academicYearId: string;
  name: string;
  code: string;
  sortOrder: number;
}

export interface UpdateSchoolClassRequest {
  name: string;
  code: string;
  sortOrder: number;
}

export interface CreateClassSectionRequest {
  schoolClassId: string;
  campusId: string | null;
  name: string;
  capacity: number | null;
}

export interface EnrollStudentRequest {
  studentId: string;
  sectionId: string;
  startDate: string;
}
