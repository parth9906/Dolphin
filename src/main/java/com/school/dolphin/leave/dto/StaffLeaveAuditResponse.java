package com.school.dolphin.leave.dto;


import com.school.dolphin.leave.entity.LeaveRequestStatus;

import java.time.OffsetDateTime;
import java.util.UUID;

public record StaffLeaveAuditResponse(
        UUID id,
        LeaveRequestStatus previousStatus,
        LeaveRequestStatus newStatus,
        UUID changedByUserId,
        String comment,
        OffsetDateTime changedAt
) {}
