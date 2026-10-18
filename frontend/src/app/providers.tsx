import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { AuthProvider } from "../lib/auth/auth-provider";
import { useAuth } from "../lib/auth/use-auth";
import { setOrganizationSelection, useOrganizationSelection } from "../features/organization/hooks/organization-selection";

interface AppProvidersProps {
  children: ReactNode;
}

function SessionQueryCacheBoundary() {
  const queryClient = useQueryClient();
  const { status, user } = useAuth();
  const [organizationSelection] = useOrganizationSelection();
  const hasOrganizationSelection = Boolean(
    organizationSelection.enterprise ||
    organizationSelection.region ||
    organizationSelection.cluster ||
    organizationSelection.institution,
  );
  const previousSession = useRef({ status, userId: user?.userId ?? null });

  useEffect(() => {
    const currentUserId = user?.userId ?? null;
    const previous = previousSession.current;
    const sessionChanged =
      previous.status === "authenticated" &&
      (status !== "authenticated" || previous.userId !== currentUserId);

    previousSession.current = { status, userId: currentUserId };

    if (sessionChanged) {
      void queryClient.cancelQueries();
      queryClient.clear();
      setOrganizationSelection({
        enterprise: null,
        region: null,
        cluster: null,
        institution: null,
      });
      return;
    }

    if (status === "unauthenticated" && hasOrganizationSelection) {
      setOrganizationSelection({
        enterprise: null,
        region: null,
        cluster: null,
        institution: null,
      });
    }
  }, [queryClient, status, user?.userId, hasOrganizationSelection]);

  return null;
}

export function AppProviders({ children }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SessionQueryCacheBoundary />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
