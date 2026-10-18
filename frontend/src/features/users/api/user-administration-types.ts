export type OrganizationScopeType =
  | "ENTERPRISE"
  | "REGION"
  | "CLUSTER"
  | "INSTITUTION"
  | "CAMPUS";

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  active: boolean;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  active: boolean;
}

export interface UserScope {
  id?: string;
  userId?: string;
  scopeType: OrganizationScopeType;
  scopeId: string;
  scopeName?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first?: boolean;
  last?: boolean;
}

export interface InvitationScopeRequest {
  scopeType: OrganizationScopeType;
  scopeId: string;
}

export interface CreateUserInvitationRequest {
  username: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  roleId: string;
  /** New clients use scopes. Legacy fields remain available for existing single-scope flows. */
  scopes?: InvitationScopeRequest[];
  scopeType?: OrganizationScopeType;
  scopeId?: string;
}

export interface InvitationScopeResponse {
  scopeType: OrganizationScopeType;
  scopeId: string;
}

export interface UserInvitationResponse {
  invitationId?: string;
  id?: string;
  email: string;
  username: string;
  roleCode: string;
  roleName: string;
  scopeType?: string;
  scopeId?: string;
  scopes?: InvitationScopeResponse[];
  expiresAt: string;
  status: string;
}

export interface AcceptUserInvitationResponse {
  userId: string;
  username: string;
  message: string;
}

export interface AcceptUserInvitationRequest {
  token: string;
  password: string;
}
