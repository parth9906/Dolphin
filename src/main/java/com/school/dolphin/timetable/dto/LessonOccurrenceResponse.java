package com.school.dolphin.timetable.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;

public record LessonOccurrenceResponse(
        UUID id,
        UUID scheduledLessonId,
        UUID sectionId,
        UUID teacherAssignmentId,
        UUID subjectId,
        UUID roomId,
        LocalDate lessonDate,
        LocalTime startTime,
        LocalTime endTime,
        LessonOccurrenceStatus status,
        UUID substituteStaffAssignmentId) {
}
