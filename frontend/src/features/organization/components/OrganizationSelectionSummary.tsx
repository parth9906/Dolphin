import { Link } from "react-router-dom";
import { ChevronRight, type LucideIcon } from "lucide-react";

type OrganizationSelectionSummaryProps = {
  icon: LucideIcon;
  label: string;
  name: string;
  code: string;
  secondaryDetail?: string;
  active: boolean;
  detailHref: string;
};

export function OrganizationSelectionSummary({
  icon: Icon,
  label,
  name,
  code,
  secondaryDetail,
  active,
  detailHref,
}: OrganizationSelectionSummaryProps) {
  return (
    <section className="org-selection-summary">
      <div className="org-selection-summary__icon" aria-hidden="true">
        <Icon size={20} />
      </div>

      <div className="org-selection-summary__content">
        <span className="org-selection-summary__label">{label}</span>
        <strong>{name}</strong>
        <span className="org-selection-summary__code">
          {code}
          {secondaryDetail ? ` · ${secondaryDetail}` : ""} · {active ? "Active" : "Inactive"}
        </span>
      </div>

      <Link to={detailHref} className="org-button org-button-secondary">
        Details
        <ChevronRight size={15} />
      </Link>
    </section>
  );
}
