import {
  ArrowLeft,
  Building2,
  CircleAlert,
  RefreshCw,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

import { useInstitution } from "../hooks/use-organization";
import { getOrganizationErrorMessage } from "../utils/organization-error";

import "./organization-detail-page.css";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function InstitutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const validId = id && UUID_PATTERN.test(id) ? id : undefined;
  const institutionQuery = useInstitution(validId);

  if (!validId) {
    return (
      <main className="org-detail-page">
        <Link to="/organization" className="org-detail-back">
          <ArrowLeft size={16} />
          Back to Organization
        </Link>

        <div className="org-detail-state" role="alert">
          <CircleAlert size={24} />
          <h1>Invalid institution ID</h1>
          <p>Open this page with a valid institution UUID.</p>
        </div>
      </main>
    );
  }

  if (institutionQuery.isPending) {
    return (
      <main className="org-detail-page">
        <div className="org-detail-state" role="status">
          <span className="org-spinner" />
          <p>Loading institution...</p>
        </div>
      </main>
    );
  }

  if (institutionQuery.isError) {
    return (
      <main className="org-detail-page">
        <Link to="/organization" className="org-detail-back">
          <ArrowLeft size={16} />
          Back to Organization
        </Link>

        <div className="org-detail-state org-detail-state--error" role="alert">
          <CircleAlert size={24} />
          <h1>Unable to load institution</h1>
          <p>
            {getOrganizationErrorMessage(institutionQuery.error, "institution")}
          </p>

          <button
            type="button"
            className="org-button org-button-secondary"
            onClick={() => void institutionQuery.refetch()}
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      </main>
    );
  }

  const institution = institutionQuery.data;

  return (
    <main className="org-detail-page">
      <Link to="/organization" className="org-detail-back">
        <ArrowLeft size={16} />
        Back to Organization
      </Link>

      <header className="org-detail-header">
        <div className="org-detail-header__icon">
          <Building2 size={25} />
        </div>

        <div className="org-detail-header__content">
          <span className="org-eyebrow">ORGANIZATION / INSTITUTION</span>
          <h1>{institution.name}</h1>
          <p>Institution details</p>
        </div>

        <span
          className={`org-status ${
            institution.active ? "is-active" : "is-inactive"
          }`}
        >
          {institution.active ? "Active" : "Inactive"}
        </span>
      </header>

      <section className="org-detail-card">
        <div className="org-detail-card__header">
          <h2>Institution information</h2>
          <p>Read-only details from the organization service.</p>
        </div>

        <dl className="org-detail-grid">
          <div className="org-detail-field">
            <dt>Name</dt>
            <dd>{institution.name}</dd>
          </div>

          <div className="org-detail-field">
            <dt>Code</dt>
            <dd>{institution.code}</dd>
          </div>

          <div className="org-detail-field">
            <dt>Institution type</dt>
            <dd>{institution.institutionType}</dd>
          </div>

          <div className="org-detail-field">
            <dt>Status</dt>
            <dd>{institution.active ? "Active" : "Inactive"}</dd>
          </div>

          <div className="org-detail-field org-detail-field--full">
            <dt>Cluster ID</dt>
            <dd className="org-detail-id">{institution.clusterId}</dd>
          </div>

          <div className="org-detail-field org-detail-field--full">
            <dt>Institution ID</dt>
            <dd className="org-detail-id">{institution.id}</dd>
          </div>
        </dl>
      </section>

      <section className="org-detail-card" style={{ marginTop: 20 }}>
        <div className="org-detail-card__header">
          <h2>Campuses</h2>
          <p>
            Campuses associated with this institution can be explored through
            the Organization hierarchy.
          </p>
          <Link
            to="/organization"
            style={{
              display: "inline-flex",
              marginTop: 12,
              color: "#3157a4",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            View organization hierarchy →
          </Link>
        </div>
      </section>
    </main>
  );
}
