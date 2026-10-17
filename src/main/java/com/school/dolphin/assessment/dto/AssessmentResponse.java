
package com.school.dolphin.assessment.dto;

import com.school.dolphin.assessment.entity.AssessmentScope;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record AssessmentResponse(
        UUID id,
        UUID institutionId,
        AssessmentScope scopeType,
        UUID schoolClassId,
        UUID sectionId,
        String name,
        String subjectName,
        LocalDate assessmentDate,
        BigDecimal maxMarks,
        boolean active
) {}
