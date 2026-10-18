import { Clock3 } from "lucide-react";

import type {
  LessonOccurrence,
  ScheduledLesson,
} from "../api/attendance-types";
import { displayDate, displayTime } from "./attendance-page-utils";

interface AttendanceLessonSummaryProps {
  occurrence: LessonOccurrence;
  lesson?: ScheduledLesson;
}

export function AttendanceLessonSummary({
  occurrence,
  lesson,
}: AttendanceLessonSummaryProps) {
  return (
    <div className="attendance-lesson-summary">
      <div className="attendance-lesson-summary__icon" aria-hidden="true">
        <Clock3 size={20} />
      </div>
      <div className="attendance-lesson-summary__main">
        <strong>{lesson?.subjectName ?? "Scheduled lesson"}</strong>
        <span>
          {displayDate(occurrence.lessonDate)} · {displayTime(occurrence.startTime)}–
          {displayTime(occurrence.endTime)}
        </span>
      </div>
      <div className="attendance-lesson-summary__details">
        {lesson?.teacherName && <span>{lesson.teacherName}</span>}
        {lesson?.roomName && <span>Room {lesson.roomName}</span>}
        <span className="attendance-status-pill">
          {occurrence.status.replaceAll("_", " ")}
        </span>
      </div>
    </div>
  );
}
