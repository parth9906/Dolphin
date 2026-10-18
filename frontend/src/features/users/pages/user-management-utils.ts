import type {
  OrganizationScopeType,
  UserScope,
} from "../api/user-administration-types";

export interface SelectOption {
  value: string;
  label: string;
}

export interface ScopeOption extends SelectOption {
  scopeType: OrganizationScopeType;
  scopeId: string;
}

export interface PendingConfirmation {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
}

export interface InvitationForm {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string;
  scopeValue: string;
}

export const SCOPE_TYPES: OrganizationScopeType[] = [
  "ENTERPRISE",
  "REGION",
  "CLUSTER",
  "INSTITUTION",
  "CAMPUS",
];

export const PAGE_SIZE = 20;

export function unwrap<T>(result: T[] | { content?: T[] } | null | undefined): T[] {
  if (Array.isArray(result)) {
    return result;
  }

  return result?.content ?? [];
}

export function scopeTitle(scopeType: string): string {
  return scopeType.charAt(0) + scopeType.slice(1).toLowerCase();
}

export function errorText(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Something went wrong. Please try again.";
}

export function displayScopeName(scope: UserScope): string {
  const name = scope.scopeName?.trim();

  if (!name || name.toLowerCase() === scope.scopeType.toLowerCase()) {
    return scopeTitle(scope.scopeType);
  }

  return name;
}

export function toScopeOptions(scopes: UserScope[]): ScopeOption[] {
  return scopes
    .filter((scope) =>
      SCOPE_TYPES.includes(scope.scopeType as OrganizationScopeType)
      && Boolean(scope.scopeId),
    )
    .map((scope, index) => {
      const scopeType = scope.scopeType as OrganizationScopeType;
      const name = scope.scopeName?.trim();

      return {
        value: `${scopeType}|${scope.scopeId}`,
        scopeType,
        scopeId: scope.scopeId,
        label: name
          ? `${name} · ${scopeTitle(scopeType)}`
          : `${scopeTitle(scopeType)} access ${index + 1}`,
      };
    });
}

export const emptyInvitation: InvitationForm = {
  username: "",
  email: "",
  firstName: "",
  lastName: "",
  roleId: "",
  scopeValue: "",
};

