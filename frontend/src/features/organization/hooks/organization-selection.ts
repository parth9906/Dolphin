import { useSyncExternalStore } from "react";

import type {
  Cluster,
  Enterprise,
  Institution,
  Region,
} from "../api/organization-types";

export const ORGANIZATION_SELECTION_STORAGE_KEY =
  "dolphin.organization.selection.v1";

export type OrganizationSelection = {
  enterprise: Enterprise | null;
  region: Region | null;
  cluster: Cluster | null;
  institution: Institution | null;
};

export type OrganizationEntity = {
  id: string;
  code: string;
  name: string;
  active: boolean;
};

const EMPTY_SELECTION: OrganizationSelection = {
  enterprise: null,
  region: null,
  cluster: null,
  institution: null,
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredEntity(value: unknown): value is OrganizationEntity {
  if (!isRecord(value)) return false;

  return (
    typeof value.id === "string" &&
    typeof value.code === "string" &&
    typeof value.name === "string" &&
    typeof value.active === "boolean"
  );
}

function readStoredSelection(): OrganizationSelection {
  try {
    const storedText = window.sessionStorage.getItem(
      ORGANIZATION_SELECTION_STORAGE_KEY,
    );
    if (!storedText) return EMPTY_SELECTION;

    const parsed: unknown = JSON.parse(storedText);
    if (!isRecord(parsed)) return EMPTY_SELECTION;

    const enterpriseValue = parsed.enterprise;
    const regionValue = parsed.region;
    const clusterValue = parsed.cluster;
    const institutionValue = parsed.institution;
    const enterprise = isStoredEntity(enterpriseValue)
      ? (enterpriseValue as Enterprise)
      : null;

    const region =
      isStoredEntity(regionValue) &&
      isRecord(regionValue) &&
      typeof regionValue.enterpriseId === "string" &&
      enterprise !== null
        ? (regionValue as unknown as Region)
        : null;

    const cluster =
      isStoredEntity(clusterValue) &&
      isRecord(clusterValue) &&
      typeof clusterValue.regionId === "string" &&
      region !== null
        ? (clusterValue as unknown as Cluster)
        : null;

    const institution =
      isStoredEntity(institutionValue) &&
      isRecord(institutionValue) &&
      typeof institutionValue.clusterId === "string" &&
      typeof institutionValue.institutionType === "string" &&
      cluster !== null
        ? (institutionValue as unknown as Institution)
        : null;

    // Older sessions may still contain a campus selection. Ignore it: the
    // organization hierarchy now ends at institution.
    return { enterprise, region, cluster, institution };
  } catch {
    return EMPTY_SELECTION;
  }
}

let currentSelection = readStoredSelection();
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSelectionSnapshot() {
  return currentSelection;
}

function getInstitutionIdSnapshot() {
  return currentSelection.institution?.id ?? "";
}

function getServerSelectionSnapshot() {
  return EMPTY_SELECTION;
}

function getServerInstitutionIdSnapshot() {
  return "";
}

export function setOrganizationSelection(
  nextSelection:
    | OrganizationSelection
    | ((current: OrganizationSelection) => OrganizationSelection),
) {
  const resolvedSelection =
    typeof nextSelection === "function"
      ? nextSelection(currentSelection)
      : nextSelection;

  currentSelection = resolvedSelection;

  try {
    window.sessionStorage.setItem(
      ORGANIZATION_SELECTION_STORAGE_KEY,
      JSON.stringify(resolvedSelection),
    );
  } catch {
    // The in-memory selection remains usable when storage is unavailable.
  }

  notifyListeners();
}

export function useOrganizationSelection(): [
  OrganizationSelection,
  typeof setOrganizationSelection,
] {
  const selection = useSyncExternalStore(
    subscribe,
    getSelectionSnapshot,
    getServerSelectionSnapshot,
  );

  return [selection, setOrganizationSelection];
}

export function useSelectedInstitutionId(): string {
  return useSyncExternalStore(
    subscribe,
    getInstitutionIdSnapshot,
    getServerInstitutionIdSnapshot,
  );
}

