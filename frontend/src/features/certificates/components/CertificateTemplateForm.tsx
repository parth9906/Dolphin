import type { FormEvent } from "react";
import { AlertCircle, CheckCircle2, Eye, LoaderCircle, X } from "lucide-react";

import "../pages/certificates-page.css";

interface CertificateTemplateFormProps {
  code: string;
  name: string;
  body: string;
  error: string;
  isSaving: boolean;
  canSave: boolean;
  isPreviewShown: boolean;
  onCodeChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onBodyChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTogglePreview: () => void;
  onClose: () => void;
}

export function CertificateTemplateForm({
  code,
  name,
  body,
  error,
  isSaving,
  canSave,
  isPreviewShown,
  onCodeChange,
  onNameChange,
  onBodyChange,
  onSubmit,
  onTogglePreview,
  onClose,
}: CertificateTemplateFormProps) {
  return (
    <section className="cert-panel cert-form-panel">
      <header className="cert-panel__header">
        <div>
          <h2>Create a document template</h2>
          <p>Template codes must be unique within an institution.</p>
        </div>
        <button className="cert-icon-button" type="button" aria-label="Close template form" onClick={onClose}>
          <X size={17} />
        </button>
      </header>
      <form className="cert-form" onSubmit={onSubmit}>
        <div className="cert-form-grid">
          <div>
            <label htmlFor="cert-code">Template code</label>
            <input id="cert-code" value={code} onChange={(event) => onCodeChange(event.target.value)} maxLength={50} placeholder="e.g. BONAFIDE" required />
          </div>
          <div>
            <label htmlFor="cert-name">Template name</label>
            <input id="cert-name" value={name} onChange={(event) => onNameChange(event.target.value)} maxLength={120} placeholder="e.g. Bonafide Certificate" required />
          </div>
        </div>
        <div>
          <label htmlFor="cert-body">Template content</label>
          <textarea id="cert-body" value={body} onChange={(event) => onBodyChange(event.target.value)} maxLength={20000} rows={8} required />
          <div className="cert-hint">{body.length.toLocaleString()} / 20,000 characters</div>
        </div>
        <div className="cert-placeholder-guide">
          <strong>Supported placeholders</strong>
          <div>
            <code>{"{{student_name}}"}</code>
            <code>{"{{student_id}}"}</code>
            <code>{"{{admission_number}}"}</code>
            <code>{"{{institution_name}}"}</code>
            <code>{"{{issue_date}}"}</code>
          </div>
        </div>
        {error && (
          <div className="cert-error" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}
        <div className="cert-form__actions">
          <button type="button" className="cert-secondary-button" onClick={onTogglePreview}>
            <Eye size={16} />
            {isPreviewShown ? "Hide preview" : "Preview template"}
          </button>
          <button type="button" className="cert-secondary-button" onClick={onClose}>Cancel</button>
          <button type="submit" className="cert-primary-button" disabled={isSaving || !canSave}>
            {isSaving ? <LoaderCircle size={16} className="cert-spin" /> : <CheckCircle2 size={16} />}
            Save template
          </button>
        </div>
      </form>
    </section>
  );
}
