package com.school.dolphin.leave.dto;


import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.UUID;

public record CreateStaffLeaveRequest(
        @NotNull UUID staffMemberId,
        @NotNull UUID institutionId,
        @NotNull UUID leaveTypeId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @Size(max = 1000) String reason
) {}
