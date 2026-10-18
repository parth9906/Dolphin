import { ApiError } from "../api/api-error";
import { setRefreshHandler } from "../api/api-client";
import { tokenStorage } from "./token-storage";
import { authService } from "./auth-service";
import type { AccessContext } from "./access-context-types";

let refreshPromise: Promise<AccessContext> | null = null;
let sessionVersion = 0;
let accessContextHandler: ((context: AccessContext) => void) | null = null;

async function refreshSession(): Promise<AccessContext> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const versionAtStart = sessionVersion;

  refreshPromise = (async () => {
    try {
      const result = await authService.refresh();
      const accessContext = result.accessContext;

      if (versionAtStart !== sessionVersion) {
        throw new ApiError(
          401,
          "The session changed while refreshing.",
          "SESSION_CHANGED",
        );
      }

      accessContextHandler?.(accessContext);
      return accessContext;
    } catch (error) {
      if (versionAtStart === sessionVersion) {
        if (!(error instanceof ApiError && error.isNetworkError)) {
          tokenStorage.clear();
        }
      }

      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export const authSession = {
  initialize(onAccessContext?: (context: AccessContext) => void): void {
    accessContextHandler = onAccessContext ?? null;
    setRefreshHandler(async () => {
      await refreshSession();
    });
  },

  async refresh(): Promise<AccessContext> {
    return refreshSession();
  },

  markSessionChanged(): void {
    sessionVersion += 1;
  },

  clear(): void {
    sessionVersion += 1;
    accessContextHandler = null;
    tokenStorage.clear();
  },
};