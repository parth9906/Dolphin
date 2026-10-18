export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface LoginResponse {
  /** Access context returned with every successful login and refresh response. */
  accessContext: import("./access-context-types").AccessContext;
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
  refreshToken: string;
  refreshExpiresInSeconds: number;
  userId: string;
  username: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedUser {
  userId: string;
  username: string;
}
export interface AuthSessionResult {
  user: AuthenticatedUser;
  accessContext: import("./access-context-types").AccessContext;
}
