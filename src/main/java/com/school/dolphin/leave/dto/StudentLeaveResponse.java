package com.school.dolphin.leave.dto;

import com.school.dolphin.leave.entity.LeaveRequestStatus;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record StudentLeaveResponse(
        UUID id,
        UUID studentId,
        UUID institutionId,
        UUID leaveTypeId,
        String leaveTypeCode,
        String leaveTypeName,
        LocalDate startDate,
        LocalDate endDate,
        String reason,
        LeaveRequestStatus status,
        UUID reviewedByUserId,
        OffsetDateTime reviewedAt,
        String decisionComment,
        OffsetDateTime createdAt
) {}
