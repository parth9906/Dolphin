export type LessonAttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

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
  campusId: string;
  name: string;
  capacity: number | null;
  activeEnrollmentCount: number;
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

export interface LessonAttendanceRosterItem {
  studentId: string;
  studentName: string;
  attendanceRecordId: string | null;
  status: LessonAttendanceStatus | null;
  remarks: string | null;
}

export interface LessonAttendanceRecord {
  id: string;
  occurrenceId: string;
  studentId: string;
  studentName: string;
  lessonDate: string;
  status: LessonAttendanceStatus;
  markedByUserId: string;
  markedAt: string;
  remarks: string | null;
  version: number;
}

export interface LessonAttendanceAuditEntry {
  id: string;
  attendanceRecordId: string;
  previousStatus: LessonAttendanceStatus | null;
  newStatus: LessonAttendanceStatus;
  previousRemarks: string | null;
  newRemarks: string | null;
  changedByUserId: string;
  changedAt: string;
}

export interface MarkLessonAttendanceRequest {
  records: {
    studentId: string;
    status: LessonAttendanceStatus;
    remarks: string | null;
  }[];
}

export interface CorrectLessonAttendanceRequest {
  status: LessonAttendanceStatus;
  remarks: string | null;
}
/**
 * Status values supported by the daily attendance API.
 * Kept separate from the lesson-wise attendance contract.
 */
export type DailyAttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "EXCUSED";

export interface DailyAttendanceRecord {
  id: string;
  studentId: string;
  institutionId: string;
  attendanceDate: string;
  status: DailyAttendanceStatus;
  remarks: string | null;
}

export interface DailyAttendancePage {
  content: DailyAttendanceRecord[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface MarkDailyAttendanceRequest {
  institutionId: string;
  attendanceDate: string;
  records: Array<{
    studentId: string;
    status: DailyAttendanceStatus;
    remarks: string | null;
  }>;
}

export interface UpdateDailyAttendanceRequest {
  status: DailyAttendanceStatus;
  remarks: string | null;
}
