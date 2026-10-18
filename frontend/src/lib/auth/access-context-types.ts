export interface AccessScope {
  scopeType: string;
  scopeId: string;
}

export interface AccessContext {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
  scopes: AccessScope[];
}