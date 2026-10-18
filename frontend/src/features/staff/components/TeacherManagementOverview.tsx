import {
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  CircleUserRound,
  GraduationCap,
  Users,
  X,
} from "lucide-react";

interface TeacherManagementOverviewProps {
  institution: { name: string } | null;
  canReadStaff: boolean;
  matchingAssignments: number;
  activeAssignmentsOnPage: number | null;
  assignmentStatusLabel: string;
  onboardingResult: {
    username: string;
    roleCode: string;
    staffStatusLabel: string;
    summary: string;
  } | null;
  onDismissOnboardingResult: () => void;
}

export function TeacherManagementOverview({
  institution,
  canReadStaff,
  matchingAssignments,
  activeAssignmentsOnPage,
  assignmentStatusLabel,
  onboardingResult,
  onDismissOnboardingResult,
}: TeacherManagementOverviewProps) {
  return (
    <>
      <section className="tm-context-card">
        <span className="tm-context-icon">
          <GraduationCap size={21} />
        </span>
        <div className="tm-context-copy">
          <span>Current institution</span>
          <strong>{institution?.name ?? "No institution selected"}</strong>
        </div>
        <span
          className={
            institution
              ? "tm-context-status tm-context-status--ready"
              : "tm-context-status"
          }
        >
          {institution ? "Selected" : "Required"}
        </span>
      </section>

      {!institution && (
        <section className="tm-empty-state">
          <BriefcaseBusiness size={30} />
          <h2>Select an institution</h2>
          <p>
            Teacher onboarding is institution-scoped. Choose an institution
            in Dolphin's organization selection before continuing.
          </p>
        </section>
      )}

      {institution && (
        <>
          <section className="tm-metrics">
            <div className="tm-metric">
              <span className="tm-metric-icon">
                <Users size={19} />
              </span>
              <div>
                <span>Matching assignments</span>
                <strong>{canReadStaff ? matchingAssignments : "—"}</strong>
              </div>
            </div>

            <div className="tm-metric">
              <span className="tm-metric-icon tm-metric-icon--green">
                <CircleUserRound size={19} />
              </span>
              <div>
                <span>Active on this page</span>
                <strong>{activeAssignmentsOnPage ?? "—"}</strong>
              </div>
            </div>

            <div className="tm-metric">
              <span className="tm-metric-icon tm-metric-icon--purple">
                <CalendarDays size={19} />
              </span>
              <div>
                <span>Assignment status</span>
                <strong>{assignmentStatusLabel}</strong>
              </div>
            </div>
          </section>

          {onboardingResult && (
            <section className="tm-result-card">
              <span className="tm-result-icon">
                <CheckCircle2 size={22} />
              </span>
              <div className="tm-result-copy">
                <span className="tm-eyebrow">ONBOARDING COMPLETE</span>
                <h2>{onboardingResult.username} was onboarded</h2>
                <p>{onboardingResult.summary}</p>
                <div className="tm-result-meta">
                  <span>
                    Role: <strong>{onboardingResult.roleCode}</strong>
                  </span>
                  <span>
                    Staff status: <strong>{onboardingResult.staffStatusLabel}</strong>
                  </span>
                </div>
              </div>
              <button
                type="button"
                className="tm-result-dismiss"
                aria-label="Dismiss onboarding result"
                onClick={onDismissOnboardingResult}
              >
                <X size={17} />
              </button>
            </section>
          )}
        </>
      )}
    </>
  );
}
