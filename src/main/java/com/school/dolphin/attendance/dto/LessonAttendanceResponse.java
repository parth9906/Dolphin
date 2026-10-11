package com.school.dolphin.attendance.dto;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.attendance.entity.LessonAttendanceStatus;

public record LessonAttendanceResponse(
        UUID id,
        UUID occurrenceId,
        UUID studentId,
        String studentName,
        LocalDate lessonDate,
        LessonAttendanceStatus status,
        UUID markedByUserId,
        OffsetDateTime markedAt,
        String remarks,
        long version) {
}
