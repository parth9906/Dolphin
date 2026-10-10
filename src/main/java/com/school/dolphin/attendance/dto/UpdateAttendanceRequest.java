
package com.school.dolphin.attendance.dto;

import com.school.dolphin.attendance.entity.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateAttendanceRequest(
        @NotNull AttendanceStatus status,
        @Size(max = 500) String remarks
) {}