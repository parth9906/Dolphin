import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";

import { hostelService } from "../api/hostel-service";
import type { Hostel, HostelPage as PageResult } from "../api/hostel-types";
import type { EntityFilter } from "../components/hostel-directory-types";

interface UseHostelDirectoryOptions {
  institutionId: string;
  canRead: boolean;
}

interface UseHostelDirectoryResult {
  hostels: Hostel[];
  page: PageResult<Hostel> | null;
  pageIndex: number;
  setPageIndex: Dispatch<SetStateAction<number>>;
  filter: EntityFilter;
  setFilter: Dispatch<SetStateAction<EntityFilter>>;
  loading: boolean;
  error: string;
  selectedHostelId: string;
  setSelectedHostelId: Dispatch<SetStateAction<string>>;
  load: () => Promise<void>;
}

function describeError(cause: unknown): string {
  if (cause instanceof Error && cause.message.trim()) return cause.message;
  if (cause && typeof cause === "object") {
    const candidate = cause as {
      message?: unknown;
      response?: { data?: { message?: unknown; error?: unknown } };
    };
    const message = candidate.response?.data?.message
      ?? candidate.response?.data?.error
      ?? candidate.message;
    if (typeof message === "string" && message.trim()) return message;
  }
  return "Something went wrong. Please try again.";
}

export function useHostelDirectory({
  institutionId,
  canRead,
}: UseHostelDirectoryOptions): UseHostelDirectoryResult {
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [page, setPage] = useState<PageResult<Hostel> | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  const [filter, setFilter] = useState<EntityFilter>("ACTIVE");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [dataInstitutionId, setDataInstitutionId] = useState(institutionId);
  const requestSequence = useRef(0);
  const previousInstitutionId = useRef(institutionId);

  const load = useCallback(async () => {
    const requestId = ++requestSequence.current;
    const institutionChanged = previousInstitutionId.current !== institutionId;

    if (institutionChanged) {
      previousInstitutionId.current = institutionId;
      setDataInstitutionId(institutionId);
      setHostels([]);
      setPage(null);
      setSelectedHostelId("");
      setError("");
    }

    if (!institutionId || !canRead) {
      setHostels([]);
      setPage(null);
      setSelectedHostelId("");
      setError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await hostelService.searchHostels(
        institutionId,
        filter === "ALL" ? undefined : filter === "ACTIVE",
        pageIndex,
        20,
      );

      if (requestId !== requestSequence.current) return;

      const resultHostels = result.content ?? [];
      setPage(result);
      setHostels(resultHostels);
      setSelectedHostelId((current) =>
        resultHostels.some((item) => item.id === current)
          ? current
          : resultHostels[0]?.id ?? "",
      );
    } catch (cause) {
      if (requestId !== requestSequence.current) return;
      setError(describeError(cause));
      setHostels([]);
      setPage(null);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, [institutionId, canRead, filter, pageIndex]);

  useEffect(() => {
    void load();
    return () => {
      requestSequence.current += 1;
    };
  }, [load]);

  const contextMatches = dataInstitutionId === institutionId;
  const contextHostels = contextMatches
    ? hostels.filter((hostel) => hostel.institutionId === institutionId)
    : [];

  return {
    hostels: contextHostels,
    page: contextMatches ? page : null,
    pageIndex,
    setPageIndex,
    filter,
    setFilter,
    loading: contextMatches ? loading : true,
    error: contextMatches ? error : "",
    selectedHostelId: contextMatches ? selectedHostelId : "",
    setSelectedHostelId,
    load,
  };
}
