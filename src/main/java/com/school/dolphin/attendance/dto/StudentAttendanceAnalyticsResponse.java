package com.school.dolphin.attendance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StudentAttendanceAnalyticsResponse(
        UUID studentId,
        String studentName,
        long attendedLessons,
        long missedLessons,
        long excusedLessons,
        long eligibleLessons,
        BigDecimal attendancePercentage) {
}