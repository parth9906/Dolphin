import { apiClient } from "../../../lib/api/api-client";
import type {
  DocumentTemplate,
  IssuedDocument,
} from "./certificate-types";

export interface CreateDocumentTemplateRequest {
  institutionId: string;
  code: string;
  name: string;
  body: string;
}

export interface IssueDocumentRequest {
  studentId: string;
  institutionId: string;
  templateId: string;
  title: string;
}

export const certificateService = {
  listTemplates(institutionId: string): Promise<DocumentTemplate[]> {
    const params = new URLSearchParams({ institutionId });
    return apiClient.get(`documents/templates?${params.toString()}`);
  },

  createTemplate(
    request: CreateDocumentTemplateRequest,
  ): Promise<DocumentTemplate> {
    return apiClient.post("documents/templates", request);
  },

  issueDocument(request: IssueDocumentRequest): Promise<IssuedDocument> {
    return apiClient.post("documents/issue", request);
  },

  getDocument(documentId: string): Promise<IssuedDocument> {
    return apiClient.get(`documents/${encodeURIComponent(documentId)}`);
  },

  listStudentDocuments(studentId: string): Promise<IssuedDocument[]> {
    return apiClient.get(
      `students/${encodeURIComponent(studentId)}/documents`,
    );
  },

  listMyDocuments(): Promise<IssuedDocument[]> {
    return apiClient.get("student-portal/documents");
  },
};
