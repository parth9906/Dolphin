
package com.school.dolphin.attendance.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record MarkAttendanceRequest(
        @NotNull UUID institutionId,
        @NotNull LocalDate attendanceDate,
        @NotEmpty
        @Size(max = 500)
        List<@Valid StudentAttendanceEntry> records
) {
    public record StudentAttendanceEntry(
            @NotNull UUID studentId,
            @NotNull com.school.dolphin.attendance.entity.AttendanceStatus status,
            @Size(max = 500) String remarks
    ) {}
}