
package com.school.dolphin.attendance.dto;

import java.time.LocalDate;
import java.util.UUID;

public record AttendanceSummaryResponse(
        UUID institutionId,
        UUID campusId,
        LocalDate attendanceDate,
        long presentCount,
        long absentCount,
        long lateCount,
        long excusedCount,
        long totalRecorded,
        long attendanceEligibleCount,
        double attendancePercentage
) {}