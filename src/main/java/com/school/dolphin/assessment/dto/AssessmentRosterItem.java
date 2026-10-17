
package com.school.dolphin.assessment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record AssessmentRosterItem(
        UUID studentId,
        String admissionNumber,
        String firstName,
        String lastName,
        UUID markId,
        BigDecimal marksObtained,
        BigDecimal maxMarks,
        String remarks,
        Long version
) {}
