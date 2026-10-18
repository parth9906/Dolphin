import { AlertCircle, CheckCircle2, ClipboardCheck } from "lucide-react";

type AttendanceMode = "daily" | "lesson";

type AttendancePageHeaderProps = {
  attendanceMode: AttendanceMode;
  canReadDailyAttendance: boolean;
  canReadLessonAttendance: boolean;
  queryError: string;
  notice: string;
  formError: string;
  onModeChange: (mode: AttendanceMode) => void | Promise<void>;
  onRetry: () => void;
};

export function AttendancePageHeader({
  attendanceMode,
  canReadDailyAttendance,
  canReadLessonAttendance,
  queryError,
  notice,
  formError,
  onModeChange,
  onRetry,
}: AttendancePageHeaderProps) {
  return (
    <>
      <header className="attendance-page__header">
        <div>
          <p className="attendance-page__eyebrow">ACADEMIC MANAGEMENT</p>
          <h1>Attendance</h1>
          <p className="attendance-page__subtitle">
            {attendanceMode === "daily"
              ? "Mark and review section-wide attendance for a selected date."
              : "Review a lesson roster and record student attendance."}
          </p>
        </div>

        <div className="attendance-page__header-icon" aria-hidden="true">
          <ClipboardCheck size={26} />
        </div>
      </header>

      <div className="attendance-mode-switch" role="group" aria-label="Attendance mode">
        {canReadDailyAttendance && (
          <button
            type="button"
            className={attendanceMode === "daily" ? "attendance-primary-button" : "attendance-secondary-button"}
            aria-pressed={attendanceMode === "daily"}
            onClick={() => { void onModeChange("daily"); }}
          >
            Daily / Section-wise attendance
          </button>
        )}
        {canReadLessonAttendance && (
          <button
            type="button"
            className={attendanceMode === "lesson" ? "attendance-primary-button" : "attendance-secondary-button"}
            aria-pressed={attendanceMode === "lesson"}
            onClick={() => { void onModeChange("lesson"); }}
          >
            Lesson-wise attendance
          </button>
        )}
      </div>

      {queryError && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{queryError}</span>
          <button type="button" className="attendance-text-button" onClick={onRetry}>
            Retry
          </button>
        </div>
      )}

      {notice && (
        <div className="attendance-alert attendance-alert--success" role="status">
          <CheckCircle2 size={18} />
          <span>{notice}</span>
        </div>
      )}

      {formError && (
        <div className="attendance-alert attendance-alert--error" role="alert">
          <AlertCircle size={18} />
          <span>{formError}</span>
        </div>
      )}
    </>
  );
}
