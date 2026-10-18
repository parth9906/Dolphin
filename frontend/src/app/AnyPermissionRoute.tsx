import type { ReactNode } from "react";
import { ShieldX } from "lucide-react";

import { useAuth } from "../lib/auth/use-auth";

interface AnyPermissionRouteProps {
  permissions: string[];
  children: ReactNode;
}

export function AnyPermissionRoute({
  permissions,
  children,
}: AnyPermissionRouteProps) {
  const { status, hasPermission } = useAuth();

  if (status !== "authenticated") {
    return null;
  }

  const allowed = permissions.some((permission) =>
    hasPermission(permission),
  );

  if (!allowed) {
    return (
      <main className="permission-denied" role="alert">
        <div className="permission-denied__icon">
          <ShieldX size={28} />
        </div>

        <h1>Access denied</h1>

        <p>
          You don't have permission to access this page.
          Contact your administrator if you believe this is a mistake.
        </p>

        <span className="permission-denied__code">
          Required permissions: {permissions.join(" or ")}
        </span>
      </main>
    );
  }

  return children;
}
