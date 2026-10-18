import {
  ArrowRight,
  Building2,
  KeyRound,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useAuth } from "../../../lib/auth/use-auth";

export function DashboardPage() {
  const { user, accessContext } = useAuth();

  const roles = accessContext?.roles ?? [];
  const permissions = accessContext?.permissions ?? [];
  const scopes = accessContext?.scopes ?? [];

  const summaryItems = [
    {
      label: "Assigned roles",
      value: roles.length,
      description: "Roles assigned to your account",
      icon: ShieldCheck,
    },
    {
      label: "Permissions",
      value: permissions.length,
      description: "Permissions returned by the backend",
      icon: KeyRound,
    },
    {
      label: "Organization scopes",
      value: scopes.length,
      description: "Scopes assigned to your account",
      icon: Building2,
    },
  ];

  return (
    <div className="dashboard">
      <section className="dashboard__welcome">
        <div>
          <p className="dashboard__eyebrow">YOUR WORKSPACE</p>
          <h1>Welcome back, {user?.username ?? "User"}</h1>
          <p className="dashboard__intro">
            Manage your school operations from one workspace.
            Your available actions depend on your assigned access.
          </p>
        </div>

        <div className="dashboard__welcome-icon" aria-hidden="true">
          <Users size={29} />
        </div>
      </section>

      <section
        className="dashboard__summary"
        aria-label="Account access summary"
      >
        {summaryItems.map((item) => {
          const Icon = item.icon;

          return (
            <article className="dashboard-card" key={item.label}>
              <div className="dashboard-card__top">
                <span className="dashboard-card__icon">
                  <Icon size={20} />
                </span>
                <span className="dashboard-card__label">
                  {item.label}
                </span>
              </div>

              <p className="dashboard-card__value">{item.value}</p>
              <p className="dashboard-card__description">
                {item.description}
              </p>
            </article>
          );
        })}
      </section>

      <section className="dashboard-panel">
        <div className="dashboard-panel__header">
          <div>
            <h2>Access overview</h2>
            <p>Details provided by your authenticated session.</p>
          </div>
          <ShieldCheck size={21} />
        </div>

        <div className="dashboard-panel__section">
          <h3>Assigned roles</h3>

          {roles.length > 0 ? (
            <div className="dashboard-tags">
              {roles.map((role) => (
                <span className="dashboard-tag" key={role}>
                  {role}
                </span>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              No roles were returned for this account.
            </p>
          )}
        </div>

        <div className="dashboard-panel__section">
          <h3>Organization scopes</h3>

          {scopes.length > 0 ? (
            <div className="dashboard-scope-list">
              {scopes.map((scope) => (
                <div
                  className="dashboard-scope"
                  key={`${scope.scopeType}:${scope.scopeId}`}
                >
                  <div className="dashboard-scope__icon">
                    <Building2 size={18} />
                  </div>

                  <div className="dashboard-scope__details">
                    <span className="dashboard-scope__type">
                      {scope.scopeType}
                    </span>
                    <span className="dashboard-scope__id">
                      {scope.scopeId}
                    </span>
                  </div>

                  <ArrowRight
                    className="dashboard-scope__arrow"
                    size={17}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              No organization scopes were returned for this account.
            </p>
          )}
        </div>

        <div className="dashboard-panel__section">
          <h3>Permissions</h3>

          {permissions.length > 0 ? (
            <div className="dashboard-tags">
              {permissions.map((permission) => (
                <span className="dashboard-tag" key={permission}>
                  {permission}
                </span>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">
              No permissions were returned for this account.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}