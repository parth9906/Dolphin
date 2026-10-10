package com.school.dolphin.assessment.dto;

import java.math.BigDecimal;

public record SubjectResultResponse(
        String subjectName,
        int assessmentCount,
        BigDecimal marksObtained,
        BigDecimal maximumMarks,
        BigDecimal percentage,
        String grade
) {}