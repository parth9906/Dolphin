import { apiClient } from "../../../lib/api/api-client";
import type {
  CreateDisciplineIncidentRequest,
  DisciplineIncident,
  DisciplinePage,
  DisciplineSearchFilters,
  DisciplineStatus,
} from "./discipline-types";

export const disciplineService = {
  search(
    filters: DisciplineSearchFilters,
  ): Promise<DisciplinePage<DisciplineIncident>> {
    const params = new URLSearchParams();
    params.set("institutionId", filters.institutionId);
    params.set("page", String(filters.page));
    params.set("size", String(filters.size));
    params.set("sort", "incidentDate,desc");

    if (filters.studentId) params.set("studentId", filters.studentId);
    if (filters.status) params.set("status", filters.status);
    if (filters.severity) params.set("severity", filters.severity);
    if (filters.fromDate) params.set("fromDate", filters.fromDate);
    if (filters.toDate) params.set("toDate", filters.toDate);

    return apiClient.get<DisciplinePage<DisciplineIncident>>(
      `discipline/incidents?${params.toString()}`,
    );
  },

  create(
    request: CreateDisciplineIncidentRequest,
  ): Promise<DisciplineIncident> {
    return apiClient.post<DisciplineIncident>("discipline/incidents", request);
  },

  getById(id: string): Promise<DisciplineIncident> {
    return apiClient.get<DisciplineIncident>(
      `discipline/incidents/${encodeURIComponent(id)}`,
    );
  },

  updateStatus(
    id: string,
    status: DisciplineStatus,
  ): Promise<DisciplineIncident> {
    return apiClient.patch<DisciplineIncident>(
      `discipline/incidents/${encodeURIComponent(id)}/status`,
      { status },
    );
  },
};
