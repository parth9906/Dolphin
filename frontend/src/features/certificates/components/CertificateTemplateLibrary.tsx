import { FileText, Send } from "lucide-react";
import type { DocumentTemplate } from "../api/certificate-types";

interface CertificateTemplateLibraryProps {
  templates: DocumentTemplate[];
  canIssue: boolean;
  onUseTemplate: (template: DocumentTemplate) => void;
}

export function CertificateTemplateLibrary({
  templates,
  canIssue,
  onUseTemplate,
}: CertificateTemplateLibraryProps) {
  return (
    <>
      <div className="cert-count">
        {templates.length} active template{templates.length === 1 ? "" : "s"}
      </div>
      {templates.length === 0 ? (
        <div className="cert-empty">
          <div className="cert-empty__icon"><FileText size={23} /></div>
          <strong>No templates yet</strong>
          <p>Create a template to start issuing certificates and other school documents.</p>
        </div>
      ) : (
        <div className="cert-template-grid">
          {templates.map((template) => (
            <article className="cert-template-card" key={template.id}>
              <div className="cert-template-card__top">
                <span className="cert-template-icon"><FileText size={20} /></span>
                <span className="cert-active-badge">Active</span>
              </div>
              <h3>{template.name}</h3>
              <span className="cert-template-code">{template.code}</span>
              <p>{template.body}</p>
              {canIssue && (
                <button
                  type="button"
                  className="cert-secondary-button"
                  onClick={() => onUseTemplate(template)}
                >
                  <Send size={15} /> Use this template
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </>
  );
}
