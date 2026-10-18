import { Download, Eye, FileText } from "lucide-react";
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

interface IssuedDocumentListProps {
  documents: IssuedDocument[];
  onView: (document: IssuedDocument) => void;
  onPrint: (document: IssuedDocument) => void;
  onDownload: (document: IssuedDocument) => void;
}

export function IssuedDocumentList({
  documents,
  onView,
  onPrint,
  onDownload,
}: IssuedDocumentListProps) {
  return (
    <div className="cert-document-list">
      {documents.map((item) => (
        <article className="cert-document-row" key={item.id}>
          <span className="cert-template-icon"><FileText size={20} /></span>
          <div className="cert-document-row__body">
            <strong>{item.title}</strong>
            <span>{item.templateName}</span>
            <small>Issued {dateLabel(item.issuedAt)}</small>
          </div>
          <div className="cert-document-row__actions">
            <button type="button" className="cert-secondary-button" onClick={() => onView(item)}>
              <Eye size={15} /> View
            </button>
            <button type="button" className="cert-secondary-button" onClick={() => onPrint(item)}>
              <FileText size={15} /> Print / PDF
            </button>
            <button type="button" className="cert-secondary-button" onClick={() => onDownload(item)}>
              <Download size={15} /> Download text
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
