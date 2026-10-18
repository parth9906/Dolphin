import { apiClient } from "../../../lib/api/api-client";
import type {
  AcademicSubject,
  AcademicYear,
  AssignTeacherSubjectRequest,
  Campus,
  ClassSection,
  CreateLessonRequest,
  CreateRoomRequest,
  CreateSlotRequest,
  CreateSubjectRequest,
  UpdateSubjectRequest,
  GenerateOccurrencesRequest,
  LessonOccurrence,
  PageResponse,
  SchoolClass,
  SchoolRoom,
  ScheduledLesson,
  StaffAssignment,
  TeacherSubjectAssignment,
  TimetableSlot,
} from "./timetable-types";

export const timetableService = {
  getAcademicYears(institutionId: string): Promise<AcademicYear[]> {
    return apiClient.get(
      `academic/years?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  getClasses(yearId: string): Promise<SchoolClass[]> {
    return apiClient.get(
      `academic/years/${encodeURIComponent(yearId)}/classes`,
    );
  },

  getSections(classId: string): Promise<ClassSection[]> {
    return apiClient.get(
      `academic/classes/${encodeURIComponent(classId)}/sections`,
    );
  },

  getCampuses(institutionId: string): Promise<Campus[]> {
    return apiClient.get(
      `campuses/by-institution/${encodeURIComponent(institutionId)}`,
    );
  },

  getSubjects(institutionId: string): Promise<AcademicSubject[]> {
    return apiClient.get(
      `subjects?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  createSubject(request: CreateSubjectRequest): Promise<AcademicSubject> {
    return apiClient.post("subjects", request);
  },

  updateSubject(
    subjectId: string,
    request: UpdateSubjectRequest,
  ): Promise<AcademicSubject> {
    return apiClient.put(
      `subjects/${encodeURIComponent(subjectId)}`,
      request,
    );
  },

  getStaff(institutionId: string): Promise<PageResponse<StaffAssignment>> {
    const params = new URLSearchParams({
      institutionId,
      status: "ACTIVE",
      page: "0",
      size: "100",
      sort: "employeeNumber,asc",
    });
    return apiClient.get(`staff?${params.toString()}`);
  },

  getTeacherSubjectAssignments(
    institutionId: string,
  ): Promise<TeacherSubjectAssignment[]> {
    return apiClient.get(
      `teacher-subject-assignments?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  assignTeacherSubject(
    request: AssignTeacherSubjectRequest,
  ): Promise<TeacherSubjectAssignment> {
    return apiClient.post("teacher-subject-assignments", request);
  },

  getRooms(institutionId: string): Promise<SchoolRoom[]> {
    return apiClient.get(
      `timetable/rooms?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  createRoom(request: CreateRoomRequest): Promise<string> {
    return apiClient.post("timetable/rooms", request);
  },

  getSlots(yearId: string): Promise<TimetableSlot[]> {
    return apiClient.get(
      `timetable/slots?academicYearId=${encodeURIComponent(yearId)}`,
    );
  },

  createSlot(request: CreateSlotRequest): Promise<string> {
    return apiClient.post("timetable/slots", request);
  },

  getSectionTimetable(sectionId: string): Promise<ScheduledLesson[]> {
    return apiClient.get(
      `timetable/sections/${encodeURIComponent(sectionId)}`,
    );
  },

  createLesson(request: CreateLessonRequest): Promise<string> {
    return apiClient.post("timetable/lessons", request);
  },

  cancelLesson(lessonId: string): Promise<string> {
    return apiClient.patch(
      `timetable/lessons/${encodeURIComponent(lessonId)}/cancel`,
      undefined,
    );
  },

  generateOccurrences(
    request: GenerateOccurrencesRequest,
  ): Promise<number> {
    return apiClient.post("timetable/occurrences/generate", request);
  },

  getOccurrences(
    sectionId: string,
    startDate: string,
    endDate: string,
  ): Promise<LessonOccurrence[]> {
    const params = new URLSearchParams({ sectionId, startDate, endDate });
    return apiClient.get(`timetable/occurrences?${params.toString()}`);
  },
};
