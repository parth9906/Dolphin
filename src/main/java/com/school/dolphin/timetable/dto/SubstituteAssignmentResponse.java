package com.school.dolphin.timetable.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.timetable.entity.LessonOccurrenceStatus;

public record SubstituteAssignmentResponse(
        UUID occurrenceId,
        UUID scheduledLessonId,
        LocalDate lessonDate,
        LocalTime startTime,
        LocalTime endTime,
        UUID originalTeacherAssignmentId,
        UUID substituteStaffAssignmentId,
        UUID assignedByUserId,
        OffsetDateTime substituteAssignedAt,
        LessonOccurrenceStatus status) {
}