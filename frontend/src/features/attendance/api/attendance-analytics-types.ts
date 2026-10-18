export interface AttendanceGroupAnalytics {
  groupId: string;
  groupName: string;
  attendedLessons: number;
  missedLessons: number;
  excusedLessons: number;
  eligibleLessons: number;
  attendancePercentage: number;
}

export interface StudentAttendanceAnalytics {
  studentId: string;
  studentName: string;
  attendedLessons: number;
  missedLessons: number;
  excusedLessons: number;
  eligibleLessons: number;
  attendancePercentage: number;
}
