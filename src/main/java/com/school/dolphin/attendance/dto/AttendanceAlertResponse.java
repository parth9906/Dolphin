package com.school.dolphin.attendance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AttendanceAlertResponse(
        UUID id,
        UUID studentId,
        LocalDate periodStart,
        LocalDate periodEnd,
        BigDecimal thresholdPercent,
        BigDecimal attendancePercent,
        String status,
        OffsetDateTime generatedAt,
        OffsetDateTime acknowledgedAt) {
}