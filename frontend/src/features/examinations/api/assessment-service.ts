import { apiClient } from "../../../lib/api/api-client";
import type {
  Assessment,
  AssessmentPage,
  AssessmentRosterItem,
  CreateAssessmentRequest,
  RecordMarksRequest,
  StudentMark,
  StudentMarkAudit,
  UpdateAssessmentRequest,
  UpdateStudentMarkRequest,
} from "./assessment-types";

export interface AssessmentSearch {
  page: number;
  size: number;
  fromDate?: string;
  toDate?: string;
}

export const assessmentService = {
  list(
    institutionId: string,
    search: AssessmentSearch,
  ): Promise<AssessmentPage<Assessment>> {
    const params = new URLSearchParams({
      institutionId,
      page: String(search.page),
      size: String(search.size),
    });

    if (search.fromDate) params.set("fromDate", search.fromDate);
    if (search.toDate) params.set("toDate", search.toDate);

    return apiClient.get(`assessments?${params.toString()}`);
  },

  create(request: CreateAssessmentRequest): Promise<Assessment> {
    return apiClient.post("assessments", request);
  },

  update(
    assessmentId: string,
    request: UpdateAssessmentRequest,
  ): Promise<Assessment> {
    return apiClient.put(
      `assessments/${encodeURIComponent(assessmentId)}`,
      request,
    );
  },

  getResults(assessmentId: string): Promise<StudentMark[]> {
    return apiClient.get(
      `assessments/${encodeURIComponent(assessmentId)}/results`,
    );
  },

  recordMarks(
    assessmentId: string,
    request: RecordMarksRequest,
  ): Promise<StudentMark[]> {
    return apiClient.post(
      `assessments/${encodeURIComponent(assessmentId)}/marks`,
      request,
    );
  },

  getRoster(
    assessmentId: string,
    page = 0,
    size = 100,
  ): Promise<AssessmentPage<AssessmentRosterItem>> {
    const params = new URLSearchParams({
      page: String(page),
      size: String(size),
    });

    return apiClient.get(
      `assessments/${encodeURIComponent(assessmentId)}/roster?${params.toString()}`,
    );
  },

  updateMark(
    markId: string,
    request: UpdateStudentMarkRequest,
  ): Promise<StudentMark> {
    return apiClient.put(
      `assessments/marks/${encodeURIComponent(markId)}`,
      request,
    );
  },

  getMarkAudit(markId: string): Promise<StudentMarkAudit[]> {
    return apiClient.get(
      `assessments/marks/${encodeURIComponent(markId)}/audit`,
    );
  },
};
