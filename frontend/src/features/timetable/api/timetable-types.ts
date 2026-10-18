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

export interface Campus {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  active: boolean;
}

export interface AcademicSubject {
  id: string;
  institutionId: string;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export interface TeacherSubjectAssignment {
  id: string;
  staffAssignmentId: string;
  staffMemberId: string;
  teacherName: string;
  employeeNumber: string;
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  startDate: string;
  endDate: string | null;
  active: boolean;
}

export interface StaffAssignment {
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
  status: string;
}

export interface SchoolRoom {
  id: string;
  institutionId: string;
  campusId: string | null;
  code: string;
  name: string;
  capacity: number | null;
  active: boolean;
}

export interface TimetableSlot {
  id: string;
  academicYearId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
  active: boolean;
}

export interface ScheduledLesson {
  id: string;
  sectionId: string;
  sectionName: string;
  slotId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  teacherAssignmentId: string;
  teacherName: string;
  subjectId: string;
  subjectName: string;
  roomId: string | null;
  roomName: string | null;
}

export interface LessonOccurrence {
  id: string;
  scheduledLessonId: string;
  sectionId: string;
  teacherAssignmentId: string;
  subjectId: string;
  roomId: string | null;
  lessonDate: string;
  startTime: string;
  endTime: string;
  status: string;
  substituteStaffAssignmentId: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateSubjectRequest {
  institutionId: string;
  code: string;
  name: string;
  description: string | null;
}

export interface UpdateSubjectRequest {
  code: string;
  name: string;
  description: string | null;
}

export interface AssignTeacherSubjectRequest {
  staffAssignmentId: string;
  subjectId: string;
  startDate: string;
  endDate: string | null;
}

export interface CreateRoomRequest {
  institutionId: string;
  campusId: string | null;
  code: string;
  name: string;
  capacity: number | null;
}

export interface CreateSlotRequest {
  academicYearId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  label: string | null;
}

export interface CreateLessonRequest {
  sectionId: string;
  slotId: string;
  teacherAssignmentId: string;
  subjectId: string;
  roomId: string | null;
}

export interface GenerateOccurrencesRequest {
  sectionId: string;
  startDate: string;
  endDate: string;
}
