import { apiClient } from "../api/api-client";
import { tokenStorage } from "./token-storage";
import type {
  AuthSessionResult,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
} from "./auth-types";

function toAuthSessionResult(response: LoginResponse): AuthSessionResult {
  const context = response.accessContext;

  if (!context) {
    throw new Error("The authentication response is missing accessContext.");
  }

  if (context.userId !== response.userId || context.username !== response.username) {
    throw new Error("The authentication response contains a mismatched access context.");
  }

  return {
    user: { userId: response.userId, username: response.username },
    accessContext: context,
  };
}

export const authService = {
  async login(request: LoginRequest): Promise<AuthSessionResult> {
    const response = await apiClient.post<LoginResponse>(
      "auth/login",
      request,
      { auth: "none" },
    );

    const result = toAuthSessionResult(response);

    tokenStorage.save({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    return result;
  },

  async refresh(): Promise<AuthSessionResult> {
    const refreshToken = tokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token is available.");
    }

    const response = await apiClient.post<LoginResponse>(
      "auth/refresh",
      { refreshToken } satisfies RefreshTokenRequest,
      { auth: "none" },
    );

    const result = toAuthSessionResult(response);

    tokenStorage.save({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
    });

    return result;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStorage.getRefreshToken();

    try {
      if (refreshToken) {
        await apiClient.post<void>(
          "auth/logout",
          { refreshToken } satisfies RefreshTokenRequest,
          { auth: "none" },
        );
      }
    } finally {
      tokenStorage.clear();
    }   
  },
};