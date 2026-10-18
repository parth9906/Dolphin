
import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";

import { useAuth } from "../lib/auth/use-auth";

interface PermissionRouteProps {
  permission: string;
  children: ReactNode;
}

export function PermissionRoute({
  permission,
  children,
}: PermissionRouteProps) {
  const { status, hasPermission } = useAuth();

  if (status !== "authenticated") {
    return null;
  }

  if (!hasPermission(permission)) {
    return (
      <main className="permission-denied" role="alert">
        <div className="permission-denied__icon">
          <ShieldX size={28} />
        </div>

        <h1>Access denied</h1>

        <p>
          You don't have the required permission to access this page.
          Contact your administrator if you believe this is a mistake.
        </p>

        <span className="permission-denied__code">
          Required permission: {permission}
        </span>
      </main>
    );
  }

  return children;
}
