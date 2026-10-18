import { AlertCircle, LoaderCircle, RefreshCw } from "lucide-react";

interface AcademicQueryErrorProps {
  message: string;
  retrying: boolean;
  onRetry: () => void;
  retryLabel: string;
}

export function AcademicQueryError({
  message,
  retrying,
  onRetry,
  retryLabel,
}: AcademicQueryErrorProps) {
  if (!message) return null;

  return (
    <div className="academic-alert academic-alert--error academic-query-error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
      <span>{message}</span>
      <button
        type="button"
        className="academic-secondary-button academic-query-error__retry"
        onClick={onRetry}
        disabled={retrying}
        aria-label={`${retrying ? "Retrying" : "Retry"} ${retryLabel}`}
      >
        {retrying
          ? <LoaderCircle size={15} className="academic-spin" aria-hidden="true" />
          : <RefreshCw size={15} aria-hidden="true" />}
        {retrying ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
