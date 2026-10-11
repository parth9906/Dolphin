package com.school.dolphin.attendance.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.school.dolphin.attendance.entity.LessonAttendanceStatus;

public record LessonAttendanceAuditResponse(
        UUID id,
        UUID attendanceRecordId,
        LessonAttendanceStatus previousStatus,
        LessonAttendanceStatus newStatus,
        String previousRemarks,
        String newRemarks,
        UUID changedByUserId,
        OffsetDateTime changedAt) {
}