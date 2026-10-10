
package com.school.dolphin.attendance.dto;

import com.school.dolphin.attendance.entity.AttendanceAuditAction;
import com.school.dolphin.attendance.entity.AttendanceStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AttendanceAuditResponse(
        UUID id,
        UUID attendanceRecordId,
        AttendanceAuditAction action,
        AttendanceStatus previousStatus,
        AttendanceStatus newStatus,
        String previousRemarks,
        String newRemarks,
        UUID changedByUserId,
        OffsetDateTime changedAt
) {}