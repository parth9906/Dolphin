import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { CalendarClock, CalendarDays, RefreshCw } from "lucide-react";

import { Empty, Field } from "./TimetableControls";
import type { LessonOccurrence, ScheduledLesson } from "../api/timetable-types";

type TimetableOccurrencesPanelProps = {
  sectionId: string;
  canGenerate: boolean;
  canRead: boolean;
  saving: boolean;
  startDate: string;
  setStartDate: Dispatch<SetStateAction<string>>;
  endDate: string;
  setEndDate: Dispatch<SetStateAction<string>>;
  onGenerate: FormEventHandler<HTMLFormElement>;
  onReload: () => void;
  isFetching: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage: string;
  occurrences: LessonOccurrence[];
  lessons: ScheduledLesson[];
  formatDate: (value: string) => string;
  formatTime: (value: string) => string;
};

export function TimetableOccurrencesPanel({
  sectionId,
  canGenerate,
  canRead,
  saving,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onGenerate,
  onReload,
  isFetching,
  isLoading,
  isError,
  errorMessage,
  occurrences,
  lessons,
  formatDate,
  formatTime,
}: TimetableOccurrencesPanelProps) {
  const sortedOccurrences = [...occurrences].sort(
    (a, b) => a.lessonDate.localeCompare(b.lessonDate) || a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div>
          <h2>Lesson occurrences</h2>
          <p>Generate lesson instances from the selected section&apos;s weekly timetable.</p>
        </div>
      </div>

      {!sectionId && (
        <div className="timetable-inline-message">Select a class section above first.</div>
      )}

      {canGenerate && sectionId && (
        <form className="timetable-form" onSubmit={onGenerate}>
          <h3><CalendarClock size={17} aria-hidden="true" /> Generate occurrences</h3>
          <div className="timetable-form-grid timetable-form-grid--three">
            <Field label="Start date">
              <input
                required
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>
            <Field label="End date">
              <input
                required
                type="date"
                min={startDate}
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>
          </div>
          <p className="timetable-help">
            Only dates within this range will be generated. Check the selected section and date range before continuing.
          </p>
          <div className="timetable-form-actions">
            <button
              className="timetable-primary-button"
              type="submit"
              disabled={saving || !sectionId || endDate < startDate}
            >
              {saving
                ? <RefreshCw size={16} className="timetable-spin" aria-hidden="true" />
                : <CalendarDays size={16} aria-hidden="true" />}
              Generate occurrences
            </button>
          </div>
        </form>
      )}

      <div className="timetable-form timetable-occurrence-filters">
        <h3><CalendarDays size={17} aria-hidden="true" /> Review occurrences</h3>
        <div className="timetable-form-grid timetable-form-grid--three">
          <Field label="Start date">
            <input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </Field>
          <Field label="End date">
            <input
              type="date"
              min={startDate}
              value={endDate}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </Field>
        </div>
        <div className="timetable-form-actions">
          <button
            type="button"
            className="timetable-secondary-button"
            disabled={!sectionId || endDate < startDate || isFetching}
            onClick={onReload}
          >
            <RefreshCw size={15} className={isFetching ? "timetable-spin" : ""} aria-hidden="true" />
            Load occurrences
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="timetable-loading" role="status">
          <RefreshCw size={18} className="timetable-spin" aria-hidden="true" /> Loading occurrences…
        </div>
      )}

      {canRead && !isLoading && !isError && occurrences.length === 0 && sectionId && (
        <Empty
          title="No occurrences in this date range"
          description="Generate occurrences above after configuring scheduled lessons."
        />
      )}

      {canRead && sortedOccurrences.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Lesson occurrences for the selected section and date range</caption>
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Time</th>
                <th scope="col">Subject</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedOccurrences.map((occurrence) => {
                const lesson = lessons.find((candidate) => candidate.id === occurrence.scheduledLessonId);
                return (
                  <tr key={occurrence.id}>
                    <td><strong>{formatDate(occurrence.lessonDate)}</strong></td>
                    <td>{formatTime(occurrence.startTime)} – {formatTime(occurrence.endTime)}</td>
                    <td>{lesson?.subjectName ?? "Scheduled lesson"}</td>
                    <td><span className="timetable-status">{occurrence.status.replaceAll("_", " ")}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {isError && <div className="timetable-inline-message" role="alert">{errorMessage}</div>}
    </div>
  );
}
