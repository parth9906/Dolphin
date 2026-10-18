import { useQuery } from "@tanstack/react-query";

import { studentService } from "../api/student-service";
import type { StudentSearchParams } from "../api/student-types";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const studentKeys = {
  all: ["students"] as const,
  search: (filters: StudentSearchParams | null) =>
    [...studentKeys.all, "search", filters] as const,
  inactiveSearch: (filters: StudentSearchParams | null) =>
    [...studentKeys.all, "inactive-search", filters] as const,
  detail: (id: string) => [...studentKeys.all, "detail", id] as const,
  accountLink: (id: string) => [...studentKeys.all, "account-link", id] as const,
};

export function useStudents(filters: StudentSearchParams | null, enabled = true) {
  return useQuery({
    queryKey: studentKeys.search(filters),
    queryFn: () => {
      if (!filters) {
        throw new Error("Select an institution before searching students.");
      }

      return studentService.searchStudents(filters);
    },
    enabled: Boolean(filters?.institutionId) && enabled,
    staleTime: 30_000,
  });
}

export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: studentKeys.detail(id ?? ""),
    queryFn: () => {
      if (!id) {
        throw new Error("A student ID is required.");
      }

      return studentService.getStudent(id);
    },
    enabled: Boolean(id && UUID_PATTERN.test(id)),
    staleTime: 30_000,
  });
}


export function useInactiveStudents(
  filters: StudentSearchParams | null,
  enabled = true,
) {
  return useQuery({
    queryKey: studentKeys.inactiveSearch(filters),
    queryFn: () => {
      if (!filters) {
        throw new Error("Select an institution before searching students.");
      }

      return studentService.searchInactiveStudents(filters);
    },
    enabled: Boolean(filters?.institutionId) && enabled,
    staleTime: 30_000,
  });
}


export function useStudentAccountLink(id: string | undefined) {
  return useQuery({
    queryKey: studentKeys.accountLink(id ?? ""),
    queryFn: () => {
      if (!id || !UUID_PATTERN.test(id)) {
        throw new Error("A valid student ID is required.");
      }

      return studentService.getAccountLink(id);
    },
    enabled: Boolean(id && UUID_PATTERN.test(id)),
    staleTime: 30_000,
  });
}
