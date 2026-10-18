import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import {
  Building2,
  ChevronRight,
  Globe2,
  Layers3,
  RefreshCw,
  School,
  type LucideIcon,
} from "lucide-react";

import {
  useEnterprises,
  useRegions,
  useClusters,
  useInstitutions,
} from "../hooks/use-organization";
import {
  useOrganizationSelection,
  type OrganizationEntity,
  type OrganizationSelection,
} from "../hooks/organization-selection";

import type {
  Enterprise,
  Region,
  Cluster,
  Institution,
} from "../api/organization-types";

import { useAuth } from "../../../lib/auth/use-auth";
import { organizationService } from "../api/organization-service";
import { EnterpriseCreateForm } from "../components/EnterpriseCreateForm";
import { RegionCreateForm } from "../components/RegionCreateForm";
import { ClusterCreateForm } from "../components/ClusterCreateForm";
import { InstitutionCreateForm } from "../components/InstitutionCreateForm";
import { OrganizationSelectionSummary } from "../components/OrganizationSelectionSummary";
import "./organization-page.css";

function EntityList<T extends OrganizationEntity>({
  title,
  description,
  icon: Icon,
  items,
  selectedId,
  canView,
  requiredPermission,
  isLoading,
  isError,
  onRetry,
  onSelect,
  emptyMessage,
  actions,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  items: T[] | undefined;
  selectedId: string | null;
  canView: boolean;
  requiredPermission: string;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onSelect: (item: T) => void;
  emptyMessage: string;
  actions?: ReactNode;
}) {
  return (
    <section className="org-panel">
      <div className="org-panel-header">
        <div className="org-panel-heading">
          <span className="org-panel-icon" aria-hidden="true">
            <Icon size={19} />
          </span>

          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>

        <span className="org-count" aria-label={`${items?.length ?? 0} items`}>
          {canView ? items?.length ?? 0 : "—"}
        </span>
      </div>

      <div className="org-panel-body">
        {actions}

        {!canView && (
          <div className="org-state-error" role="status">
            <div>
              <strong>Permission required</strong>
              <p>
                Your account needs the {requiredPermission} permission to view
                this list. Contact your administrator if you need access.
              </p>
            </div>
          </div>
        )}

        {canView && isLoading && (
          <div className="org-state" role="status">
            <span className="org-spinner" />
            <span>Loading {title.toLowerCase()}...</span>
          </div>
        )}

        {canView && isError && (
          <div className="org-state-error" role="alert">
            <div>
              <strong>Unable to load {title.toLowerCase()}</strong>
              <p>
                The request failed. Check your connection or permissions, then
                try again.
              </p>
              <button
                type="button"
                className="org-button org-button-secondary"
                onClick={onRetry}
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}

        {canView && !isLoading && !isError && items?.length === 0 && (
          <div className="org-empty">
            <Icon size={24} />
            <strong>No {title.toLowerCase()} found</strong>
            <p>{emptyMessage}</p>
          </div>
        )}

        {canView && !isLoading && !isError && items && items.length > 0 && (
          <div className="org-entity-list">
            {items.map((item) => {
              const selected = selectedId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`org-entity-row${selected ? " is-selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() => onSelect(item)}
                >
                  <span className="org-entity-icon" aria-hidden="true">
                    <Icon size={17} />
                  </span>

                  <span className="org-entity-content">
                    <span className="org-entity-name">{item.name}</span>
                    <span className="org-entity-code">{item.code}</span>
                  </span>

                  <span
                    className={`org-status ${
                      item.active ? "is-active" : "is-inactive"
                    }`}
                  >
                    {item.active ? "Active" : "Inactive"}
                  </span>

                  <ChevronRight
                    className="org-entity-chevron"
                    size={16}
                    aria-hidden="true"
                  />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function OrganizationPage() {
  const { hasPermission } = useAuth();
  const canCreateEnterprise = hasPermission("ENTERPRISE_CREATE");
  const canCreateRegion = hasPermission("REGION_CREATE");
  const canCreateCluster = hasPermission("CLUSTER_CREATE");
  const canCreateInstitution = hasPermission("INSTITUTION_CREATE");

  const canReadRegions = hasPermission("REGION_READ");
  const canReadClusters = hasPermission("CLUSTER_READ");
  const canReadInstitutions = hasPermission("INSTITUTION_READ");

  const [selection, setSelection] = useOrganizationSelection();

  const enterprisesQuery = useEnterprises();
  const [showEnterpriseForm, setShowEnterpriseForm] = useState(false);
  const [enterpriseCode, setEnterpriseCode] = useState("");
  const [enterpriseName, setEnterpriseName] = useState("");
  const [enterpriseFormError, setEnterpriseFormError] = useState("");
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [regionCode, setRegionCode] = useState("");
  const [regionName, setRegionName] = useState("");
  const [regionFormError, setRegionFormError] = useState("");
  const [showClusterForm, setShowClusterForm] = useState(false);
  const [clusterCode, setClusterCode] = useState("");
  const [clusterName, setClusterName] = useState("");
  const [clusterFormError, setClusterFormError] = useState("");
  const [showInstitutionForm, setShowInstitutionForm] = useState(false);
  const [institutionCode, setInstitutionCode] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [institutionType, setInstitutionType] = useState("");
  const [institutionFormError, setInstitutionFormError] = useState("");

  const createEnterpriseMutation = useMutation({
    mutationFn: () =>
      organizationService.createEnterprise({
        code: enterpriseCode.trim(),
        name: enterpriseName.trim(),
      }),
    onSuccess: async (createdEnterprise) => {
      await enterprisesQuery.refetch();
      setSelection({
        enterprise: createdEnterprise,
        region: null,
        cluster: null,
        institution: null,
      });
      setEnterpriseCode("");
      setEnterpriseName("");
      setEnterpriseFormError("");
      setShowEnterpriseForm(false);
    },
    onError: (error: unknown) => {
      setEnterpriseFormError(
        error instanceof Error ? error.message : "Unable to create enterprise.",
      );
    },
  });

  const regionsQuery = useRegions(
    canReadRegions ? selection.enterprise?.id : undefined,
  );

  const createRegionMutation = useMutation({
    mutationFn: () => {
      if (!selection.enterprise) {
        throw new Error("Select an enterprise before creating a region.");
      }

      return organizationService.createRegion({
        enterpriseId: selection.enterprise.id,
        code: regionCode.trim(),
        name: regionName.trim(),
      });
    },
    onSuccess: async (createdRegion) => {
      await regionsQuery.refetch();
      setSelection({
        enterprise: selection.enterprise,
        region: createdRegion,
        cluster: null,
        institution: null,
      });
      setRegionCode("");
      setRegionName("");
      setRegionFormError("");
      setShowRegionForm(false);
    },
    onError: (error: unknown) => {
      setRegionFormError(
        error instanceof Error ? error.message : "Unable to create region.",
      );
    },
  });

  const clustersQuery = useClusters(
    canReadClusters ? selection.region?.id : undefined,
  );

  const institutionsQuery = useInstitutions(
    canReadInstitutions ? selection.cluster?.id ?? "" : "",
  );

  const createClusterMutation = useMutation({
    mutationFn: () => {
      if (!selection.region) {
        throw new Error("Select a region before creating a cluster.");
      }
      return organizationService.createCluster({
        regionId: selection.region.id,
        code: clusterCode.trim(),
        name: clusterName.trim(),
      });
    },
    onSuccess: async (createdCluster) => {
      await clustersQuery.refetch();
      setSelection((current) => ({
        ...current,
        cluster: createdCluster,
        institution: null,
      }));
      setClusterCode("");
      setClusterName("");
      setClusterFormError("");
      setShowClusterForm(false);
    },
    onError: (error: unknown) => {
      setClusterFormError(
        error instanceof Error ? error.message : "Unable to create cluster.",
      );
    },
  });

  const createInstitutionMutation = useMutation({
    mutationFn: () => {
      if (!selection.cluster) {
        throw new Error("Select a cluster before creating an institution.");
      }
      return organizationService.createInstitution({
        clusterId: selection.cluster.id,
        code: institutionCode.trim(),
        name: institutionName.trim(),
        institutionType: institutionType.trim(),
      });
    },
    onSuccess: async (createdInstitution) => {
      await institutionsQuery.refetch();
      setSelection((current) => ({
        ...current,
        institution: createdInstitution,
      }));
      setInstitutionCode("");
      setInstitutionName("");
      setInstitutionType("");
      setInstitutionFormError("");
      setShowInstitutionForm(false);
    },
    onError: (error: unknown) => {
      setInstitutionFormError(
        error instanceof Error ? error.message : "Unable to create institution.",
      );
    },
  });

  function submitEnterprise() {
    if (!enterpriseCode.trim() || !enterpriseName.trim()) {
      setEnterpriseFormError("Enter both an enterprise code and name.");
      return;
    }
    setEnterpriseFormError("");
    createEnterpriseMutation.mutate();
  }

  function submitRegion() {
    if (!selection.enterprise) {
      setRegionFormError("Select an enterprise before creating a region.");
      return;
    }
    if (!regionCode.trim() || !regionName.trim()) {
      setRegionFormError("Enter both a region code and name.");
      return;
    }
    setRegionFormError("");
    createRegionMutation.mutate();
  }

  function submitCluster() {
    if (!selection.region) {
      setClusterFormError("Select a region before creating a cluster.");
      return;
    }
    if (!clusterCode.trim() || !clusterName.trim()) {
      setClusterFormError("Enter both a cluster code and name.");
      return;
    }
    setClusterFormError("");
    createClusterMutation.mutate();
  }

  function submitInstitution() {
    if (!selection.cluster) {
      setInstitutionFormError("Select a cluster before creating an institution.");
      return;
    }
    if (!institutionCode.trim() || !institutionName.trim() || !institutionType.trim()) {
      setInstitutionFormError("Enter an institution code, name, and type.");
      return;
    }
    setInstitutionFormError("");
    createInstitutionMutation.mutate();
  }

  function selectEnterprise(enterprise: Enterprise) {
    setSelection({
      enterprise,
      region: null,
      cluster: null,
      institution: null,
    });
  }

  function selectRegion(region: Region) {
    setSelection((current) => ({
      ...current,
      region,
      cluster: null,
      institution: null,
    }));
  }

  function selectCluster(cluster: Cluster) {
    setSelection((current) => ({
      ...current,
      cluster,
      institution: null,
    }));
  }

  function selectInstitution(institution: Institution) {
    setSelection((current) => ({
      ...current,
      institution,
    }));
  }

  function resetFrom(level: keyof OrganizationSelection) {
    setSelection((current) => {
      const next = { ...current };

      switch (level) {
        case "enterprise":
          next.enterprise = null;
          next.region = null;
          next.cluster = null;
          next.institution = null;
          break;

        case "region":
          next.region = null;
          next.cluster = null;
          next.institution = null;
          break;

        case "cluster":
          next.cluster = null;
          next.institution = null;
          break;

        case "institution":
          next.institution = null;
          break;
      }

      return next;
    });
  }

  return (
    <main className="org-page">
      <header className="org-page-header">
        <div>
          <p className="org-eyebrow">WORKSPACE</p>
          <h1>Organization</h1>
          <p className="org-page-description">
            Explore and manage the hierarchy from enterprise to institution.
          </p>
        </div>

        <div className="org-header-actions">

          <div className="org-header-icon" aria-hidden="true">
            <Building2 size={25} />
          </div>
        </div>
      </header>

      <nav className="org-breadcrumb" aria-label="Organization hierarchy">
        {selection.enterprise ? (
          <button type="button" onClick={() => resetFrom("enterprise")}>
            Enterprises
          </button>
        ) : (
          <strong>Enterprises</strong>
        )}

        {selection.enterprise && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            {selection.region ? (
              <button type="button" onClick={() => resetFrom("region")}>
                {selection.enterprise.name}
              </button>
            ) : (
              <strong>{selection.enterprise.name}</strong>
            )}
          </>
        )}

        {selection.region && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            {selection.cluster ? (
              <button type="button" onClick={() => resetFrom("cluster")}>
                {selection.region.name}
              </button>
            ) : (
              <strong>{selection.region.name}</strong>
            )}
          </>
        )}

        {selection.cluster && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            {selection.institution ? (
              <button type="button" onClick={() => resetFrom("institution")}>
                {selection.cluster.name}
              </button>
            ) : (
              <strong>{selection.cluster.name}</strong>
            )}
          </>
        )}

        {selection.institution && (
          <>
            <ChevronRight size={14} aria-hidden="true" />
            <strong>{selection.institution.name}</strong>
          </>
        )}

      </nav>

      <div className="org-columns">
        <EntityList
          title="Enterprises"
          description="Top-level organizations"
          icon={Building2}
          actions={
            <EnterpriseCreateForm
              canCreate={canCreateEnterprise}
              isOpen={showEnterpriseForm}
              code={enterpriseCode}
              name={enterpriseName}
              error={enterpriseFormError}
              isSubmitting={createEnterpriseMutation.isPending}
              onOpen={() => {
                setEnterpriseFormError("");
                setShowEnterpriseForm(true);
              }}
              onCodeChange={setEnterpriseCode}
              onNameChange={setEnterpriseName}
              onSubmit={submitEnterprise}
              onCancel={() => {
                setShowEnterpriseForm(false);
                setEnterpriseCode("");
                setEnterpriseName("");
                setEnterpriseFormError("");
              }}
            />
          }
          items={enterprisesQuery.data}
          selectedId={selection.enterprise?.id ?? null}
          canView={true}
          requiredPermission="ENTERPRISE_READ"
          isLoading={enterprisesQuery.isPending}
          isError={enterprisesQuery.isError}
          onRetry={() => void enterprisesQuery.refetch()}
          onSelect={selectEnterprise}
          emptyMessage="No enterprises are available to your account."
        />

        {selection.enterprise && (
          <EntityList
            title="Regions"
            description={`Under ${selection.enterprise.name}`}
            icon={Globe2}
            items={regionsQuery.data}
            selectedId={selection.region?.id ?? null}
            canView={canReadRegions}
            requiredPermission="REGION_READ"
            isLoading={regionsQuery.isPending}
            isError={regionsQuery.isError}
            onRetry={() => void regionsQuery.refetch()}
            onSelect={selectRegion}
            emptyMessage="This enterprise has no regions, or none are visible to your account."
            actions={
              canCreateRegion ? (
                <RegionCreateForm
                  enterpriseName={selection.enterprise.name}
                  isOpen={showRegionForm}
                  code={regionCode}
                  name={regionName}
                  error={regionFormError}
                  isSubmitting={createRegionMutation.isPending}
                  onOpen={() => {
                    setRegionFormError("");
                    setShowRegionForm(true);
                  }}
                  onCodeChange={setRegionCode}
                  onNameChange={setRegionName}
                  onSubmit={submitRegion}
                  onCancel={() => {
                    setShowRegionForm(false);
                    setRegionCode("");
                    setRegionName("");
                    setRegionFormError("");
                  }}
                />
              ) : null
            }
          />
        )}

        {selection.region && (
          <EntityList
            title="Clusters"
            description={`Under ${selection.region.name}`}
            icon={Layers3}
            items={clustersQuery.data}
            selectedId={selection.cluster?.id ?? null}
            canView={canReadClusters}
            requiredPermission="CLUSTER_READ"
            isLoading={clustersQuery.isPending}
            isError={clustersQuery.isError}
            onRetry={() => void clustersQuery.refetch()}
            onSelect={selectCluster}
            emptyMessage="This region has no clusters, or none are visible to your account."
            actions={
              canCreateCluster ? (
                <ClusterCreateForm
                  regionName={selection.region.name}
                  isOpen={showClusterForm}
                  code={clusterCode}
                  name={clusterName}
                  error={clusterFormError}
                  isSubmitting={createClusterMutation.isPending}
                  onOpen={() => {
                    setClusterFormError("");
                    setShowClusterForm(true);
                  }}
                  onCodeChange={setClusterCode}
                  onNameChange={setClusterName}
                  onSubmit={submitCluster}
                  onCancel={() => {
                    setShowClusterForm(false);
                    setClusterCode("");
                    setClusterName("");
                    setClusterFormError("");
                  }}
                />
              ) : null
            }
          />
        )}

        {selection.cluster && (
          <EntityList
            title="Institutions"
            description={`Under ${selection.cluster.name}`}
            icon={School}
            items={institutionsQuery.data}
            selectedId={selection.institution?.id ?? null}
            canView={canReadInstitutions}
            requiredPermission="INSTITUTION_READ"
            isLoading={institutionsQuery.isPending}
            isError={institutionsQuery.isError}
            onRetry={() => void institutionsQuery.refetch()}
            onSelect={selectInstitution}
            emptyMessage="This cluster has no institutions, or none are visible to your account."
            actions={
              canCreateInstitution ? (
                <InstitutionCreateForm
                  clusterName={selection.cluster.name}
                  isOpen={showInstitutionForm}
                  code={institutionCode}
                  name={institutionName}
                  institutionType={institutionType}
                  error={institutionFormError}
                  isSubmitting={createInstitutionMutation.isPending}
                  onOpen={() => {
                    setInstitutionFormError("");
                    setShowInstitutionForm(true);
                  }}
                  onCodeChange={setInstitutionCode}
                  onNameChange={setInstitutionName}
                  onInstitutionTypeChange={setInstitutionType}
                  onSubmit={submitInstitution}
                  onCancel={() => {
                    setShowInstitutionForm(false);
                    setInstitutionCode("");
                    setInstitutionName("");
                    setInstitutionType("");
                    setInstitutionFormError("");
                  }}
                />
              ) : null
            }
          />
        )}

      </div>

      {selection.cluster && !selection.institution && (
        <OrganizationSelectionSummary
          icon={Layers3}
          label="SELECTED CLUSTER"
          name={selection.cluster.name}
          code={selection.cluster.code}
          active={selection.cluster.active}
          detailHref={`/organization/clusters/${selection.cluster.id}`}
        />
      )}

      {selection.institution && (
        <OrganizationSelectionSummary
          icon={School}
          label="SELECTED INSTITUTION"
          name={selection.institution.name}
          code={selection.institution.code}
          secondaryDetail={selection.institution.institutionType}
          active={selection.institution.active}
          detailHref={`/organization/institutions/${selection.institution.id}`}
        />
      )}

    </main>
  );
}
