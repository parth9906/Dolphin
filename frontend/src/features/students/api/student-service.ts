import { apiClient } from "../../../lib/api/api-client";
import type {
  CreateStudentRequest,
  CreateUserAccountRequest,
  UserAccountSummary,
  UserAccountSearchPage,
  Student,
  StudentPage,
  StudentSearchParams,
  StudentAccountLinkResponse,
  StudentAccountLinkDetails,
  UpdateStudentRequest,
} from "./student-types";

export const studentService = {
  getAccountLink(studentId: string): Promise<StudentAccountLinkDetails> {
    return apiClient.get<StudentAccountLinkDetails>(
      `students/${encodeURIComponent(studentId)}/account-link`,
    );
  },

  getStudent(id: string): Promise<Student> {
    return apiClient.get<Student>(`students/${encodeURIComponent(id)}`);
  },

  createStudent(request: CreateStudentRequest): Promise<Student> {
    return apiClient.post<Student>("students", request);
  },

  updateStudent(
    id: string,
    request: UpdateStudentRequest,
  ): Promise<Student> {
    return apiClient.put<Student>(
      `students/${encodeURIComponent(id)}`,
      request,
    );
  },

  deactivateStudent(id: string): Promise<Student> {
    return apiClient.patch<Student>(
      `students/${encodeURIComponent(id)}/deactivate`,
      undefined,
    );
  },

  createUserAccount(
    request: CreateUserAccountRequest,
  ): Promise<UserAccountSummary> {
    return apiClient.post<UserAccountSummary>("users", request);
  },

  searchEligibleAccounts(
    studentId: string,
    search: string,
    page = 0,
    size = 20,
  ): Promise<UserAccountSearchPage> {
    const params = new URLSearchParams();
    params.set("studentId", studentId);
    params.set("page", String(page));
    params.set("size", String(size));
    params.set("sort", "username,asc");

    if (search.trim()) {
      params.set("search", search.trim());
    }

    return apiClient.get<UserAccountSearchPage>(
      `users?${params.toString()}`,
    );
  },

  linkUserAccount(
    studentId: string,
    userAccountId: string,
  ): Promise<StudentAccountLinkResponse> {
    return apiClient.post<StudentAccountLinkResponse>(
      `students/${encodeURIComponent(studentId)}/account-link`,
      { userAccountId },
    );
  },

  activateStudent(id: string): Promise<Student> {
    return apiClient.patch<Student>(
      `students/${encodeURIComponent(id)}/activate`,
      undefined,
    );
  },

  searchInactiveStudents(filters: StudentSearchParams): Promise<StudentPage> {
    const params = new URLSearchParams();

    params.set("institutionId", filters.institutionId);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    params.set("sort", "firstName,asc");

    if (filters.campusId) {
      params.set("campusId", filters.campusId);
    }

    if (filters.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    return apiClient.get<StudentPage>(
      `students/inactive?${params.toString()}`,
    );
  },

  searchStudents(filters: StudentSearchParams): Promise<StudentPage> {
    const params = new URLSearchParams();

    params.set("institutionId", filters.institutionId);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    params.set("sort", "firstName,asc");

    if (filters.campusId) {
      params.set("campusId", filters.campusId);
    }

    if (filters.search?.trim()) {
      params.set("search", filters.search.trim());
    }

    return apiClient.get<StudentPage>(`students?${params.toString()}`);
  },
};
