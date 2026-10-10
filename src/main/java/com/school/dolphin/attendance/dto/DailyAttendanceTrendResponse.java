
package com.school.dolphin.attendance.dto;

import java.time.LocalDate;

public record DailyAttendanceTrendResponse(
        LocalDate attendanceDate,
        long presentCount,
        long absentCount,
        long lateCount,
        long excusedCount,
        long totalRecorded,
        long attendanceEligibleCount,
        double attendancePercentage
) {}