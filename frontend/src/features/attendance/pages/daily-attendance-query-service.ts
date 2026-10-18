import { academicService } from "../../academics/api/academic-service";
import type { StudentEnrollment } from "../../academics/api/academic-types";
import { attendanceService } from "../api/attendance-service";
import type { DailyAttendanceRecord } from "../api/attendance-types";

const DAILY_ATTENDANCE_PAGE_SIZE = 100;

/** Fetch every page so the attendance roster includes the complete section. */
export async function fetchAllSectionEnrollments(
  sectionId: string,
): Promise<StudentEnrollment[]> {
  const firstPage = await academicService.getSectionEnrollments(
    sectionId,
    0,
    DAILY_ATTENDANCE_PAGE_SIZE,
  );
  const enrollments = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await academicService.getSectionEnrollments(
      sectionId,
      page,
      DAILY_ATTENDANCE_PAGE_SIZE,
    );
    enrollments.push(...result.content);
  }

  return enrollments;
}

/** Fetch every page of daily records for the selected institution and date. */
export async function fetchAllDailyAttendance(
  institutionId: string,
  attendanceDate: string,
): Promise<DailyAttendanceRecord[]> {
  const firstPage = await attendanceService.getDailyAttendance(
    institutionId,
    attendanceDate,
    0,
    DAILY_ATTENDANCE_PAGE_SIZE,
  );
  const records = [...firstPage.content];

  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const result = await attendanceService.getDailyAttendance(
      institutionId,
      attendanceDate,
      page,
      DAILY_ATTENDANCE_PAGE_SIZE,
    );
    records.push(...result.content);
  }

  return records;
}
