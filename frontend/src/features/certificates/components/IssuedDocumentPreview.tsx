import { Download, FileText, X } from "lucide-react";
import { showInformationDialog } from "../../../lib/ui/dialogs";
import type { IssuedDocument } from "../api/certificate-types";

function dateLabel(value: string | null | undefined): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function downloadIssuedDocumentText(document: IssuedDocument): void {
  const fileContent =
    `${document.title}\n` +
    `Issued: ${dateLabel(document.issuedAt)}\n` +
    `Template: ${document.templateName}\n\n` +
    `${document.content}\n`;

  const blob = new Blob([fileContent], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = window.document.createElement("a");
  const safeName = document.title
    .trim()
    .replace(/[^a-z0-9-_]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "issued-document";

  link.href = url;
  link.download = `${safeName}.txt`;
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function printIssuedDocument(document: IssuedDocument): void {
  const printWindow = window.open("", "_blank");

  if (!printWindow) {
    showInformationDialog({
      title: "Pop-up blocked",
      text: "Allow pop-ups for this site, then try printing or saving the document as PDF again.",
    });
    return;
  }

  const printDocument = printWindow.document;
  printDocument.title = document.title;

  const viewport = printDocument.createElement("meta");
  viewport.name = "viewport";
  viewport.content = "width=device-width, initial-scale=1";

  const style = printDocument.createElement("style");
  style.textContent = `
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px;
      background: #f1f4f8;
      color: #172033;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .paper {
      max-width: 850px;
      min-height: 700px;
      margin: 0 auto;
      padding: 64px 72px;
      background: #fff;
      border: 1px solid #dfe4ec;
      box-shadow: 0 12px 40px rgba(23, 32, 51, .08);
    }
    .brand {
      padding-bottom: 18px;
      border-bottom: 2px solid #3157d5;
      color: #3157d5;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 2px;
    }
    h1 {
      margin: 38px 0 12px;
      font-size: 28px;
      line-height: 1.3;
      overflow-wrap: anywhere;
    }
    .meta {
      color: #667085;
      font-size: 12px;
      line-height: 1.7;
    }
    .content {
      margin-top: 42px;
      font-size: 15px;
      line-height: 1.9;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .footer {
      margin-top: 64px;
      padding-top: 16px;
      border-top: 1px solid #e4e7ec;
      color: #667085;
      font-size: 11px;
      line-height: 1.7;
    }
    @page { size: A4; margin: 18mm; }
    @media print {
      body { padding: 0; background: #fff; }
      .paper {
        max-width: none;
        min-height: 0;
        margin: 0;
        padding: 0;
        border: 0;
        box-shadow: none;
      }
      h1 { margin-top: 24px; }
      .content { margin-top: 28px; }
      .footer { margin-top: 42px; }
    }
  `;

  printDocument.head.append(viewport, style);

  const paper = printDocument.createElement("main");
  paper.className = "paper";

  const brand = printDocument.createElement("div");
  brand.className = "brand";
  brand.textContent = "DOLPHIN · SCHOOL DOCUMENT";

  const heading = printDocument.createElement("h1");
  heading.textContent = document.title;

  const meta = printDocument.createElement("div");
  meta.className = "meta";
  meta.textContent =
    `${document.templateName} · Issued ${dateLabel(document.issuedAt)}`;

  const content = printDocument.createElement("div");
  content.className = "content";
  content.textContent = document.content;

  const footer = printDocument.createElement("footer");
  footer.className = "footer";
  footer.textContent =
    `Template: ${document.templateName}\nIssued: ${dateLabel(document.issuedAt)}`;

  paper.append(brand, heading, meta, content, footer);
  printDocument.body.replaceChildren(paper);

  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 250);
}

export function IssuedDocumentPreview({
  document,
  onClose,
}: {
  document: IssuedDocument;
  onClose: () => void;
}) {
  return (
    <section className="cert-preview">
      <header className="cert-preview__header">
        <div>
          <span className="cert-eyebrow">DOCUMENT PREVIEW</span>
          <h2>{document.title}</h2>
          <p>{document.templateName} · Issued {dateLabel(document.issuedAt)}</p>
        </div>
        <button className="cert-icon-button" type="button" onClick={onClose} aria-label="Close preview">
          <X size={18} />
        </button>
      </header>
      <article className="cert-document-paper">
        <div className="cert-document-paper__brand">DOLPHIN · SCHOOL DOCUMENT</div>
        <h3>{document.title}</h3>
        <div className="cert-document-paper__content">{document.content}</div>
        <div className="cert-document-paper__footer">
          <span>Template: {document.templateName}</span>
          <span>Issued: {dateLabel(document.issuedAt)}</span>
        </div>
      </article>
      <div className="cert-preview__actions">
        <button className="cert-secondary-button" type="button" onClick={onClose}>Close preview</button>
        <button
          className="cert-secondary-button"
          type="button"
          onClick={() => printIssuedDocument(document)}
        >
          <FileText size={16} /> Print / Save as PDF
        </button>
        <button
          className="cert-primary-button"
          type="button"
          onClick={() => downloadIssuedDocumentText(document)}
        >
          <Download size={16} /> Download text
        </button>
      </div>
      <p className="cert-preview__note">
        The current backend stores rendered document text only. PDF rendering and binary attachments are not available yet.
      </p>
    </section>
  );
}
