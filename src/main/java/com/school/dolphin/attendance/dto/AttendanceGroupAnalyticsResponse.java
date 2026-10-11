package com.school.dolphin.attendance.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AttendanceGroupAnalyticsResponse(
        UUID groupId,
        String groupName,
        long attendedLessons,
        long missedLessons,
        long excusedLessons,
        long eligibleLessons,
        BigDecimal attendancePercentage) {
}