import { apiClient } from "../../../lib/api/api-client";
import type {
  Assignment,
  AssignmentSubmission,
  PageResponse,
} from "./homework-types";

export interface CreateAssignmentRequest {
  institutionId: string;
  sectionId: string;
  title: string;
  instructions: string;
  dueAt: string;
  maxMarks: number;
}

export interface UpdateAssignmentRequest {
  version: number;
  title: string;
  instructions: string;
  dueAt: string;
  maxMarks: number;
}

export interface GradeSubmissionRequest {
  marksObtained: number;
  feedback: string | null;
  version: number;
}

export const homeworkService = {
  listAssignments(
    institutionId: string,
    status: string,
    page = 0,
  ): Promise<PageResponse<Assignment>> {
    const params = new URLSearchParams({
      institutionId,
      page: String(page),
      size: "50",
      sort: "createdAt,desc",
    });
    if (status !== "ALL") params.set("status", status);
    return apiClient.get(`assignments?${params.toString()}`);
  },

  createAssignment(request: CreateAssignmentRequest): Promise<Assignment> {
    return apiClient.post("assignments", request);
  },

  updateDraft(id: string, request: UpdateAssignmentRequest): Promise<Assignment> {
    return apiClient.patch(`assignments/${encodeURIComponent(id)}`, request);
  },

  publish(id: string, version: number): Promise<Assignment> {
    return apiClient.post(
      `assignments/${encodeURIComponent(id)}/publish`,
      { version },
    );
  },

  listSubmissions(id: string, page = 0): Promise<PageResponse<AssignmentSubmission>> {
    return apiClient.get(
      `assignments/${encodeURIComponent(id)}/submissions?page=${page}&size=50&sort=submittedAt,asc`,
    );
  },

  gradeSubmission(
    assignmentId: string,
    submissionId: string,
    request: GradeSubmissionRequest,
  ): Promise<AssignmentSubmission> {
    return apiClient.put(
      `assignments/${encodeURIComponent(assignmentId)}/submissions/${encodeURIComponent(submissionId)}/grade`,
      request,
    );
  },

  listMyAssignments(page = 0): Promise<PageResponse<Assignment>> {
    return apiClient.get(
      `student-portal/assignments?page=${page}&size=50&sort=createdAt,desc`,
    );
  },

  getMySubmission(assignmentId: string): Promise<AssignmentSubmission> {
    return apiClient.get(
      `student-portal/assignments/${encodeURIComponent(assignmentId)}/submissions/me`,
    );
  },

  submitMyAssignment(
    assignmentId: string,
    submissionText: string,
    version?: number,
  ): Promise<AssignmentSubmission> {
    const body: { submissionText: string; version?: number } = { submissionText };
    if (version !== undefined) body.version = version;
    return apiClient.post(
      `student-portal/assignments/${encodeURIComponent(assignmentId)}/submissions`,
      body,
    );
  },
};
