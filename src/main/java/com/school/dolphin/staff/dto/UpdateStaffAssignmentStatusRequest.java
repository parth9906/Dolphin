package com.school.dolphin.staff.dto;

import com.school.dolphin.staff.entity.StaffAssignmentStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateStaffAssignmentStatusRequest(
        @NotNull StaffAssignmentStatus status
) {}