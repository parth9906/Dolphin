import { apiClient } from "../../../lib/api/api-client";
import type {
  AcademicYear,
  ClassSection,
  CreateAcademicYearRequest,
  CreateClassSectionRequest,
  CreateSchoolClassRequest,
  UpdateSchoolClassRequest,
  EnrollStudentRequest,
  PageResponse,
  SchoolClass,
  StudentEnrollment,
  StudentSearchPage,
} from "./academic-types";

export const academicService = {
  getAcademicYears(institutionId: string): Promise<AcademicYear[]> {
    return apiClient.get(
      `academic/years?institutionId=${encodeURIComponent(institutionId)}`,
    );
  },

  createAcademicYear(request: CreateAcademicYearRequest): Promise<string> {
    return apiClient.post("academic/years", request);
  },

  activateAcademicYear(id: string): Promise<string> {
    return apiClient.patch(
      `academic/years/${encodeURIComponent(id)}/activate`,
      undefined,
    );
  },

  closeAcademicYear(id: string): Promise<string> {
    return apiClient.patch(
      `academic/years/${encodeURIComponent(id)}/close`,
      undefined,
    );
  },

  getClasses(academicYearId: string): Promise<SchoolClass[]> {
    return apiClient.get(
      `academic/years/${encodeURIComponent(academicYearId)}/classes`,
    );
  },

  createClass(request: CreateSchoolClassRequest): Promise<string> {
    return apiClient.post("academic/classes", request);
  },

  updateClass(
    classId: string,
    request: UpdateSchoolClassRequest,
  ): Promise<string> {
    return apiClient.put(
      `academic/classes/${encodeURIComponent(classId)}`,
      request,
    );
  },

  getSections(classId: string): Promise<ClassSection[]> {
    return apiClient.get(
      `academic/classes/${encodeURIComponent(classId)}/sections`,
    );
  },

  createSection(request: CreateClassSectionRequest): Promise<string> {
    return apiClient.post("academic/sections", request);
  },

  getSectionEnrollments(
    sectionId: string,
    page = 0,
    size = 100,
  ): Promise<PageResponse<StudentEnrollment>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
      sort: "startDate,asc",
    });

    return apiClient.get(
      `academic/sections/${encodeURIComponent(sectionId)}/students?${params.toString()}`,
    );
  },

  enrollStudent(request: EnrollStudentRequest): Promise<string> {
    return apiClient.post("academic/enrollments", request);
  },

  searchStudents(
    institutionId: string,
    search: string,
  ): Promise<StudentSearchPage> {
    const params = new URLSearchParams({
      institutionId,
      page: "0",
      size: "50",
      sort: "firstName,asc",
    });

    if (search.trim()) params.set("search", search.trim());

    return apiClient.get(`students?${params.toString()}`);
  },
};
