
package com.school.dolphin.attendance.dto;

import com.school.dolphin.attendance.entity.AttendanceStatus;

import java.time.LocalDate;
import java.util.UUID;

public record AttendanceResponse(
        UUID id,
        UUID studentId,
        UUID institutionId,
        LocalDate attendanceDate,
        AttendanceStatus status,
        String remarks
) {}