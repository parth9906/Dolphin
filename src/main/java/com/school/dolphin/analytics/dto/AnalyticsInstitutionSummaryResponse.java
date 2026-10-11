package com.school.dolphin.analytics.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AnalyticsInstitutionSummaryResponse(
        UUID institutionId,
        LocalDate fromDate,
        LocalDate toDate,
        long activeStudents,
        long activeStaff,
        long activeEnrollments,
        long attendancePresent,
        long attendanceAbsent,
        long attendanceLate,
        long attendanceExcused,
        long attendanceEligible,
        BigDecimal attendancePercentage
) {}
