export interface ParentPortalStudent {
  studentId: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | null;
}

export interface ParentDailyAttendance {
  studentId: string;
  attendanceDate: string;
  status: string;
  remarks: string | null;
}

export interface ParentLessonAttendanceSummary {
  studentId: string;
  startDate: string;
  endDate: string;
  attendedLessons: number;
  missedLessons: number;
  excusedLessons: number;
  eligibleLessons: number;
  attendancePercentage: number;
}

export interface ParentLessonAttendanceItem {
  attendanceRecordId: string;
  occurrenceId: string;
  lessonDate: string;
  startTime: string;
  endTime: string;
  subjectName: string;
  status: string;
  remarks: string | null;
}

export interface ParentAttendanceAlert {
  id: string;
  studentId: string;
  periodStart: string;
  periodEnd: string;
  thresholdPercent: number;
  attendancePercent: number;
  status: string;
  generatedAt: string;
  acknowledgedAt: string | null;
}
