package com.school.dolphin.attendance.dto;

import java.util.UUID;

import com.school.dolphin.attendance.entity.LessonAttendanceStatus;

public record LessonAttendanceRosterItemResponse(
        UUID studentId,
        String studentName,
        UUID attendanceRecordId,
        LessonAttendanceStatus status,
        String remarks) {
}