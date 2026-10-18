import { X } from "lucide-react";

import "../pages/certificates-page.css";

export function TemplatePreview({
  name,
  body,
  onClose,
}: {
  name: string;
  body: string;
  onClose: () => void;
}) {
  const sampleDate = new Date().toLocaleDateString();

  const previewContent = body
    .replaceAll("{{student_name}}", "Alex Johnson")
    .replaceAll("{{student_id}}", "SAMPLE-STUDENT-ID")
    .replaceAll("{{admission_number}}", "ADM-2026-001")
    .replaceAll("{{institution_name}}", "Sample Institution")
    .replaceAll("{{issue_date}}", sampleDate);

  return (
    <section className="cert-preview" aria-label="Certificate template preview">
      <header className="cert-preview__header">
        <div>
          <span className="cert-eyebrow">TEMPLATE PREVIEW</span>
          <h2>{name.trim() || "Untitled certificate"}</h2>
          <p>Preview with sample student and institution details.</p>
        </div>
        <button
          className="cert-icon-button"
          type="button"
          onClick={onClose}
          aria-label="Close template preview"
        >
          <X size={18} />
        </button>
      </header>

      <article className="cert-document-paper">
        <div className="cert-document-paper__brand">
          DOLPHIN · SAMPLE DOCUMENT
        </div>
        <h3>{name.trim() || "Certificate preview"}</h3>
        <div className="cert-document-paper__content">{previewContent}</div>
        <div className="cert-document-paper__footer">
          <span>Template preview — not issued</span>
          <span>Sample date: {sampleDate}</span>
        </div>
      </article>

      <div className="cert-preview__actions">
        <button
          className="cert-secondary-button"
          type="button"
          onClick={onClose}
        >
          Close preview
        </button>
      </div>
      <p className="cert-preview__note">
        These are sample values only. The existing backend fills placeholders
        with actual student and institution information when a document is issued.
      </p>
    </section>
  );
}

