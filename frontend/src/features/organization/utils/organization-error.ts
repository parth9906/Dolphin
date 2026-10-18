import { ApiError } from "../../../lib/api/api-error";

export function getOrganizationErrorMessage(
  error: unknown,
  entityName: string,
): string {
  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return "Your session may have expired. Please sign in again and retry.";

      case 403:
        return `You don't have permission to view this ${entityName}. Contact your administrator if you need access.`;

      case 404:
        return `This ${entityName} could not be found. It may have been removed or may not be available in this environment.`;

      case 0:
        if (error.code === "REQUEST_TIMEOUT") {
          return "The request timed out. Check your connection and try again.";
        }

        return "Unable to reach the server. Check your network connection and try again.";

      default:
        if (error.status >= 500) {
          return `The server could not load this ${entityName}. Please try again later.`;
        }

        return error.message || `Unable to load this ${entityName}.`;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return `An unexpected error occurred while loading this ${entityName}.`;
}
