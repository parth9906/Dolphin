package com.school.dolphin.attendance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

public record GenerateAttendanceAlertsRequest(
        @NotNull UUID institutionId,
        @NotNull UUID sectionId,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate,
        @NotNull
        @DecimalMin("0.00")
        @DecimalMax("100.00")
        BigDecimal thresholdPercent) {
}