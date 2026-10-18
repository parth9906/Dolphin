
import { apiClient } from '../../../lib/api/api-client';

import type {
  Campus,
  Cluster,
  Enterprise,
  Institution,
  Region,
} from './organization-types';

export const organizationService = {
  getEnterprises(): Promise<Enterprise[]> {
    return apiClient.get<Enterprise[]>('enterprises');
  },

  getEnterprise(id: string): Promise<Enterprise> {
    return apiClient.get<Enterprise>(
      `enterprises/${encodeURIComponent(id)}`,
    );
  },

  createRegion(request: {
    enterpriseId: string;
    code: string;
    name: string;
  }): Promise<Region> {
    return apiClient.post<Region>("regions", request);
  },

  getRegions(enterpriseId: string): Promise<Region[]> {
    return apiClient.get<Region[]>(
      `regions/by-enterprise/${encodeURIComponent(enterpriseId)}`,
    );
  },

  getRegion(id: string): Promise<Region> {
    return apiClient.get<Region>(
      `regions/${encodeURIComponent(id)}`,
    );
  },

  getClusters(regionId: string): Promise<Cluster[]> {
    return apiClient.get<Cluster[]>(
      `clusters/by-region/${encodeURIComponent(regionId)}`,
    );
  },

  createCluster(request: { regionId: string; code: string; name: string }): Promise<Cluster> {
    return apiClient.post<Cluster>("clusters", request);
  },

  createInstitution(request: {
    clusterId: string;
    code: string;
    name: string;
    institutionType: string;
  }): Promise<Institution> {
    return apiClient.post<Institution>("institutions", request);
  },

  getCluster(id: string): Promise<Cluster> {
    return apiClient.get<Cluster>(
      `clusters/${encodeURIComponent(id)}`,
    );
  },

  getInstitution(id: string): Promise<Institution> {
    return apiClient.get<Institution>(
      `institutions/${encodeURIComponent(id)}`,
    );
  },

  getCampus(id: string): Promise<Campus> {
    return apiClient.get<Campus>(
      `campuses/${encodeURIComponent(id)}`,
    );
  },

  getInstitutions(clusterId: string): Promise<Institution[]> {
  return apiClient.get<Institution[]>(
    `institutions/by-cluster/${encodeURIComponent(clusterId)}`,
  );
},

getCampuses(institutionId: string): Promise<Campus[]> {
  return apiClient.get<Campus[]>(
    `campuses/by-institution/${encodeURIComponent(institutionId)}`,
  );
},

  createEnterprise(request: { code: string; name: string }): Promise<Enterprise> {
    return apiClient.post<Enterprise>("enterprises", request);
  },

};

