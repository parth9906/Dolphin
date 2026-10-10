
package com.school.dolphin.parent.dto;

import com.school.dolphin.attendance.entity.AttendanceStatus;

import java.time.LocalDate;
import java.util.UUID;

public record ParentAttendanceResponse(
        UUID studentId,
        LocalDate attendanceDate,
        AttendanceStatus status,
        String remarks
) {}