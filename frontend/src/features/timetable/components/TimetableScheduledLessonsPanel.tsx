import type { Dispatch, FormEventHandler, SetStateAction } from "react";
import { CalendarDays, LoaderCircle, Plus, RefreshCw, Trash2 } from "lucide-react";

import { Dropdown, Empty, type Option } from "./TimetableControls";
import type { ScheduledLesson } from "../api/timetable-types";

type TimetableScheduledLessonsPanelProps = {
  sectionId: string;
  yearId: string;
  lessons: ScheduledLesson[];
  canRead: boolean;
  canCreate: boolean;
  canCancel: boolean;
  canSlotRead: boolean;
  canStaffRead: boolean;
  canAssignmentRead: boolean;
  canRoomRead: boolean;
  saving: boolean;
  loading: boolean;
  isError: boolean;
  errorMessage: string;
  slotOptions: Option[];
  slotsLoading: boolean;
  teacherOptions: Option[];
  staffLoading: boolean;
  lessonSubjectOptions: Option[];
  assignmentsLoading: boolean;
  roomOptions: Option[];
  roomsLoading: boolean;
  lessonSlotId: string;
  setLessonSlotId: Dispatch<SetStateAction<string>>;
  lessonTeacherId: string;
  setLessonTeacherId: (value: string) => void;
  lessonSubjectId: string;
  setLessonSubjectId: Dispatch<SetStateAction<string>>;
  lessonRoomId: string;
  setLessonRoomId: Dispatch<SetStateAction<string>>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onCancelLesson: (lesson: ScheduledLesson) => void | Promise<void>;
  dayLabel: (day: number) => string;
  friendlyTime: (value: string) => string;
};

export function TimetableScheduledLessonsPanel({
  sectionId,
  yearId,
  lessons,
  canRead,
  canCreate,
  canCancel,
  canSlotRead,
  canStaffRead,
  canAssignmentRead,
  canRoomRead,
  saving,
  loading,
  isError,
  errorMessage,
  slotOptions,
  slotsLoading,
  teacherOptions,
  staffLoading,
  lessonSubjectOptions,
  assignmentsLoading,
  roomOptions,
  roomsLoading,
  lessonSlotId,
  setLessonSlotId,
  lessonTeacherId,
  setLessonTeacherId,
  lessonSubjectId,
  setLessonSubjectId,
  lessonRoomId,
  setLessonRoomId,
  onSubmit,
  onCancelLesson,
  dayLabel,
  friendlyTime,
}: TimetableScheduledLessonsPanelProps) {
  const lessonList = [...lessons].sort(
    (a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime),
  );

  return (
    <div className="timetable-workspace">
      <div className="timetable-section-heading">
        <div>
          <h2>Scheduled lessons</h2>
          <p>Assign a section, period, eligible teacher, subject and optional room.</p>
        </div>
        <span className="timetable-count">
          {lessons.length} lesson{lessons.length === 1 ? "" : "s"}
        </span>
      </div>

      {canCreate && sectionId && (
        <form className="timetable-form" onSubmit={onSubmit}>
          <h3><Plus size={17} aria-hidden="true" /> Schedule a lesson</h3>
          <div className="timetable-form-grid timetable-form-grid--three">
            <Dropdown
              label="Time slot"
              options={slotOptions}
              value={lessonSlotId}
              onChange={setLessonSlotId}
              disabled={!yearId || !canSlotRead}
              loading={slotsLoading}
              placeholder="Select time slot"
            />
            <Dropdown
              label="Teacher"
              options={teacherOptions}
              value={lessonTeacherId}
              onChange={setLessonTeacherId}
              disabled={!canStaffRead}
              loading={staffLoading}
              placeholder="Select active teacher"
            />
            <Dropdown
              label="Subject assigned to teacher"
              options={lessonSubjectOptions}
              value={lessonSubjectId}
              onChange={setLessonSubjectId}
              disabled={!lessonTeacherId || !canAssignmentRead}
              loading={assignmentsLoading}
              placeholder="Select eligible subject"
            />
            <Dropdown
              label="Room (optional)"
              options={roomOptions}
              value={lessonRoomId}
              onChange={setLessonRoomId}
              disabled={!canRoomRead}
              loading={roomsLoading}
              placeholder="No room assigned"
              clearable
            />
          </div>

          {lessonTeacherId && lessonSubjectOptions.length === 0 && (
            <div className="timetable-inline-message">
              The selected teacher has no active subject assignment. Use Teacher Assignments first.
            </div>
          )}

          {!yearId && (
            <div className="timetable-inline-message">Choose an academic year and class above first.</div>
          )}

          <div className="timetable-form-actions">
            <button
              className="timetable-primary-button"
              type="submit"
              disabled={saving || !lessonSlotId || !lessonTeacherId || !lessonSubjectId || !sectionId}
            >
              {saving ? <LoaderCircle size={16} className="timetable-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
              Schedule lesson
            </button>
          </div>
        </form>
      )}

      {!sectionId && (
        <div className="timetable-inline-message">
          Select an academic year, class and section above to view or create lessons.
        </div>
      )}
      {loading && (
        <div className="timetable-loading" role="status">
          <RefreshCw size={18} className="timetable-spin" aria-hidden="true" /> Loading scheduled lessons…
        </div>
      )}
      {isError && (
        <div className="timetable-inline-message" role="alert">{errorMessage}</div>
      )}
      {sectionId && canRead && !loading && !isError && lessons.length === 0 && (
        <Empty
          title="No scheduled lessons"
          description="Create a time slot, assign subjects to teachers, then schedule the first lesson."
        />
      )}

      {canRead && lessonList.length > 0 && (
        <div className="timetable-table-wrap">
          <table className="timetable-table">
            <caption className="timetable-sr-only">Scheduled lessons for the selected section</caption>
            <thead>
              <tr>
                <th scope="col">Weekday</th>
                <th scope="col">Time</th>
                <th scope="col">Subject</th>
                <th scope="col">Teacher</th>
                <th scope="col">Room</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {lessonList.map((lesson) => (
                <tr key={lesson.id}>
                  <td><strong>{dayLabel(lesson.dayOfWeek)}</strong></td>
                  <td>{friendlyTime(lesson.startTime)} – {friendlyTime(lesson.endTime)}</td>
                  <td>{lesson.subjectName}</td>
                  <td>{lesson.teacherName}</td>
                  <td>{lesson.roomName || "—"}</td>
                  <td>
                    {canCancel && (
                      <button
                        type="button"
                        className="timetable-danger-button"
                        disabled={saving}
                        onClick={() => void onCancelLesson(lesson)}
                        aria-label={`Cancel ${lesson.subjectName} on ${dayLabel(lesson.dayOfWeek)} at ${friendlyTime(lesson.startTime)}`}
                      >
                        <Trash2 size={14} aria-hidden="true" /> Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
