
package com.school.dolphin.assessment.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssessmentResponse(
        UUID id,
        UUID institutionId,
        String name,
        String subjectName,
        LocalDate assessmentDate,
        BigDecimal maxMarks,
        boolean active
) {}