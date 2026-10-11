package com.school.dolphin.attendance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record ParentLessonAttendanceSummaryResponse(
        UUID studentId,
        LocalDate startDate,
        LocalDate endDate,
        long attendedLessons,
        long missedLessons,
        long excusedLessons,
        long eligibleLessons,
        BigDecimal attendancePercentage) {
}
