import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { ApiError } from "../api/api-error";
import { authService } from "./auth-service";
import { authSession } from "./auth-session";
import {
  AuthContext,
  type AuthContextValue,
  type AuthStatus,
} from "./auth-context";
import { tokenStorage } from "./token-storage";
import type { AuthenticatedUser } from "./auth-types";
import type { AccessContext } from "./access-context-types";

function assertContextIdentity(context: AccessContext, userId: string, username: string) {
  if (context.userId !== userId || context.username !== username) {
    throw new Error("The authentication response contains a mismatched access context.");
  }
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [accessContext, setAccessContext] = useState<AccessContext | null>(null);
  const operationVersion = useRef(0);

  const clearSession = useCallback(() => {
    operationVersion.current += 1;
    authSession.clear();
    setUser(null);
    setAccessContext(null);
    setStatus("unauthenticated");
  }, []);


  const login = useCallback(
    async (username: string, password: string) => {
      const operation = ++operationVersion.current;
      authSession.markSessionChanged();
      setStatus("loading");

      try {
        const result = await authService.login({ username, password });

        if (operation !== operationVersion.current) return;

        const context = result.accessContext;
        assertContextIdentity(context, result.user.userId, result.user.username);
        setAccessContext(context);
        setUser({ userId: context.userId, username: context.username });
        setStatus("authenticated");

        if (operation !== operationVersion.current) return;
      } catch (error) {
        if (operation === operationVersion.current) {
          clearSession();
        }
        throw error;
      }
    },
    [clearSession],
  );

  const logout = useCallback(async () => {
    const operation = ++operationVersion.current;
    authSession.markSessionChanged();

    try {
      await authService.logout();
    } finally {
      if (operation === operationVersion.current) {
        clearSession();
      }
    }
  }, [clearSession]);

  useEffect(() => {
    let active = true;
    const operation = ++operationVersion.current;

    authSession.initialize((context) => {
      setAccessContext(context);
      setUser({ userId: context.userId, username: context.username });
      setStatus("authenticated");
    });

    async function restoreSession() {
      if (!tokenStorage.getRefreshToken()) {
        if (active && operation === operationVersion.current) {
          setUser(null);
          setAccessContext(null);
          setStatus("unauthenticated");
        }
        return;
      }

      try {
        const context = await authSession.refresh();

        if (!active || operation !== operationVersion.current) return;

        setAccessContext(context);
        setUser({ userId: context.userId, username: context.username });
        setStatus("authenticated");

        if (!active || operation !== operationVersion.current) return;
      } catch (error) {
        if (!active || operation !== operationVersion.current) return;

        if (error instanceof ApiError && error.isNetworkError) {
          setUser(null);
          setAccessContext(null);
          setStatus("unauthenticated");
          return;
        }

        clearSession();
      }
    }

    void restoreSession();

    return () => {
      active = false;
    };
  }, [clearSession]);

  const hasPermission = useCallback(
    (permission: string) =>
      accessContext?.permissions.includes(permission) ?? false,
    [accessContext],
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]) =>
      permissions.some((permission) =>
        accessContext?.permissions.includes(permission),
      ),
    [accessContext],
  );

  const hasRole = useCallback(
    (role: string) => accessContext?.roles.includes(role) ?? false,
    [accessContext],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessContext,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasRole,
    }),
    [
      status,
      user,
      accessContext,
      login,
      logout,
      hasPermission,
      hasAnyPermission,
      hasRole,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}