package com.school.dolphin.attendance.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

import com.school.dolphin.attendance.entity.LessonAttendanceStatus;

public record ParentLessonAttendanceItemResponse(
        UUID attendanceRecordId,
        UUID occurrenceId,
        LocalDate lessonDate,
        LocalTime startTime,
        LocalTime endTime,
        String subjectName,
        LessonAttendanceStatus status,
        String remarks) {
}