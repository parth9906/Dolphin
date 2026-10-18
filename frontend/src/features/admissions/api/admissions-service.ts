import { apiClient } from "../../../lib/api/api-client";
import type {
  AdmissionApplication,
  AdmissionApplicationSummary,
  AdmissionApplicationsPage,
  AdmissionApplicationStatus,
  CreateAdmissionApplicationRequest,
  EnrollAdmissionApplicationRequest,
  UpdateAdmissionApplicationRequest,
} from "./admissions-types";

export interface SearchAdmissionApplicationsParams {
  institutionId: string;
  campusId?: string;
  status?: AdmissionApplicationStatus | "";
  fromDate?: string;
  toDate?: string;
  page?: number;
  size?: number;
}

function addIfPresent(
  params: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value) params.set(key, value);
}

export const admissionsService = {
  search(params: SearchAdmissionApplicationsParams): Promise<AdmissionApplicationsPage> {
    const query = new URLSearchParams({
      institutionId: params.institutionId,
      page: String(params.page ?? 0),
      size: String(params.size ?? 20),
      sort: "applicationDate,desc",
    });

    addIfPresent(query, "campusId", params.campusId);
    addIfPresent(query, "status", params.status || undefined);
    addIfPresent(query, "fromDate", params.fromDate);
    addIfPresent(query, "toDate", params.toDate);

    return apiClient.get(`admissions/applications?${query.toString()}`);
  },

  summary(params: {
    institutionId: string;
    campusId?: string;
    fromDate?: string;
    toDate?: string;
  }): Promise<AdmissionApplicationSummary> {
    const query = new URLSearchParams({ institutionId: params.institutionId });
    addIfPresent(query, "campusId", params.campusId);
    addIfPresent(query, "fromDate", params.fromDate);
    addIfPresent(query, "toDate", params.toDate);

    return apiClient.get(`admissions/applications/summary?${query.toString()}`);
  },

  getById(id: string): Promise<AdmissionApplication> {
    return apiClient.get(`admissions/applications/${encodeURIComponent(id)}`);
  },

  create(request: CreateAdmissionApplicationRequest): Promise<AdmissionApplication> {
    return apiClient.post("admissions/applications", request);
  },

  update(
    id: string,
    request: UpdateAdmissionApplicationRequest,
  ): Promise<AdmissionApplication> {
    return apiClient.put(
      `admissions/applications/${encodeURIComponent(id)}`,
      request,
    );
  },

  updateStatus(
    id: string,
    status: AdmissionApplicationStatus,
  ): Promise<AdmissionApplication> {
    return apiClient.patch(
      `admissions/applications/${encodeURIComponent(id)}/status`,
      { status },
    );
  },

  enroll(
    id: string,
    request: EnrollAdmissionApplicationRequest,
  ): Promise<AdmissionApplication> {
    return apiClient.post(
      `admissions/applications/${encodeURIComponent(id)}/enroll`,
      request,
    );
  },
};
