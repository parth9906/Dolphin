import { apiClient } from "../../../lib/api/api-client";

import type {
  AcceptUserInvitationRequest,
  AcceptUserInvitationResponse,
  CreateUserInvitationRequest,
  PageResponse,
  Role,
  UserAccount,
  UserInvitationResponse,
  UserScope,
} from "./user-administration-types";

export const userAdministrationService = {
  getUserById(userId: string): Promise<UserAccount> {
    return apiClient.get<UserAccount>(`users/${encodeURIComponent(userId)}`);
  },

  getDirectory(params: URLSearchParams) {
    const query = params.toString();

    return apiClient.get<
      PageResponse<UserAccount> | UserAccount[]
    >(`users/directory${query ? `?${query}` : ""}`);
  },

  getRoles() {
    return apiClient.get<PageResponse<Role> | Role[]>(
      "roles?active=true&page=0&size=100",
    );
  },

  getUserRoles(userId: string) {
    return apiClient.get<Role[]>(`users/${userId}/roles`);
  },

  getUserScopes(userId: string) {
    return apiClient.get<UserScope[]>(`users/${userId}/scopes`);
  },

  createInvitation(request: CreateUserInvitationRequest) {
    return apiClient.post<UserInvitationResponse>(
      "user-invitations",
      request,
    );
  },

  acceptInvitation(request: AcceptUserInvitationRequest) {
    return apiClient.post<AcceptUserInvitationResponse>(
      "user-invitations/accept",
      request,
      { auth: "none" },
    );
  },

  assignRole(userId: string, roleId: string) {
    return apiClient.post<void>(
      `users/${userId}/roles/${roleId}`,
    );
  },

  revokeRole(userId: string, roleId: string) {
    return apiClient.delete<void>(
      `users/${userId}/roles/${roleId}`,
    );
  },

  assignScope(
    userId: string,
    scopeType: string,
    scopeId: string,
  ) {
    return apiClient.post<void>(
      `users/${userId}/scopes`,
      { scopeType, scopeId },
    );
  },

  revokeScope(
    userId: string,
    scopeType: string,
    scopeId: string,
  ) {
    return apiClient.delete<void>(
      `users/${userId}/scopes/${scopeType}/${scopeId}`,
    );
  },

  deactivateUser(userId: string) {
    return apiClient.patch<UserAccount>(
      `users/${userId}/deactivate`,
      {},
    );
  },
};
