
import { useQuery } from '@tanstack/react-query';

import { organizationService } from '../api/organization-service';

export const organizationKeys = {
  all: ['organization'] as const,
  enterprises: () => [...organizationKeys.all, 'enterprises'] as const,
  enterprise: (id: string) =>
    [...organizationKeys.all, 'enterprise', id] as const,
  regions: (enterpriseId: string) =>
    [...organizationKeys.all, 'regions', enterpriseId] as const,
  region: (id: string) =>
    [...organizationKeys.all, 'region', id] as const,
  clusters: (regionId: string) =>
    [...organizationKeys.all, 'clusters', regionId] as const,
  cluster: (id: string) =>
    [...organizationKeys.all, 'cluster', id] as const,
  institution: (id: string) =>
    [...organizationKeys.all, 'institution', id] as const,
  campus: (id: string) =>
    [...organizationKeys.all, 'campus', id] as const,
};

export function useEnterprises() {
  return useQuery({
    queryKey: organizationKeys.enterprises(),
    queryFn: organizationService.getEnterprises,
  });
}

export function useEnterprise(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.enterprise(id ?? ''),
    queryFn: () => organizationService.getEnterprise(id!),
    enabled: Boolean(id),
  });
}

export function useRegions(enterpriseId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.regions(enterpriseId ?? ''),
    queryFn: () => organizationService.getRegions(enterpriseId!),
    enabled: Boolean(enterpriseId),
  });
}

export function useRegion(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.region(id ?? ''),
    queryFn: () => organizationService.getRegion(id!),
    enabled: Boolean(id),
  });
}

export function useClusters(regionId: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.clusters(regionId ?? ''),
    queryFn: () => organizationService.getClusters(regionId!),
    enabled: Boolean(regionId),
  });
}

export function useCluster(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.cluster(id ?? ''),
    queryFn: () => organizationService.getCluster(id!),
    enabled: Boolean(id),
  });
}

export function useInstitution(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.institution(id ?? ''),
    queryFn: () => organizationService.getInstitution(id!),
    enabled: Boolean(id),
  });
}

export function useCampus(id: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.campus(id ?? ''),
    queryFn: () => organizationService.getCampus(id!),
    enabled: Boolean(id),
  });
}

export function useInstitutions(clusterId: string) {
  return useQuery({
    queryKey: [...organizationKeys.all, "institutions", clusterId],
    queryFn: () => organizationService.getInstitutions(clusterId),
    enabled: Boolean(clusterId),
  });
}

export function useCampuses(institutionId: string) {
  return useQuery({
    queryKey: [...organizationKeys.all, "campuses", institutionId],
    queryFn: () => organizationService.getCampuses(institutionId),
    enabled: Boolean(institutionId),
  });
}
