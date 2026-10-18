import type { FormEvent } from "react";

type ClusterCreateFormProps = {
  regionName: string;
  isOpen: boolean;
  code: string;
  name: string;
  error: string;
  isSubmitting: boolean;
  onOpen: () => void;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function ClusterCreateForm({
  regionName,
  isOpen,
  code,
  name,
  error,
  isSubmitting,
  onOpen,
  onCodeChange,
  onNameChange,
  onSubmit,
  onCancel,
}: ClusterCreateFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit();
  }

  if (!isOpen) {
    return (
      <div className="org-create-action">
        <button type="button" className="org-button org-button-secondary" onClick={onOpen}>
          Create cluster
        </button>
      </div>
    );
  }

  return (
    <div className="org-create-action is-open">
      <form className="org-create-form" onSubmit={handleSubmit} noValidate aria-label="Create cluster">
        <strong>New cluster</strong>
        <p className="org-create-form-context">Under {regionName}</p>
        <label>
          Cluster code
          <input
            value={code}
            onChange={(event) => onCodeChange(event.target.value)}
            maxLength={50}
            required
            autoComplete="off"
            disabled={isSubmitting}
            placeholder="e.g. CLUSTER-NORTH-01"
            aria-invalid={Boolean(error)}
          />
        </label>
        <label>
          Cluster name
          <input
            value={name}
            onChange={(event) => onNameChange(event.target.value)}
            maxLength={200}
            required
            autoComplete="organization"
            disabled={isSubmitting}
            placeholder="e.g. North Cluster"
            aria-invalid={Boolean(error)}
          />
        </label>
        {error && <p className="org-create-form-error" role="alert">{error}</p>}
        <div className="org-create-form-actions">
          <button type="button" className="org-button org-button-secondary" disabled={isSubmitting} onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="org-button org-button-primary" disabled={isSubmitting || !code.trim() || !name.trim()}>
            {isSubmitting ? "Creating…" : "Create cluster"}
          </button>
        </div>
      </form>
    </div>
  );
}
