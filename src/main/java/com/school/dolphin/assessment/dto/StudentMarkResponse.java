
package com.school.dolphin.assessment.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record StudentMarkResponse(
        UUID markId,
        UUID assessmentId,
        UUID studentId,
        String admissionNumber,
        String firstName,
        String lastName,
        BigDecimal marksObtained,
        BigDecimal maxMarks,
        String remarks,
        Long version
) {}