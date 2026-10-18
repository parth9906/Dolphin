import { AlertCircle, CheckCircle2 } from "lucide-react";

interface TimetablePageAlertsProps {
  pageError: string;
  pageNotice: string;
  dashboardErrorMessage: string;
  onDismissError: () => void;
  onDismissNotice: () => void;
  onRetryDashboard: () => void;
}

export function TimetablePageAlerts({
  pageError,
  pageNotice,
  dashboardErrorMessage,
  onDismissError,
  onDismissNotice,
  onRetryDashboard,
}: TimetablePageAlertsProps) {
  return (
    <>
      {pageError && (
        <div className="timetable-alert timetable-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{pageError}</span>
          <button type="button" onClick={onDismissError} aria-label="Dismiss error">×</button>
        </div>
      )}
      {pageNotice && (
        <div className="timetable-alert timetable-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{pageNotice}</span>
          <button type="button" onClick={onDismissNotice} aria-label="Dismiss message">×</button>
        </div>
      )}
      {dashboardErrorMessage && (
        <div className="timetable-alert timetable-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{dashboardErrorMessage}</span>
          <button type="button" onClick={onRetryDashboard}>Retry</button>
        </div>
      )}
    </>
  );
}
